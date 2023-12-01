export class UserAlreadyRegistered extends Error {
    constructor() {
        super("User is already registered");
        this.name = "UserAlreadyRegistered";
    }
}

export class RedisClosed extends Error {
    constructor() {
        super("Redis client is closed");
        this.name = "Redis client is closed";
    }
}

export class UnexpectedError extends Error {
    constructor() {
        super("Unexpected error")
        this.name = "Unexpected error occurred";
    }
}

export class InvalidToken extends Error {
    constructor() {
        super("Invalid token");
        this.name = "Invalid token"
    }
}

export class UserNotFound extends Error {
    constructor() {
        super("User not found");
        this.name = "User not found";
    }
}

export class WrongPassword extends Error {
    constructor() {
        super("Wrong password")
        this.name = "Wrong password"
    }
}
