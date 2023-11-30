import * as dotenv from "dotenv";
import express from "express";
import cors from "cors"
import { oauthRouter } from "./oauth/oauth.router";
import { createClient } from 'redis';


dotenv.config();

const PORT: number = parseInt(process.env.PORT as string, 10)

const app = express()

app.use(cors());
app.use(express.json());

app.use("/api/oauth", oauthRouter)

export const client: any = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-18566.c251.east-us-mz.azure.cloud.redislabs.com',
        port: 18566
    }
});

client.connect();
client.on('connect', () => {
    console.log('Redis client connected');
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})
