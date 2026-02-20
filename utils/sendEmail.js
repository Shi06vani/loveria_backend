import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();    
const sendEmail = async (options) => {
  const transportData = {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
     delete transportData.auth;
  }

  console.log("Sending email with config:", {
      host: transportData.host,
      port: transportData.port,
      authUser: transportData.auth ? transportData.auth.user : "none",
  });

  const transporter = nodemailer.createTransport(transportData);

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // Plain text fallback
    html: options.message, // HTML content
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
