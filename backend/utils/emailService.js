const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4, // true for 465
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Check connection once
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ SMTP Error:", error);
  } else {
    console.log("✅ Gmail SMTP Connected");
  }
});

// Reusable send email function
exports.sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Cartify" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Email send error:", error);
    throw error;
  }
};

// ── OTP Email (Register) ─────────────────────────
exports.sendOTPEmail = async (toEmail, otp, userName = "") => {
  const html = `
    <h2>Hi ${userName},</h2>
    <p>Your OTP is:</p>
    <h1 style="font-size:32px;color:#f97316;">${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
  `;

  await sendEmail(toEmail, "Your OTP to Register on Cartify", html);
};

// ── Password Reset Email ─────────────────────────
exports.sendPasswordResetEmail = async (toEmail, otp, userName = "") => {
  const html = `
    <h2>Hi ${userName},</h2>
    <p>Your password reset OTP:</p>
    <h1 style="font-size:32px;color:#818cf8;">${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
  `;

  await sendEmail(toEmail, "Reset Your Cartify Password", html);
};

// ── Order Status Email ───────────────────────────
exports.sendOrderStatusEmail = async (toEmail, userName, order, status) => {
  const html = `
    <h2>Hi ${userName},</h2>
    <p>Your order status has been updated.</p>
    <p>Status: <strong>${status}</strong></p>
    <p>Order ID: ${order?._id || ""}</p>
  `;

  await sendEmail(toEmail, `Order Update - ${status}`, html);
};

// ── Refund Email ─────────────────────────────────
exports.sendRefundEmail = async (
  toEmail,
  userName,
  order,
  refundStatus,
  refundAmount
) => {
  const html = `
    <h2>Hi ${userName},</h2>
    <p>Your refund status:</p>
    <p>Status: <strong>${refundStatus}</strong></p>
    <p>Refund Amount: ₹${refundAmount}</p>
  `;

  await sendEmail(toEmail, `Refund ${refundStatus}`, html);
};

// ── Exchange Email ───────────────────────────────
exports.sendExchangeEmail = async (
  toEmail,
  userName,
  order,
  exchangeStatus,
  newItems
) => {
  const html = `
    <h2>Hi ${userName},</h2>
    <p>Your exchange request update:</p>
    <p>Status: <strong>${exchangeStatus}</strong></p>
  `;

  await sendEmail(toEmail, `Exchange ${exchangeStatus}`, html);
};