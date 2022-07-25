import { join } from "path";
import { User } from "../models";
import { Router } from "express";
import { randomBytes } from "crypto";
import { DOMAIN, WEBSITE_NAME } from "../constants";
import sendMail from "../functions/email-sender";
import { userAuth } from "../middlewares/auth-guard";
import Validator from "../middlewares/validator-middleware";
import {
  RegisterValidations,
  AuthenticateValidations,
  ResetPassword,
} from "../validators";

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
        <h1>Hello, ${user.username}</h1>
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
        .json({ success: false, message: "An error occured" });
    }
  }
);

/**
 * @description To verify a new User's Account via email
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

/**
 * @description To authenticate an user and get auth token
 * @api /users/api/authenticate
 * @access Public
 * @type POST
 */
router.post(
  "/api/authenticate",
  AuthenticateValidations,
  Validator,
  async (req, res) => {
    try {
      let { username, password } = req.body;
      let user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Username not found.",
        });
      }
      if (!(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password.",
        });
      }
      let token = await user.generateJWT();
      return res.status(200).json({
        success: true,
        user: user.getUserInfo(),
        token: `Bearer ${token}`,
        message: "You are now logged in.",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "An error occured" });
    }
  }
);

/**
 * @description To get the authenticated user's profile info
 * @api /users/api/authenticate
 * @access Private
 * @type GET
 */
router.get("/api/authenticate", userAuth, async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});

/**
 * @description To initiate the password reset process
 * @api /users/api/reset-password
 * @access Public
 * @type PUT
 */
router.put(
  "/api/reset-password",
  ResetPassword,
  Validator,
  async (req, res) => {
    try {
      let { email } = req.body;
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User with this email is not found.",
        });
      }
      user.generatePasswordReset();
      await user.save();
      // Send the password reset link via the email
      let html = `
        <h1>Hello, ${user.username}</h1>
        <p>Please click the following link to reset your account's password</p>
        <p>if this password reset request is not created by you then you can ignore this email.</p>
        <a href="${DOMAIN}/users/reset-password-now/${user.resetPasswordToken}">Reset Password Now</a>
    `;
      sendMail(
        user.email,
        `${WEBSITE_NAME}`,
        "Reset Password",
        "Please Reset Your Password.",
        html
      );
      return res.status(200).json({
        success: true,
        message: "Pasword reset link is sent to your email.",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "An error occured" });
    }
  }
);

/**
 * @description To render reset password page
 * @api /users/reset-password-now/:resetPasswordToken
 * @access Restricted via email
 * @type GET
 */
router.get("/reset-password-now/:resetPasswordToken", async (req, res) => {
  try {
    let { resetPasswordToken } = req.params;
    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpiresIn: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Passwod reset token is invalid or has expired.",
      });
    }
    return res.sendFile(join(__dirname, "../templates/password-reset.html"));
  } catch (error) {
    return res.sendFile(join(__dirname, "../templates/errors.html"));
  }
});

/**
 * @description To reset the password
 * @api /users/api/reset-password-now
 * @access Restricted via email
 * @type POST
 */
router.post("/api/reset-password-now", async (req, res) => {
  try {
    let { password, resetPasswordToken } = req.body;
    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpiresIn: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Passwod reset token is invalid or has expired.",
      });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresIn = undefined;
    await user.save();
    // Send notification about the password reset successful process
    let html = `
        <h1>Hello, ${user.username}</h1>
        <p>Your password is resetted successfully</p>
        <p>if this reset is not done by you then you can contact our team.</p>
    `;
    sendMail(
      user.email,
      `${WEBSITE_NAME}`,
      "Reset Password Successful",
      "Your password is changed.",
      html
    );
    // Send successful response
    return res.status(200).json({
      success: true,
      message:
        "Your password reset request is complete and your password is resetted successfully. Login into your account with new password.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
});

export default router;
