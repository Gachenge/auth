import express, { Request, Response } from "express";
import { body, cookie, validationResult } from "express-validator";
import * as OauthService from "./oauth.service";

export const oauthRouter = express.Router();

oauthRouter.post(
  "/sign_up",
  body("email").isString(),
  body("password").isString(),
  body("confirm_password").isString(),
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

        return resp.status(200).json({ id, email });
      } else {
        return resp.status(400).json({ error: "Passwords do not match" });
      }
    } catch (error: any) {
      console.error("Error during user creation:", error);
      return resp.status(500).json({ error: error.message });
    }
  }
);


oauthRouter.post("/refresh", body("token").isString(), async (req: Request, resp: Response) => {
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
      console.error("Error during token refresh:", error);
      return resp.status(500).json({ error: error.message });
  }
});

oauthRouter.post("/logout", 
    body("refreshToken").isString(),
    body("accessToken").isString(),
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

            return resp.status(200).json({ message: "Logout successful" });
        } catch (error: any) {
            console.error("Error during logout:", error);
            return resp.status(500).json({ error: error.message });
        }
    }
);

oauthRouter.post(
  "/login",
  body("email").isString(),
  body("password").isString(),
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

        return resp.status(200).json({ id, email });
    } catch (error: any) {
      console.error("Error during user creation:", error);
      return resp.status(500).json({ error: error.message });
    }
  }
);

