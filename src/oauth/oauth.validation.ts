import Joi from "joi"

export const validateLogin = (login: {email: string, password: string}) => {
    const loginSchema = Joi.object ({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(36).required(),
    })

    return loginSchema.validate(login)
}

export const validateSignup = (user: {email: string, password: string, confirm_password: string}) => {
    const userSchema = Joi.object ({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(36).required(),
        confirm_password: Joi.ref('password'),
    })

    return userSchema.validate(user)
}

export const validateLogout = (token: {refreshToken: string, accessToken: string}) => {
    const tokenSchema = Joi.object ({
        refreshToken: Joi.string(),
        accessToken: Joi.string(),
    })

    return tokenSchema.validate(token)
}

export const validateToken = (token: string) => {
    const refreshSchema = Joi.object ({
        token: Joi.string()
    })

    return refreshSchema.validate(token)
}
