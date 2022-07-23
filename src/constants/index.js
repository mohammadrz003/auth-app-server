import { config } from "dotenv";

config();

// APP CONSTANTS
export const DB = process.env.APP_DB;
export const PORT = process.env.PORT || process.env.APP_PORT;
export const DOMAIN = process.env.APP_DOMAIN;
export const SECRET = process.env.APP_SECRET;

// MAIL SENDER CONSTANTS
export const MAIL_HOST = process.env.APP_MAIL_HOST;
export const SENDER_MAIL = process.env.APP_SENDER_MAIL;
export const MAIL_PORT = process.env.APP_MAIL_PORT;
export const MAIL_USER = process.env.APP_MAIL_USER;
export const MAIL_PASSWORD = process.env.APP_MAIL_PASSWORD;
