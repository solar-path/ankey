import nodemailer from "nodemailer";

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || "mail.privateemail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "notify@ysollo.com";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "notify@ysollo.com";
const FROM_NAME = process.env.FROM_NAME || "YSollo";

// IMAP configuration (for reading emails if needed in future)
export const IMAP_HOST = process.env.IMAP_HOST || "mail.privateemail.com";
export const IMAP_PORT = parseInt(process.env.IMAP_PORT || "993");
export const IMAP_USER = process.env.IMAP_USER || "notify@ysollo.com";
export const IMAP_PASS = process.env.IMAP_PASS || "";

// Create reusable transporter
const transportOptions: any = {
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // Use STARTTLS for port 587 (use true for port 465)
  requireTLS: true, // Force TLS for security
  tls: {
    rejectUnauthorized: true, // Verify SSL certificates for production servers
    minVersion: "TLSv1.2", // Minimum TLS version
  },
};

// Only add auth if password is provided
if (SMTP_USER && SMTP_PASS) {
  transportOptions.auth = {
    user: SMTP_USER,
    pass: SMTP_PASS,
  };
}

export const transporter = nodemailer.createTransport(transportOptions);

// Email templates
export const emailTemplates = {
  verifyAccount: (code: string) => ({
    subject: "Verify Your Account - YSollo",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #000; margin: 0;">Welcome to YSollo!</h1>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h2 style="color: #000; margin-top: 0;">Verify Your Account</h2>
            <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>

            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #000; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
            </div>

            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't create an account with YSollo, please ignore this email.</p>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
            <p>© ${new Date().getFullYear()} YSollo. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to YSollo!\n\nYour verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't create an account with YSollo, please ignore this email.`,
  }),

  forgotPassword: (resetLink: string) => ({
    subject: "Reset Your Password - YSollo",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #000; margin: 0;">Password Reset Request</h1>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h2 style="color: #000; margin-top: 0;">Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${resetLink}</p>

            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
            <p>© ${new Date().getFullYear()} YSollo. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Password Reset Request\n\nWe received a request to reset your password.\n\nReset link: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`,
  }),

  jobOffer: (data: {
    candidateName: string;
    companyName: string;
    positionTitle: string;
    salary: number;
    currency: string;
    startDate: string;
    acceptLink: string;
    declineLink: string;
    expiresAt: string;
  }) => ({
    subject: `Job Offer - ${data.positionTitle} at ${data.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #000; margin: 0;">🎉 Congratulations!</h1>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h2 style="color: #000; margin-top: 0;">Job Offer</h2>
            <p>Dear ${data.candidateName},</p>

            <p>We are delighted to offer you the position of <strong>${
              data.positionTitle
            }</strong> at ${data.companyName}!</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #000;">Position Details</h3>
              <p style="margin: 5px 0;"><strong>Position:</strong> ${
                data.positionTitle
              }</p>
              <p style="margin: 5px 0;"><strong>Salary:</strong> ${
                data.currency
              } ${data.salary.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Start Date:</strong> ${
                data.startDate
              }</p>
            </div>

            <p>Please find the complete job offer document attached to this email. Review it carefully and let us know your decision.</p>

            <p><strong>This offer expires on ${data.expiresAt}</strong></p>

            <div style="text-align: center; margin: 30px 0;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 10px;">
                    <a href="${
                      data.acceptLink
                    }" style="background-color: #10b981; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">✓ Accept Offer</a>
                  </td>
                  <td style="padding: 0 10px;">
                    <a href="${
                      data.declineLink
                    }" style="background-color: #ef4444; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">✗ Decline Offer</a>
                  </td>
                </tr>
              </table>
            </div>

            <p style="font-size: 12px; color: #6c757d;">If the buttons don't work, you can copy and paste these links:</p>
            <p style="font-size: 11px; background-color: #f8f9fa; padding: 8px; border-radius: 4px; word-break: break-all;">Accept: ${
              data.acceptLink
            }</p>
            <p style="font-size: 11px; background-color: #f8f9fa; padding: 8px; border-radius: 4px; word-break: break-all;">Decline: ${
              data.declineLink
            }</p>

            <p>We look forward to welcoming you to our team!</p>

            <p>Best regards,<br>${data.companyName} HR Team</p>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${
      data.companyName
    }. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Job Offer - ${data.positionTitle}\n\nDear ${
      data.candidateName
    },\n\nWe are delighted to offer you the position of ${
      data.positionTitle
    } at ${data.companyName}!\n\nPosition: ${data.positionTitle}\nSalary: ${
      data.currency
    } ${data.salary.toLocaleString()}\nStart Date: ${
      data.startDate
    }\n\nThis offer expires on ${data.expiresAt}\n\nTo accept: ${
      data.acceptLink
    }\nTo decline: ${
      data.declineLink
    }\n\nWe look forward to welcoming you to our team!\n\nBest regards,\n${
      data.companyName
    } HR Team`,
  }),

  employeeAgreement: (data: {
    employeeName: string;
    companyName: string;
    positionTitle: string;
    signLink: string;
  }) => ({
    subject: `Employment Agreement - ${data.positionTitle} at ${data.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #000; margin: 0;">📋 Employment Agreement</h1>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h2 style="color: #000; margin-top: 0;">Action Required: Sign Your Employment Agreement</h2>
            <p>Dear ${data.employeeName},</p>

            <p>Your job offer has been approved! Please review and sign your employment agreement to complete the onboarding process.</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #000;">Next Steps</h3>
              <p style="margin: 5px 0;">1. Review the attached employment agreement carefully</p>
              <p style="margin: 5px 0;">2. Click the button below to sign electronically</p>
              <p style="margin: 5px 0;">3. Submit any required documents</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                data.signLink
              }" style="background-color: #000; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">📝 Review & Sign Agreement</a>
            </div>

            <p style="font-size: 12px; color: #6c757d;">If the button doesn't work, you can copy and paste this link:</p>
            <p style="font-size: 11px; background-color: #f8f9fa; padding: 8px; border-radius: 4px; word-break: break-all;">${
              data.signLink
            }</p>

            <p>If you have any questions, please don't hesitate to contact us.</p>

            <p>Best regards,<br>${data.companyName} HR Team</p>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${
      data.companyName
    }. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Employment Agreement - ${data.positionTitle}\n\nDear ${data.employeeName},\n\nYour job offer has been approved! Please review and sign your employment agreement to complete the onboarding process.\n\nSign your agreement here: ${data.signLink}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\n${data.companyName} HR Team`,
  }),

  inquiryConfirmation: (data: {
    name: string;
    inquiryId: string;
    trackLink: string;
  }) => ({
    subject: "Inquiry Received - YSollo Support",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #000; margin: 0;">✉️ Inquiry Received</h1>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h2 style="color: #000; margin-top: 0;">Thank You for Contacting Us!</h2>
            <p>Dear ${data.name},</p>

            <p>We have successfully received your inquiry. Our team will review it and get back to you as soon as possible.</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #000;">Your Inquiry ID</h3>
              <p style="font-family: monospace; font-size: 14px; background-color: #fff; padding: 10px; border-radius: 4px; margin: 10px 0;">${data.inquiryId}</p>
              <p style="font-size: 12px; color: #6c757d; margin: 0;">Please save this ID to track the status of your inquiry.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.trackLink}" style="background-color: #000; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">📊 Track Your Inquiry</a>
            </div>

            <p style="font-size: 12px; color: #6c757d;">If the button doesn't work, you can copy and paste this link:</p>
            <p style="font-size: 11px; background-color: #f8f9fa; padding: 8px; border-radius: 4px; word-break: break-all;">${data.trackLink}</p>

            <p>We typically respond within 24-48 hours during business days.</p>

            <p>Best regards,<br>YSollo Support Team</p>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
            <p>© ${new Date().getFullYear()} YSollo. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Inquiry Received - YSollo Support\n\nDear ${data.name},\n\nWe have successfully received your inquiry. Our team will review it and get back to you as soon as possible.\n\nYour Inquiry ID: ${data.inquiryId}\n\nPlease save this ID to track the status of your inquiry.\n\nTrack your inquiry here: ${data.trackLink}\n\nWe typically respond within 24-48 hours during business days.\n\nBest regards,\nYSollo Support Team`,
  }),
};

