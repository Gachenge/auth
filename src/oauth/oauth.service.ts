import { db } from "../utils/db.server";
import * as bcrypt from 'bcrypt';
import * as dotenv from "dotenv";
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

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
const client: any = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-18566.c251.east-us-mz.azure.cloud.redislabs.com',
        port: 18566
    }
});

client.connect();

export const createUser = async (user: User): Promise<UserResponse> => {
    let { email, password } = user;

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
    try {
        if (client.status === 'end') {
            console.error('Redis client is closed. Cannot perform operations.');
        } else {
            await client.set(refreshToken, createdUser.id.toString(), { EX: 60 * 60 * 24 * 2 });
            console.log('Refresh token stored in Redis.');
        }
    } catch (error: any) {
        console.error("Error storing refresh token in Redis:", error.message);
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
            userId = await client.get(token);
        } catch (error: any) {
            console.error('Error getting data from Redis:', error);
            throw new Error('Error getting data from Redis');
        }

        const user = await db.user.findUnique({ where: { id: parseInt(userId, 10) } });

        if (!user) {
            throw new Error("Invalid token");
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
        console.error('Error during refresh:', error.message);
        throw new Error('Error during refresh');
    }
};

export const logout = async (refreshToken: string): Promise<void> => {
    const userId = await client.get(refreshToken);

    if (!userId) {
        throw new Error("Invalid or expired refresh token");
    }

    const user = await db.user.findUnique({ where: { id: parseInt(userId, 10) } });

    if (!user) {
        throw new Error("Invalid token. User not found");
    }

    client.del(refreshToken);
}
