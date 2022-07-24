import { User } from "../models";
import { Router } from "express";
import { join } from "path";
import { DOMAIN, WEBSITE_NAME } from "../constants";
import sendMail from "../functions/email-sender";
import { randomBytes } from "crypto";
import { RegisterValidations } from "../validators";
import Validator from "../middlewares/validator-middleware";

const router = Router();

/**
 * @description To create a new User Account
 * @api /users/api/register
 * @access Public
 * @type POST
 */
router.post(
  "/api/register",
  RegisterValidations,
  Validator,
  async (req, res) => {
    try {
      let { username, email } = req.body;
      // Check if the username is taken or not
      let user = await User.findOne({ username });
      if (user) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken.",
        });
      }
      // Check if the user exist with that email
      user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          success: false,
          message:
            "Email is already registered. Did you forget the password. Try resetting it.",
        });
      }

      // Create new user
      user = new User({
        ...req.body,
        verificationCode: randomBytes(20).toString("hex"),
      });
      await user.save();
      // Send the email to the user with a verification link
      let html = `
        <h1>Hello, ${username}</h1>
        <p>Please click the following link to verify your account</p>
        <a href="${DOMAIN}/users/verify-now/${user.verificationCode}">Verify Now</a>
    `;
      sendMail(
        user.email,
        `${WEBSITE_NAME}`,
        "Verify Account",
        "Please Verify Your Account.",
        html
      );
      return res.status(201).json({
        success: true,
        message: "Your account is created please verify your email address.",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong." });
    }
  }
);

/**
 * @description Verify User Account
 * @api /users/verify-now/:verificationCode
 * @access Public <Only via email>
 * @type GET
 */
router.get("/verify-now/:verificationCode", async (req, res) => {
  try {
    let { verificationCode } = req.params;
    let user = await User.findOne({ verificationCode });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Invalid verification code.",
      });
    }
    user.verified = true;
    user.verificationCode = undefined;
    await user.save();
    return res.sendFile(
      join(__dirname, "../templates/verification-success.html")
    );
  } catch (error) {
    console.log("ERR", error.message);
    return res.sendFile(join(__dirname, "../templates/errors.html"));
  }
});

export default router;
