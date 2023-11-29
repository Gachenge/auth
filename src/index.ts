import * as dotenv from "dotenv";
import express from "express";
import cors from "cors"
import { oauthRouter } from "./oauth/oauth.router";

dotenv.config();

const PORT: number = parseInt(process.env.PORT as string, 10)

const app = express()

app.use(cors());
app.use(express.json());

app.use("/api/oauth", oauthRouter)


app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})