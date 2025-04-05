const nodemailer = require("nodemailer");
const logger = require('../config/winston.config')

const sendEmail = async (email, subject, text, cc, bcc) => {
  const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    secure: true,
    secureConnection: false, // TLS requires secureConnection to be false
    tls: {
      ciphers: "SSLv3",
    },
    requireTLS: true,
    port: 465,
    debug: true,
    auth: {
      user: "hi@feedaq.com",
      pass: "Feedaq@123",
    },
  });

  const mailOptions = {
    from: "avikumar.gcs@feedaq.com",
    to: Array.isArray(email) ? email.join(', ') : email, // Join multiple recipients
    cc: Array.isArray(cc) && cc.length > 0 ? cc.join(', ') : undefined,
    bcc: Array.isArray(bcc) && bcc.length > 0 ? bcc.join(', ') : undefined,    subject: subject,
    text: text,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return resolve(false);
      } else {
        console.log("Email sent: " + info.response);
        return resolve(true);
      }
    });
  });
};

module.exports = { sendEmail };
