import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type {
  EmailResult,
  WorkspaceWelcomeData,
  UserInvitationData,
  PasswordResetData,
  EmailVerificationData,
  TwoFactorCodeData,
  AccessRequestNotificationData,
} from '@/shared'

export class EmailService {
  private transporter: Transporter

  constructor() {
    const config: any = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
    }

    // Only add auth if credentials are provided (for local Mailpit, no auth needed)
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      config.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    }

    this.transporter = nodemailer.createTransport(config)
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      })

      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Email send error:', error)
      return { success: false, error: 'Failed to send email' }
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()
  }

  // Welcome email for new workspace
  async sendWorkspaceWelcome(data: WorkspaceWelcomeData): Promise<EmailResult> {
    const subject = `🎉 Your ${data.workspaceName} workspace is ready!`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Ankey!</h1>
            <p>Your workspace "${data.workspaceName}" has been created successfully</p>
          </div>
          <div class="content">
            <p>Hi ${data.ownerName},</p>
            <p>Congratulations! Your workspace <strong>"${data.workspaceName}"</strong> is now ready to use.</p>
            <p>You can access your workspace at:</p>
            <p style="text-align: center;">
              <a href="${data.workspaceUrl}" class="button">Access Your Workspace</a>
            </p>
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Set up your team by inviting members</li>
              <li>Configure roles and permissions</li>
              <li>Explore the features available in your workspace</li>
            </ul>
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            <p>Best regards,<br>The Ankey Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${data.to}</p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(data.to, subject, html)
  }

  // User invitation email
  async sendUserInvitation(data: UserInvitationData): Promise<EmailResult> {
    const inviteUrl = `${data.workspaceUrl}/invite?token=${data.inviteToken}`
    const subject = `You've been invited to join ${data.workspaceName}`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📨 You're Invited!</h1>
            <p>Join ${data.workspaceName} on Ankey</p>
          </div>
          <div class="content">
            <p>Hi ${data.fullName},</p>
            <p>${data.inviterName} has invited you to join <strong>"${data.workspaceName}"</strong> workspace.</p>
            <p style="text-align: center;">
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </p>
            <p><strong>About your invitation:</strong></p>
            <ul>
              <li>This invitation is personalized for ${data.to}</li>
              <li>You'll need to set up your password when you first log in</li>
              <li>The invitation link expires in 7 days</li>
            </ul>
            <p>If you don't want to join this workspace, you can simply ignore this email.</p>
            <p>Best regards,<br>The Ankey Team</p>
          </div>
          <div class="footer">
            <p>This invitation was sent to ${data.to} by ${data.inviterName}</p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(data.to, subject, html)
  }

  // Password reset email
  async sendPasswordReset(data: PasswordResetData): Promise<EmailResult> {
    const subject = 'Reset your password'
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>Reset your ${data.isCore ? 'admin' : 'account'} password</p>
          </div>
          <div class="content">
            <p>Hi ${data.fullName},</p>
            <p>We received a request to reset the password for your account associated with ${data.to}.</p>
            <p style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>You can only use this link once</li>
                <li>If you didn't request this reset, please ignore this email</li>
              </ul>
            </div>
            <p>For security reasons, this link can only be used once and will expire after 1 hour.</p>
            <p>Best regards,<br>The Ankey Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${data.to}</p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(data.to, subject, html)
  }

  // Email verification
  async sendEmailVerification(data: EmailVerificationData): Promise<EmailResult> {
    const subject = 'Verify your email address'
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8B5CF6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✉️ Verify Your Email</h1>
            <p>Complete your account setup</p>
          </div>
          <div class="content">
            <p>Hi ${data.fullName},</p>
            <p>Please verify your email address to complete your account setup.</p>
            <p style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">${data.verificationUrl}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>Best regards,<br>The Ankey Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${data.to}</p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(data.to, subject, html)
  }

  // Two-factor authentication code
  async sendTwoFactorCode(data: TwoFactorCodeData): Promise<EmailResult> {
    const subject = 'Your verification code'
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .code { font-size: 32px; font-weight: bold; text-align: center; background: white; padding: 20px; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔢 Verification Code</h1>
            <p>Your two-factor authentication code</p>
          </div>
          <div class="content">
            <p>Hi ${data.fullName},</p>
            <p>Your verification code is:</p>
            <div class="code">${data.code}</div>
            <p>This code will expire in 10 minutes. Don't share this code with anyone.</p>
            <p>If you didn't request this code, please contact our support team immediately.</p>
            <p>Best regards,<br>The Ankey Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${data.to}</p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(data.to, subject, html)
  }

  // Access request notification
  async sendAccessRequestNotification(data: AccessRequestNotificationData): Promise<EmailResult> {
    const subject = `New access request for ${data.workspaceName}`
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .request-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>👋 New Access Request</h1>
            <p>Someone wants to join ${data.workspaceName}</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>A new user has requested access to your workspace <strong>"${data.workspaceName}"</strong>.</p>
            
            <div class="request-details">
              <h3>Request Details:</h3>
              <p><strong>Name:</strong> ${data.requesterName}</p>
              <p><strong>Email:</strong> ${data.requesterEmail}</p>
              <p><strong>Reason:</strong></p>
              <p style="font-style: italic; padding: 10px; background: #f3f4f6; border-radius: 3px;">"${data.reason}"</p>
            </div>

            <p style="text-align: center;">
              <a href="${data.approvalUrl}" class="button">Review Request</a>
            </p>

            <p>You can approve or deny this request from your admin panel.</p>
            <p>Best regards,<br>The Ankey Team</p>
          </div>
          <div class="footer">
            <p>This notification was sent to ${data.to}</p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(data.to, subject, html)
  }

  // Test email connection
  async testConnection(): Promise<EmailResult> {
    try {
      await this.transporter.verify()
      return { success: true, message: 'Email connection successful' }
    } catch (error) {
      console.error('Email connection test failed:', error)
      return { success: false, error: 'Email connection failed' }
    }
  }
}
