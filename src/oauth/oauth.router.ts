import express from "express";
import * as oauthController from "./oauth.controller";

export const oauthRouter = express.Router();

oauthRouter.post("/sign_up", oauthController.signupController);

oauthRouter.post("/refresh", oauthController.refreshController);

oauthRouter.post("/logout", oauthController.logoutController);

oauthRouter.post("/login", oauthController.loginController);
