import cors from "cors";
import consola from "consola";
import express from "express";
import mongoose from "mongoose";
import { json } from "body-parser";

// Import application constants
import { DB, PORT } from "./constants";

// Router exports
import userApis from "./apis/users";

// Initialize express application
const app = express();

// Apply application middlewares
app.use(cors());
app.use(json());

// Inject sub router and apis
app.use("/users", userApis);

const main = async () => {
  try {
    // Connect with the database
    await mongoose.connect(DB);
    consola.success("DATABASE CONNECTED...");
    // Start application listening for request on server
    app.listen(PORT, consola.success(`Server is running on port ${PORT}...`));
  } catch (error) {
    consola.error(`Unable to start the server \n${error.message}`);
  }
};

main();
