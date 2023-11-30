import { db } from "../utils/db.server";
import * as bcrypt from 'bcrypt';
import * as dotenv from "dotenv";
import jwt from 'jsonwebtoken';
import { InvalidToken, RedisClosed, UnexpectedError, UserAlreadyRegistered, UserNotFound, WrongPassword } from "../../errors";
import { redis } from "../utils/redis";

dotenv.config();

type User = {
    id: number;
    email: string;
    password: string;
}

type UserResponse = {
    user: Omit<User, "password">;
    accessToken: string;
    refreshToken: string;
}

const secret: string = process.env.SECRET || "supersecret";

export const createUser = async (user: User): Promise<UserResponse> => {
    let { email, password } = user;

    const userExist = await db.user.findUnique({ where: { email }})
    if (userExist) {
        throw new UserAlreadyRegistered()
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a new access token
    const accessToken = jwt.sign({ userId: user.id }, secret, {
        expiresIn: '15m',
    });

    // Generate refresh token
    const refreshToken = jwt.sign({ userId: user.id }, secret, {
        expiresIn: '2d',
    });

    // Save the user data in the database
    const createdUser = await db.user.create({
        data: {
            email,
            password: hashedPassword,
        },
        select: {
            id: true,
            email: true,
        }
    });

    // Save the refresh token in Redis with  2-day expiration
    console.log(redis.status)
    try {
        if (redis.status === 'end') {
            throw new RedisClosed()
        } else {
            await redis.set(refreshToken, createdUser.id.toString(), 'EX', 60 * 60 * 24 * 2 );
            console.log('Refresh token stored in Redis.');
        }
    } catch (error: any) {
        console.log(error.message)
        throw new UnexpectedError()
    }

    return {
        user: createdUser,
        accessToken,
        refreshToken,
    };
};

export const refresh = async (token: string): Promise<Omit<UserResponse, "refreshToken">> => {
    try {
        let userId = "";

        try {
            userId = await redis.get(token);
        } catch (error: any) {
            throw new UnexpectedError()
        }

        const user = await db.user.findUnique({ where: { id: parseInt(userId, 10) } });

        if (!user) {
            throw new InvalidToken()
        }

        // Generate a new access token
        const newAccessToken = jwt.sign({ userId: user.id }, secret, {
            expiresIn: '15m',
        });

        return {
            accessToken: newAccessToken,
            user: user,
        };
    } catch (error: any) {
        throw new UnexpectedError()
    }
};

export const logout = async (refreshToken: string): Promise<void> => {
    const userId = await redis.get(refreshToken);

    if (!userId) {
        throw new InvalidToken()
    }

    const user = await db.user.findUnique({ where: { id: parseInt(userId, 10) } });

    if (!user) {
        throw new UserNotFound()
    }

    redis.del(refreshToken);
}

export const login = async (user: User): Promise<UserResponse> => {
    const { email, password } = user;

    const savedUser = await db.user.findUnique({ where: { email } });

    if (!savedUser) {
        throw new UserNotFound()
    }

    const isPasswordValid = await bcrypt.compare(password, savedUser.password);

    if (!isPasswordValid) {
        throw new WrongPassword()
    }

    // Generate a new access token
    const accessToken = jwt.sign({ userId: savedUser.id }, secret, {
        expiresIn: '15m',
    });

    // Generate refresh token
    const refreshToken = jwt.sign({ userId: savedUser.id }, secret, {
        expiresIn: '2d',
    });

    // Save the refresh token in Redis with 2-day expiration
    try {
        if (redis.status === 'end') {
            throw new RedisClosed()
        } else {
            await redis.set(refreshToken, savedUser.id.toString(), 'EX', 60 * 60 * 24 * 2 );
            console.log('Refresh token stored in Redis.');
        }
    } catch (error: any) {
        throw new UnexpectedError()
    }

    return {
        user: savedUser,
        accessToken,
        refreshToken,
    };
};
