const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── Register OTP Email ────────────────────────────────────────────
exports.sendOTPEmail = async (toEmail, otp, userName = '') => {
  await transporter.sendMail({
    from: `"Cartify 🛒" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Your OTP to Register on Cartify',
    html: `
      <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
          <tr><td align="center">
            <table style="max-width:520px;width:100%;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:24px;border:1px solid rgba(249,115,22,0.2);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:36px 40px;text-align:center;">
                <div style="font-size:36px;">🛒</div>
                <h1 style="margin:8px 0 0;color:#fff;font-size:28px;font-weight:800;">Cartify</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your Smart Shopping Destination</p>
              </td></tr>
              <tr><td style="padding:40px;">
                <h2 style="color:#fff;font-size:22px;">Verify Your Email 👋</h2>
                <p style="color:rgba(255,255,255,0.55);font-size:15px;line-height:1.6;">
                  Hi${userName ? ` <strong style="color:rgba(255,255,255,0.8);">${userName}</strong>` : ''}, use the OTP below to complete your Cartify registration.
                </p>
                <div style="background:rgba(249,115,22,0.08);border:2px solid rgba(249,115,22,0.3);border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
                  <p style="margin:0 0 8px;color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your One-Time Password</p>
                  <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#f97316;font-family:'Courier New',monospace;">${otp}</div>
                  <p style="margin:12px 0 0;color:rgba(255,255,255,0.35);font-size:12px;">⏱ Valid for <strong style="color:rgba(255,255,255,0.6);">10 minutes</strong></p>
                </div>
                <p style="color:rgba(255,255,255,0.35);font-size:13px;">Do not share this OTP with anyone.</p>
              </td></tr>
              <tr><td style="padding:20px 40px 30px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                <p style="color:rgba(255,255,255,0.2);font-size:12px;">© 2026 Cartify. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    `,
  });
};

// ── Password Reset Email ──────────────────────────────────────────
exports.sendPasswordResetEmail = async (toEmail, otp, userName = '') => {
  await transporter.sendMail({
    from: `"Cartify 🛒" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: '🔑 Reset Your Cartify Password',
    html: `
      <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
          <tr><td align="center">
            <table style="max-width:520px;width:100%;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:24px;border:1px solid rgba(99,102,241,0.25);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:36px 40px;text-align:center;">
                <div style="font-size:40px;">🔑</div>
                <h1 style="margin:8px 0 0;color:#fff;font-size:28px;font-weight:800;">Cartify</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Password Reset Request</p>
              </td></tr>
              <tr><td style="padding:40px;">
                <h2 style="color:#fff;font-size:22px;">Reset Your Password 🔐</h2>
                <p style="color:rgba(255,255,255,0.55);font-size:15px;line-height:1.6;">
                  Hi${userName ? ` <strong style="color:rgba(255,255,255,0.8);">${userName}</strong>` : ''}, use the OTP below to reset your Cartify password.
                </p>
                <div style="background:rgba(99,102,241,0.1);border:2px solid rgba(99,102,241,0.35);border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
                  <p style="margin:0 0 8px;color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Password Reset OTP</p>
                  <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#818cf8;font-family:'Courier New',monospace;">${otp}</div>
                  <p style="margin:12px 0 0;color:rgba(255,255,255,0.35);font-size:12px;">⏱ Valid for <strong style="color:rgba(255,255,255,0.6);">10 minutes</strong></p>
                </div>
                <div style="background:rgba(239,68,68,0.06);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:14px 16px;">
                  <p style="color:rgba(255,255,255,0.5);font-size:13px;">⚠️ Didn't request this? Ignore this email — your password won't change.</p>
                </div>
              </td></tr>
              <tr><td style="padding:20px 40px 30px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                <p style="color:rgba(255,255,255,0.2);font-size:12px;">© 2026 Cartify. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    `,
  });
};

