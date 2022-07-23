import nodemailer from "nodemailer";
import {
  MAIL_HOST,
  SENDER_MAIL,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASSWORD,
} from "../constants";

const sendMail = async (receiverEmail, senderName, subject, text, html) => {
  try {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      tls: true,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASSWORD,
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: `"${senderName}" <${SENDER_MAIL}>`, // sender address
      to: receiverEmail, // list of receivers
      subject, // Subject line
      text, // plain text body
      html,
    });
    console.log("MAIL_SENT");
  } catch (error) {
    console.log("ERROR_MAILING", error.message);
  } finally {
    return;
  }
};

export default sendMail;
