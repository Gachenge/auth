import * as dotenv from "dotenv";
import { Redis } from "ioredis";

dotenv.config();

export const redis: any = new Redis({
    password: process.env.REDIS_PASSWORD,
    host: 'redis-18566.c251.east-us-mz.azure.cloud.redislabs.com',
    port: 18566,
});

redis.on('connect', () => {
    console.log('Connected to Redis server');
  });
  
redis.on('error', (error: any) => {
    console.error('Error connecting to Redis:', error.message);
});