// ── Order Status Email ────────────────────────────────────────────
exports.sendOrderStatusEmail = async (toEmail, userName, order, status) => {
  const statusConfig = {
    Pending:    { emoji: '🛒', color: '#f97316', title: 'Order Placed!',      subtitle: 'We received your order' },
    Paid:       { emoji: '✅', color: '#22c55e', title: 'Payment Confirmed!', subtitle: 'Your payment was successful' },
    Processing: { emoji: '⚙️', color: '#3b82f6', title: 'Order Processing',   subtitle: 'We are packing your order' },
    Shipped:    { emoji: '🚚', color: '#8b5cf6', title: 'Order Shipped!',     subtitle: 'Your order is on the way' },
    Delivered:  { emoji: '🎉', color: '#22c55e', title: 'Order Delivered!',   subtitle: 'Enjoy your purchase' },
    Cancelled:  { emoji: '❌', color: '#ef4444', title: 'Order Cancelled',    subtitle: 'Your order has been cancelled' },
  };

  const cfg = statusConfig[status] || statusConfig.Pending;
  const orderId = order._id.toString().slice(-8).toUpperCase();
  const itemsList = (order.items || []).map(item =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);font-size:14px;">
        ${item.product?.name || 'Product'} × ${item.qty}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#f97316;font-size:14px;text-align:right;font-weight:600;">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>`
  ).join('');

  const trackingSection = (status === 'Shipped' && order.trackingNumber) ? `
    <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
      <p style="margin:0;color:#a78bfa;font-size:20px;font-weight:800;letter-spacing:4px;font-family:'Courier New',monospace;">${order.trackingNumber}</p>
    </div>` : '';

  const deliverySection = order.estimatedDelivery ? `
    <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:14px 16px;margin:16px 0;display:flex;align-items:center;gap:10px;">
      <span style="font-size:20px;">📅</span>
      <div>
        <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;">Estimated Delivery</p>
        <p style="margin:2px 0 0;color:#f97316;font-size:15px;font-weight:700;">${order.estimatedDelivery}</p>
      </div>
    </div>` : '';

  await transporter.sendMail({
    from: `"Cartify 🛒" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `${cfg.emoji} ${cfg.title} — Order #${orderId} | Cartify`,
    html: `
      <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
          <tr><td align="center">
            <table style="max-width:560px;width:100%;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:24px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

              <!-- Header -->
              <tr><td style="background:linear-gradient(135deg,${cfg.color},${cfg.color}cc);padding:32px 40px;text-align:center;">
                <div style="font-size:48px;margin-bottom:8px;">${cfg.emoji}</div>
                <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">${cfg.title}</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${cfg.subtitle}</p>
              </td></tr>

              <!-- Body -->
              <tr><td style="padding:32px 40px;">
                <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px;">
                  Hi <strong style="color:#fff;">${userName}</strong>, here's an update on your order.
                </p>

                <!-- Order ID -->
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;">
                  <span style="color:rgba(255,255,255,0.4);font-size:13px;">Order ID</span>
                  <span style="color:#f97316;font-weight:700;font-size:14px;font-family:'Courier New',monospace;">#${orderId}</span>
                </div>

                <!-- Status Badge -->
                <div style="text-align:center;margin-bottom:20px;">
                  <span style="display:inline-block;background:${cfg.color}22;border:1px solid ${cfg.color}55;color:${cfg.color};padding:8px 20px;border-radius:50px;font-size:14px;font-weight:700;">
                    ${cfg.emoji} ${status}
                  </span>
                </div>

                ${trackingSection}
                ${deliverySection}

                <!-- Items -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;margin-bottom:20px;">
                  <p style="margin:0 0 12px;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order Items</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${itemsList}
                    <tr>
                      <td style="padding:12px 0 0;color:#fff;font-size:15px;font-weight:700;">Total</td>
                      <td style="padding:12px 0 0;color:#f97316;font-size:16px;font-weight:800;text-align:right;">₹${order.totalAmount?.toLocaleString()}</td>
                    </tr>
                  </table>
                </div>

                <!-- Shipping -->
                ${order.shippingAddress ? `
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;">
                  <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Shipping To</p>
                  <p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;">
                    <strong style="color:#fff;">${order.shippingAddress.name}</strong><br>
                    ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} — ${order.shippingAddress.pincode}<br>
                    📞 ${order.shippingAddress.phone}
                  </p>
                </div>` : ''}
              </td></tr>

              <!-- Footer -->
              <tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                <p style="margin:0 0 4px;color:rgba(255,255,255,0.25);font-size:12px;">Questions? Contact Cartify Support</p>
                <p style="margin:0;color:rgba(255,255,255,0.15);font-size:11px;">© 2026 Cartify. All rights reserved.</p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
    `,
  });
};

