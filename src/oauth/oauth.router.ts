import express, { Request, Response } from "express";
import { body, cookie, validationResult } from "express-validator";
import * as OauthService from "./oauth.service";

export const oauthRouter = express.Router();

const signUpValidationMiddleware = [
  body("email").isEmail(),
  body("password").isStrongPassword(),
  body("confirm_password"),
];

const refreshValidationMiddleware = [
  body("token").isString(),
];

const logoutValidationMiddleware = [
  body("refreshToken").isString(),
  body("accessToken").isString(),
]

const loginValidationMiddleware = [
  body("email").isEmail(),
  body("password").isString(),
]

oauthRouter.post(
  "/sign_up",
  signUpValidationMiddleware,
  async (req: Request, resp: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return resp.status(400).json({ errors: errors.array() });
    }

    try {
      const user = req.body;

      if (user.password === user.confirm_password) {
        const { user: newUser, accessToken } = await OauthService.createUser(user);

        const { id, email } = newUser;

        // Set the access token as a cookie in the response
        resp.cookie("access_token", accessToken, {
          expires: new Date(Date.now() + 15 * 60 * 1000),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        return resp.status(200).json({ success:true, id, email });
      } else {
        return resp.status(400).json({ error: "Passwords do not match" });
      }
    } catch (error: any) {
      if (error.message === "Email is already registered") {
        return resp.status(400).json({ error: "Email is already registered" });
      } else if (error.message === "Redis client is closed. Cannot perform operations.") {
        return resp.status(500).json({ error: "Redis client is closed. Cannot perform operations."});
      } else if (error.message === "Error storing refresh token in Redis") {
        return resp.status(500).json({ error: `Error storing refresh token in Redis: ${error.message}`})
      }
      return resp.status(500).json({ error: error.message });
    }
  }
);

oauthRouter.post("/refresh", refreshValidationMiddleware, async (req: Request, resp: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return resp.status(400).json({ errors: errors.array() });
  }

  try {
      const token: { token: string } = req.body;

      const { accessToken, user } = await OauthService.refresh(token.token);

      resp.cookie("access_token", accessToken, {
          expires: new Date(Date.now() + 15 * 60 * 1000),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
      });

      return resp.status(200).json({ user });
  } catch (error: any) {
    if (error.message === "Error getting data from Redis") {
      return resp.status(500).json(`Error getting data from Redis: ${error.message}`)
    } else if (error.message === "Invalid token") {
      return resp.status(401).json(`Invalid token: ${error.message}`)
    }
      return resp.status(500).json({ error: error.message });
  }
});

oauthRouter.post("/logout", logoutValidationMiddleware,
    async (req: Request, resp: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return resp.status(400).json({ errors: errors.array() });
        }

        try {
            const { refreshToken, accessToken } = req.body;

            await OauthService.logout(refreshToken);

            // Clear the access token cookie in the response
            resp.clearCookie("access_token");

            return resp.status(200).json({ success: true, message: "Logout successful" });
        } catch (error: any) {
          if (error.message === "Invalid or expired refresh token") {
            return resp.status(401).json("Invalid or expired token")
          } else if (error.message === "Invalid token. User not found") {
            return resp.status(404).json("Invalid token. User not found")
          }
            return resp.status(500).json({ error: error.message });
        }
    }
);

oauthRouter.post(
  "/login", loginValidationMiddleware,
  async (req: Request, resp: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return resp.status(400).json({ errors: errors.array() });
    }

    try {
      const user = req.body;

      const { user: newUser, accessToken } = await OauthService.login(user);

      const { id, email } = newUser;

      // Set the access token as a cookie in the response
        resp.cookie("access_token", accessToken, {
          expires: new Date(Date.now() + 15 * 60 * 1000),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        return resp.status(200).json({ success: true, id, email });
    } catch (error: any) {
      if (error.message === "User not found") {
        return resp.status(404).json("User not found")
      } else if (error.message === "Wrong password") {
        return resp.status(401).json("Wrong password")
      }
      return resp.status(500).json({ error: error.message });
    }
  }
);
