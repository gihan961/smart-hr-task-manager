const nodemailer = require('nodemailer');

// Initialize transporter with environment variables or fallback test transporter
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port || '587', 10),
      secure: port === '465',
      auth: { user, pass }
    });
    console.log('Nodemailer initialized with custom SMTP host:', host);
  } else {
    // Development fallback using Ethereal test mail account
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('Nodemailer initialized with Ethereal test account:', testAccount.user);
    } catch (err) {
      console.warn('Ethereal setup fallback to log-only transporter:', err.message);
      // JSON / Log fallback transporter
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }

  return transporter;
};

/**
 * Send Password Reset Email with Token/OTP
 */
const sendPasswordResetEmail = async ({ toEmail, resetToken, userName }) => {
  try {
    const transport = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"Smart HR RCM Security" <no-reply@apexrcm.com>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f19; color: #f1f5f9; padding: 30px; border-radius: 16px; border: 1px solid #312e81;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0;">Smart HR & Task Manager</h2>
          <p style="color: #94a3b8; font-size: 13px;">Apex Healthcare Revenue Cycle Management Platform</p>
        </div>

        <div style="background-color: #1e1b4b; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #4338ca;">
          <h3 style="color: #ffffff; margin-top: 0;">Password Reset Request</h3>
          <p style="font-size: 14px; color: #cbd5e1;">Hello ${userName || 'User'},</p>
          <p style="font-size: 14px; color: #cbd5e1;">We received a request to reset your password for your RCM Operations account.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #818cf8; background-color: #0f172a; padding: 12px 24px; border-radius: 10px; border: 1px solid #4f46e5; display: inline-block;">
              ${resetToken}
            </span>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            This reset code is valid for <strong>60 minutes</strong>. If you did not request a password reset, please ignore this email or contact your System Administrator immediately.
          </p>
        </div>

        <div style="text-align: center; font-size: 11px; color: #64748b;">
          <p>HIPAA Protected System • Apex Healthcare Solutions</p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `🔑 Password Reset Code: ${resetToken} - Smart HR System`,
      text: `Hello ${userName},\n\nYour password reset code is: ${resetToken}\nThis code expires in 60 minutes.\n\nIf you did not request this, please contact system admin.`,
      html: htmlContent
    });

    console.log(`[MAIL SERVICE] Password reset email sent to ${toEmail}. MessageID: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[MAIL SERVICE] Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (err) {
    console.error('[MAIL SERVICE ERROR] Failed to send reset email:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Send Welcome Email with Login Credentials for Admin Created Accounts
 */
const sendAccountCreatedEmail = async ({ toEmail, tempPassword, userName, role }) => {
  try {
    const transport = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"Smart HR RCM Admin" <no-reply@apexrcm.com>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f19; color: #f1f5f9; padding: 30px; border-radius: 16px; border: 1px solid #312e81;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0;">Welcome to Smart HR & Task Manager</h2>
          <p style="color: #94a3b8; font-size: 13px;">Apex Healthcare RCM Operations</p>
        </div>

        <div style="background-color: #1e1b4b; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #4338ca;">
          <h3 style="color: #ffffff; margin-top: 0;">Your Account Has Been Created</h3>
          <p style="font-size: 14px; color: #cbd5e1;">Hello ${userName},</p>
          <p style="font-size: 14px; color: #cbd5e1;">An account has been created for you with assigned role: <strong>${role}</strong>.</p>
          
          <div style="background-color: #0f172a; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
            <p style="margin: 5px 0; font-size: 13px; color: #94a3b8;">Email: <strong style="color: #f8fafc;">${toEmail}</strong></p>
            <p style="margin: 5px 0; font-size: 13px; color: #94a3b8;">Temporary Password: <strong style="color: #818cf8;">${tempPassword}</strong></p>
          </div>

          <p style="font-size: 12px; color: #94a3b8;">
            Please log in and reset your password immediately upon your first sign-in.
          </p>
        </div>

        <div style="text-align: center; font-size: 11px; color: #64748b;">
          <p>HIPAA Protected System • Apex Healthcare Solutions</p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `🎉 Welcome to Smart HR RCM System - Account Created`,
      text: `Hello ${userName},\n\nYour account has been created.\nEmail: ${toEmail}\nTemp Password: ${tempPassword}\nRole: ${role}`,
      html: htmlContent
    });

    console.log(`[MAIL SERVICE] Account welcome email sent to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[MAIL SERVICE ERROR] Failed to send welcome email:', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendAccountCreatedEmail
};