// ── Refund Status Email ───────────────────────────────────────────
// refundStatus: 'Initiated' | 'Processing' | 'Completed' | 'Failed'
// refundAmount: override amount (optional, defaults to order.totalAmount)
exports.sendRefundEmail = async (toEmail, userName, order, refundStatus = 'Initiated', refundAmount = null) => {
  const refundConfig = {
    Initiated:  { emoji: '🔄', color: '#f59e0b', title: 'Refund Initiated',   subtitle: 'Your refund request has been received' },
    Processing: { emoji: '⏳', color: '#3b82f6', title: 'Refund Processing',  subtitle: 'We are processing your refund' },
    Completed:  { emoji: '💰', color: '#22c55e', title: 'Refund Successful!', subtitle: 'Amount has been credited to your account' },
    Failed:     { emoji: '⚠️', color: '#ef4444', title: 'Refund Failed',      subtitle: 'We could not process your refund' },
  };

  const cfg = refundConfig[refundStatus] || refundConfig.Initiated;
  const orderId = order._id.toString().slice(-8).toUpperCase();
  const amount = refundAmount ?? order.totalAmount;

  const timelineMap = {
    Initiated:  '5–7 business days',
    Processing: '3–5 business days',
    Completed:  null,
    Failed:     null,
  };
  const timeline = timelineMap[refundStatus];

  const itemsList = (order.items || []).map(item =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);font-size:14px;">
        ${item.product?.name || 'Product'} × ${item.qty}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#f59e0b;font-size:14px;text-align:right;font-weight:600;">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>`
  ).join('');

  const amountColor = refundStatus === 'Completed' ? '34,197,94' : '245,158,11';
  const amountHex   = refundStatus === 'Completed' ? '#22c55e'   : '#f59e0b';

  await transporter.sendMail({
    from: `"Cartify 🛒" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `${cfg.emoji} ${cfg.title} — Order #${orderId} | Cartify`,
    html: `
      <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
          <tr><td align="center">
            <table style="max-width:560px;width:100%;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:24px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

              <!-- Header -->
              <tr><td style="background:linear-gradient(135deg,${cfg.color},${cfg.color}cc);padding:32px 40px;text-align:center;">
                <div style="font-size:48px;margin-bottom:8px;">${cfg.emoji}</div>
                <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">${cfg.title}</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${cfg.subtitle}</p>
              </td></tr>

              <!-- Body -->
              <tr><td style="padding:32px 40px;">
                <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px;">
                  Hi <strong style="color:#fff;">${userName}</strong>, here's an update on your refund request.
                </p>

                <!-- Order ID -->
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;justify-content:space-between;">
                  <span style="color:rgba(255,255,255,0.4);font-size:13px;">Order ID</span>
                  <span style="color:#f97316;font-weight:700;font-size:14px;font-family:'Courier New',monospace;">#${orderId}</span>
                </div>

                <!-- Refund Amount Highlight -->
                <div style="background:rgba(${amountColor},0.1);border:2px solid rgba(${amountColor},0.3);border-radius:16px;padding:24px;text-align:center;margin-bottom:20px;">
                  <p style="margin:0 0 6px;color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Refund Amount</p>
                  <div style="font-size:36px;font-weight:900;color:${amountHex};">₹${amount?.toLocaleString()}</div>
                  ${timeline ? `<p style="margin:10px 0 0;color:rgba(255,255,255,0.4);font-size:12px;">⏱ Expected within <strong style="color:rgba(255,255,255,0.65);">${timeline}</strong></p>` : ''}
                </div>

                <!-- Status Badge -->
                <div style="text-align:center;margin-bottom:20px;">
                  <span style="display:inline-block;background:${cfg.color}22;border:1px solid ${cfg.color}55;color:${cfg.color};padding:8px 20px;border-radius:50px;font-size:14px;font-weight:700;">
                    ${cfg.emoji} ${refundStatus}
                  </span>
                </div>

                ${refundStatus === 'Completed' ? `
                <div style="background:rgba(34,197,94,0.07);border-left:3px solid #22c55e;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;">
                  <p style="margin:0;color:rgba(255,255,255,0.55);font-size:13px;">✅ The refund has been credited to your original payment method. It may take 1–2 business days to appear in your bank statement.</p>
                </div>` : ''}

                ${refundStatus === 'Failed' ? `
                <div style="background:rgba(239,68,68,0.07);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;">
                  <p style="margin:0;color:rgba(255,255,255,0.55);font-size:13px;">❗ We were unable to process your refund. Please contact our support team and we'll resolve this as soon as possible.</p>
                </div>` : ''}

                <!-- Items -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;">
                  <p style="margin:0 0 12px;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Refunded Items</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${itemsList}
                    <tr>
                      <td style="padding:12px 0 0;color:#fff;font-size:15px;font-weight:700;">Refund Total</td>
                      <td style="padding:12px 0 0;color:${amountHex};font-size:16px;font-weight:800;text-align:right;">₹${amount?.toLocaleString()}</td>
                    </tr>
                  </table>
                </div>
              </td></tr>

              <!-- Footer -->
              <tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                <p style="margin:0 0 4px;color:rgba(255,255,255,0.25);font-size:12px;">Need help? Contact Cartify Support</p>
                <p style="margin:0;color:rgba(255,255,255,0.15);font-size:11px;">© 2026 Cartify. All rights reserved.</p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
    `,
  });
};

