import { logger } from "./logger";
import moment from 'moment';


export class UserAlreadyRegistered extends Error {
    constructor() {
        super("User is already registered");
        this.name = "User is already registered";
        logger.warn(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')} ${this.name}: ${this.message}`);
    }
}

export class RedisClosed extends Error {
    constructor() {
        super("Redis client is closed");
        this.name = "Redis client is closed";
        logger.error(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')} ${this.name}: ${this.message}`);
    }
}

export class UnexpectedError extends Error {
    constructor() {
        super("Unexpected error")
        this.name = "Unexpected error occurred";
        logger.error(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')} ${this.name}: ${this.message}`);
    }
}

export class InvalidToken extends Error {
    constructor() {
        super("Invalid token");
        this.name = "Invalid token"
        logger.error(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')} ${this.name}: ${this.message}`);
    }
}

export class UserNotFound extends Error {
    constructor() {
        super("User not found");
        this.name = "User not found";
        logger.error(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')} ${this.name}: ${this.message}`);
    }
}

export class WrongPassword extends Error {
    constructor() {
        super("Wrong password")
        this.name = "Wrong password"
        logger.warn(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')} ${this.name}: ${this.message}`);
    }
}
