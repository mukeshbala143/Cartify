const axios = require('axios');

const sendBrevoEmail = async (to, subject, htmlContent) => {
  await axios.post('https://api.brevo.com/v3/smtp/email', {
    sender: { name: 'Cartify', email: 'noreply.cartify@gmail.com' },
    to: [{ email: to }],
    subject,
    htmlContent,
  }, {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
  });
};

exports.sendOTPEmail = async (toEmail, otp, userName = '') => {
  await sendBrevoEmail(toEmail, 'Your OTP to Register on Cartify', '<h2>Hi ' + userName + ',</h2><p>Your OTP is: <strong>' + otp + '</strong></p><p>Valid for 10 minutes.</p>');
};

exports.sendPasswordResetEmail = async (toEmail, otp, userName = '') => {
  await sendBrevoEmail(toEmail, 'Reset Your Cartify Password', '<h2>Hi ' + userName + ',</h2><p>Your reset OTP: <strong>' + otp + '</strong></p><p>Valid for 10 minutes.</p>');
};

exports.sendOrderStatusEmail = async (toEmail, userName, order, status) => {
  await sendBrevoEmail(toEmail, 'Order Update - ' + status, '<h2>Hi ' + userName + ',</h2><p>Order status: <strong>' + status + '</strong></p>');
};

exports.sendRefundEmail = async (toEmail, userName, order, refundStatus, refundAmount) => {
  await sendBrevoEmail(toEmail, 'Refund ' + refundStatus, '<h2>Hi ' + userName + ',</h2><p>Refund status: <strong>' + refundStatus + '</strong></p>');
};

exports.sendExchangeEmail = async (toEmail, userName, order, exchangeStatus, newItems) => {
  await sendBrevoEmail(toEmail, 'Exchange ' + exchangeStatus, '<h2>Hi ' + userName + ',</h2><p>Exchange status: <strong>' + exchangeStatus + '</strong></p>');
};
