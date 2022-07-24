import cors from "cors";
import consola from "consola";
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import { json } from "body-parser";

// Import application constants
import { DB, PORT } from "./constants";

// Router imports
import userApis from "./apis/users";

// Import passport middleware
require('./middlewares/passpost-middleware');

// Initialize express application
const app = express();

// Apply application middlewares
app.use(cors());
app.use(json());
app.use(passport.initialize());

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