// Send email function
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
) {
  // Skip email sending if SMTP password is not configured
  if (!SMTP_PASS) {
    console.log("SMTP password not configured - skipping email", {
      module: "mail",
      to,
      subject,
    });
    console.log("Configure SMTP_PASS in .env to enable email sending", {
      module: "mail",
    });
    return { success: true, messageId: "dev-mode-no-password" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent successfully", {
      module: "mail",
      to,
      messageId: info.messageId,
      subject,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.log("Error sending email", { module: "mail", error, to, subject });
    // Don't throw, just log and return error
    return { success: false, error };
  }
}

// Helper functions for specific email types
export async function sendVerificationEmail(email: string, code: string) {
  const template = emailTemplates.verifyAccount(code);
  return sendEmail(email, template.subject, template.html, template.text);
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetLink = `${
    process.env.APP_URL || "http://localhost:5173"
  }/auth/reset-password?token=${resetToken}`;
  const template = emailTemplates.forgotPassword(resetLink);
  return sendEmail(email, template.subject, template.html, template.text);
}

export async function sendJobOfferEmail(data: {
  email: string;
  candidateName: string;
  companyName: string;
  positionTitle: string;
  salary: number;
  currency: string;
  startDate: Date;
  acceptToken: string;
  expiresAt: Date;
}) {
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const acceptLink = `${appUrl}/public/job-offer/${data.acceptToken}/accept`;
  const declineLink = `${appUrl}/public/job-offer/${data.acceptToken}/decline`;

  const template = emailTemplates.jobOffer({
    candidateName: data.candidateName,
    companyName: data.companyName,
    positionTitle: data.positionTitle,
    salary: data.salary,
    currency: data.currency,
    startDate: data.startDate.toLocaleDateString(),
    acceptLink,
    declineLink,
    expiresAt: data.expiresAt.toLocaleDateString(),
  });

  return sendEmail(data.email, template.subject, template.html, template.text);
}

export async function sendEmployeeAgreementEmail(data: {
  email: string;
  employeeName: string;
  companyName: string;
  positionTitle: string;
  signToken: string;
}) {
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const signLink = `${appUrl}/public/employee-agreement/${data.signToken}/sign`;

  const template = emailTemplates.employeeAgreement({
    employeeName: data.employeeName,
    companyName: data.companyName,
    positionTitle: data.positionTitle,
    signLink,
  });

  return sendEmail(data.email, template.subject, template.html, template.text);
}

export async function sendInquiryConfirmationEmail(data: {
  email: string;
  name: string;
  inquiryId: string;
}) {
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const trackLink = `${appUrl}/track-inquiry?id=${data.inquiryId}`;

  const template = emailTemplates.inquiryConfirmation({
    name: data.name,
    inquiryId: data.inquiryId,
    trackLink,
  });

  return sendEmail(data.email, template.subject, template.html, template.text);
}
