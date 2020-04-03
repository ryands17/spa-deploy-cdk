import { config } from 'dotenv';
config();

export const REGION = process.env.REGION || 'us-east-1';
export const WEBSITE_NAME = 'my-website';
export const BUCKET_NAME = 'my-site-test';