// ── Exchange Request Email ────────────────────────────────────────
// exchangeStatus: 'Requested' | 'Approved' | 'Picked' | 'Dispatched' | 'Completed' | 'Rejected'
// newItems: [{ name, qty, price }] — replacement items shown when status is Dispatched/Completed
exports.sendExchangeEmail = async (toEmail, userName, order, exchangeStatus = 'Requested', newItems = []) => {
  const exchangeConfig = {
    Requested:  { emoji: '🔃', color: '#f97316', title: 'Exchange Requested',   subtitle: 'We received your exchange request' },
    Approved:   { emoji: '✅', color: '#22c55e', title: 'Exchange Approved!',   subtitle: 'Your exchange has been approved' },
    Picked:     { emoji: '📦', color: '#3b82f6', title: 'Item Picked Up',       subtitle: 'Your original item has been collected' },
    Dispatched: { emoji: '🚚', color: '#8b5cf6', title: 'New Item Dispatched!', subtitle: 'Your replacement is on the way' },
    Completed:  { emoji: '🎉', color: '#22c55e', title: 'Exchange Complete!',   subtitle: 'Enjoy your new item' },
    Rejected:   { emoji: '❌', color: '#ef4444', title: 'Exchange Rejected',    subtitle: 'We could not approve your exchange' },
  };

  const cfg = exchangeConfig[exchangeStatus] || exchangeConfig.Requested;
  const orderId = order._id.toString().slice(-8).toUpperCase();

  const originalItemsList = (order.items || []).map(item =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.55);font-size:14px;text-decoration:line-through;">
        ${item.product?.name || 'Product'} × ${item.qty}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.3);font-size:14px;text-align:right;font-weight:600;text-decoration:line-through;">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>`
  ).join('');

  const newItemsList = newItems.map(item =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);font-size:14px;">
        ${item.name || 'Product'} × ${item.qty}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#22c55e;font-size:14px;text-align:right;font-weight:600;">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>`
  ).join('');

  const newItemsSection = newItemsList ? `
    <div style="background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.18);border-radius:12px;padding:18px;margin-top:12px;">
      <p style="margin:0 0 12px;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">✨ Replacement Items</p>
      <table width="100%" cellpadding="0" cellspacing="0">${newItemsList}</table>
    </div>` : '';

  const statusMessages = {
    Approved:   `<div style="background:rgba(34,197,94,0.07);border-left:3px solid #22c55e;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;"><p style="margin:0;color:rgba(255,255,255,0.55);font-size:13px;">✅ Please keep your original item ready for pickup. Our delivery partner will collect it within 2–3 business days.</p></div>`,
    Dispatched: `<div style="background:rgba(139,92,246,0.07);border-left:3px solid #8b5cf6;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;"><p style="margin:0;color:rgba(255,255,255,0.55);font-size:13px;">🚚 Your replacement item is on its way and will arrive within 3–5 business days.</p></div>`,
    Rejected:   `<div style="background:rgba(239,68,68,0.07);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;"><p style="margin:0;color:rgba(255,255,255,0.55);font-size:13px;">❗ Your exchange could not be approved. This may be due to the exchange window or item condition. Please contact our support for assistance.</p></div>`,
  };

  await transporter.sendMail({
    from: `"Cartify 🛒" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `${cfg.emoji} ${cfg.title} — Order #${orderId} | Cartify`,
    html: `
      <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
          <tr><td align="center">
            <table style="max-width:560px;width:100%;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:24px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

              <!-- Header -->
              <tr><td style="background:linear-gradient(135deg,${cfg.color},${cfg.color}cc);padding:32px 40px;text-align:center;">
                <div style="font-size:48px;margin-bottom:8px;">${cfg.emoji}</div>
                <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">${cfg.title}</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${cfg.subtitle}</p>
              </td></tr>

              <!-- Body -->
              <tr><td style="padding:32px 40px;">
                <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px;">
                  Hi <strong style="color:#fff;">${userName}</strong>, here's an update on your exchange request.
                </p>

                <!-- Order ID -->
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;justify-content:space-between;">
                  <span style="color:rgba(255,255,255,0.4);font-size:13px;">Original Order ID</span>
                  <span style="color:#f97316;font-weight:700;font-size:14px;font-family:'Courier New',monospace;">#${orderId}</span>
                </div>

                <!-- Status Badge -->
                <div style="text-align:center;margin-bottom:20px;">
                  <span style="display:inline-block;background:${cfg.color}22;border:1px solid ${cfg.color}55;color:${cfg.color};padding:8px 20px;border-radius:50px;font-size:14px;font-weight:700;">
                    ${cfg.emoji} ${exchangeStatus}
                  </span>
                </div>

                ${statusMessages[exchangeStatus] || ''}

                <!-- Original Items -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;margin-bottom:12px;">
                  <p style="margin:0 0 12px;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">🔄 Original Items</p>
                  <table width="100%" cellpadding="0" cellspacing="0">${originalItemsList}</table>
                </div>

                ${newItemsSection}

                <!-- Shipping Address -->
                ${order.shippingAddress ? `
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;margin-top:12px;">
                  <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Deliver To</p>
                  <p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;">
                    <strong style="color:#fff;">${order.shippingAddress.name}</strong><br>
                    ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} — ${order.shippingAddress.pincode}<br>
                    📞 ${order.shippingAddress.phone}
                  </p>
                </div>` : ''}
              </td></tr>

              <!-- Footer -->
              <tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                <p style="margin:0 0 4px;color:rgba(255,255,255,0.25);font-size:12px;">Need help? Contact Cartify Support</p>
                <p style="margin:0;color:rgba(255,255,255,0.15);font-size:11px;">© 2026 Cartify. All rights reserved.</p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
    `,
  });
};