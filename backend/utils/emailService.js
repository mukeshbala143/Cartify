const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendEmail = async (to, subject, html) => {
  const { error } = await resend.emails.send({
    from: 'Cartify <onboarding@resend.dev>',
    to,
    subject,
    html,
  });
  if (error) throw new Error(error.message);
};

exports.sendOTPEmail = async (toEmail, otp, userName = '') => {
  await exports.sendEmail(toEmail, 'Your OTP - Cartify', '<h2>Hi ' + userName + ',</h2><p>Your OTP: <strong style="font-size:32px;color:#f97316;">' + otp + '</strong></p><p>Valid for 10 minutes.</p>');
};
exports.sendPasswordResetEmail = async (toEmail, otp, userName = '') => {
  await exports.sendEmail(toEmail, 'Reset Password - Cartify', '<h2>Hi ' + userName + ',</h2><p>Reset OTP: <strong style="font-size:32px;color:#818cf8;">' + otp + '</strong></p><p>Valid for 10 minutes.</p>');
};
exports.sendOrderStatusEmail = async (toEmail, userName, order, status) => {
  await exports.sendEmail(toEmail, 'Order Update - ' + status, '<h2>Hi ' + userName + ',</h2><p>Order status: <strong>' + status + '</strong></p><p>Order ID: ' + (order?._id || '') + '</p>');
};
exports.sendRefundEmail = async (toEmail, userName, order, refundStatus, refundAmount) => {
  await exports.sendEmail(toEmail, 'Refund ' + refundStatus, '<h2>Hi ' + userName + ',</h2><p>Refund status: <strong>' + refundStatus + '</strong></p><p>Amount: ₹' + refundAmount + '</p>');
};
exports.sendExchangeEmail = async (toEmail, userName, order, exchangeStatus, newItems) => {
  await exports.sendEmail(toEmail, 'Exchange ' + exchangeStatus, '<h2>Hi ' + userName + ',</h2><p>Exchange status: <strong>' + exchangeStatus + '</strong></p>');
};
