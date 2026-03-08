const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  await resend.emails.send({
    from: 'Cartify <onboarding@resend.dev>',
    to,
    subject,
    html,
  });
};

exports.sendOTPEmail = async (toEmail, otp, userName = '') => {
  await sendEmail(toEmail, 'Your OTP to Register on Cartify', '<h2>Hi ' + userName + ',</h2><p>Your OTP is: <strong style="font-size:32px;color:#f97316;">' + otp + '</strong></p><p>Valid for 10 minutes.</p>');
};

exports.sendPasswordResetEmail = async (toEmail, otp, userName = '') => {
  await sendEmail(toEmail, 'Reset Your Cartify Password', '<h2>Hi ' + userName + ',</h2><p>Your reset OTP: <strong style="font-size:32px;color:#818cf8;">' + otp + '</strong></p><p>Valid for 10 minutes.</p>');
};

exports.sendOrderStatusEmail = async (toEmail, userName, order, status) => {
  await sendEmail(toEmail, 'Order Update - ' + status, '<h2>Hi ' + userName + ',</h2><p>Order status: <strong>' + status + '</strong></p>');
};

exports.sendRefundEmail = async (toEmail, userName, order, refundStatus, refundAmount) => {
  await sendEmail(toEmail, 'Refund ' + refundStatus, '<h2>Hi ' + userName + ',</h2><p>Refund status: <strong>' + refundStatus + '</strong></p>');
};

exports.sendExchangeEmail = async (toEmail, userName, order, exchangeStatus, newItems) => {
  await sendEmail(toEmail, 'Exchange ' + exchangeStatus, '<h2>Hi ' + userName + ',</h2><p>Exchange status: <strong>' + exchangeStatus + '</strong></p>');
};
