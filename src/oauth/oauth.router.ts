import express, { Request, Response } from "express";
import { body, cookie, validationResult } from "express-validator";
import * as OauthService from "./oauth.service";
import { validateLogin, validateLogout, validateSignup, validateToken } from "./oauth.validation";

export const oauthRouter = express.Router();

oauthRouter.post(
  "/sign_up", async (req: Request, resp: Response) => {    
    try {
      const result = validateSignup(req.body)

      if (result.error) {
        return resp.status(400).json({ error: result.error.details })
      }

      const user = result.value

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

oauthRouter.post("/refresh", async (req: Request, resp: Response) => {
  try {
    const result = validateToken(req.body);
    if (result.error) {
      return resp.status(400).json({ error: result.error.details })
    }

    const token: { token: string } = result.value

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

oauthRouter.post("/logout", async (req: Request, resp: Response) => {
    try {

      const result = validateLogout(req.body)
      if (result.error) {
        return resp.status(400).json({ error: result.error.details })
      }

      const { refreshToken, accessToken } = result.value;

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
  "/login", async (req: Request, resp: Response) => {
    try {
      const result = validateLogin(req.body)

      if (result.error) {
        return resp.status(400).json({ error: result.error.details })
      }
      const user = result.value;

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
