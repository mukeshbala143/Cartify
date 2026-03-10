const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

exports.sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: '"Cartify" <' + process.env.GMAIL_USER + '>',
    to, subject, html,
  });
};

exports.sendOTPEmail = async (toEmail, otp, userName = '') => {
  await exports.sendEmail(toEmail, 'Your OTP - Cartify', '<h2>Hi ' + userName + ',</h2><p>OTP: <strong style="font-size:32px;color:#f97316;">' + otp + '</strong></p><p>Valid 10 min.</p>');
};
exports.sendPasswordResetEmail = async (toEmail, otp, userName = '') => {
  await exports.sendEmail(toEmail, 'Reset Password - Cartify', '<h2>Hi ' + userName + ',</h2><p>OTP: <strong style="font-size:32px;color:#818cf8;">' + otp + '</strong></p><p>Valid 10 min.</p>');
};
exports.sendOrderStatusEmail = async (toEmail, userName, order, status) => {
  await exports.sendEmail(toEmail, 'Order Update - ' + status, '<h2>Hi ' + userName + ',</h2><p>Status: <strong>' + status + '</strong></p><p>Order ID: ' + (order?._id || '') + '</p>');
};
exports.sendRefundEmail = async (toEmail, userName, order, refundStatus, refundAmount) => {
  await exports.sendEmail(toEmail, 'Refund ' + refundStatus, '<h2>Hi ' + userName + ',</h2><p>Status: <strong>' + refundStatus + '</strong></p><p>Amount: ₹' + refundAmount + '</p>');
};
exports.sendExchangeEmail = async (toEmail, userName, order, exchangeStatus) => {
  await exports.sendEmail(toEmail, 'Exchange ' + exchangeStatus, '<h2>Hi ' + userName + ',</h2><p>Status: <strong>' + exchangeStatus + '</strong></p>');
};
