import * as nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (env.NODE_ENV === 'test') {
    logger.info({ to, subject }, 'Test mode: email not sent');
    return true;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    logger.warn('SMTP not configured, email not sent');
    return false;
  }

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info({ to, subject }, 'Email sent successfully');
    return true;
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  const subject = 'Verify your email address - Happy Feet';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ed7d1b 0%, #e05f0f 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Happy Feet</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome to Happy Feet, ${firstName}!</h2>
        <p style="color: #4b5563; font-size: 16px;">Thank you for creating an account. Please verify your email address to get started.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background: #ed7d1b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Verify Email Address</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Or copy this link to your browser:</p>
        <p style="color: #ed7d1b; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  const text = `Welcome to Happy Feet, ${firstName}! Please verify your email: ${verificationUrl}`;

  return sendEmail(email, subject, html, text);
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const subject = 'Reset your password - Happy Feet';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ed7d1b 0%, #e05f0f 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Happy Feet</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #4b5563; font-size: 16px;">Hi ${firstName}, we received a request to reset your password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #ed7d1b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Or copy this link to your browser:</p>
        <p style="color: #ed7d1b; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email or contact support.</p>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${firstName}, reset your password: ${resetUrl}`;

  return sendEmail(email, subject, html, text);
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
  const subject = 'Welcome to Happy Feet!';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ed7d1b 0%, #e05f0f 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Happy Feet</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome to Happy Feet, ${firstName}!</h2>
        <p style="color: #4b5563; font-size: 16px;">Your account has been successfully created and verified. You can now start shopping for premium Kenyan fashion.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.FRONTEND_URL}" style="display: inline-block; background: #ed7d1b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Start Shopping</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">If you have any questions, contact our support team.</p>
      </div>
    </body>
    </html>
  `;

  const text = `Welcome to Happy Feet, ${firstName}! Start shopping at ${env.FRONTEND_URL}`;

  return sendEmail(email, subject, html, text);
}

export async function sendPasswordChangedEmail(email: string, firstName: string): Promise<boolean> {
  const subject = 'Your password has been changed - Happy Feet';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ed7d1b 0%, #e05f0f 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Happy Feet</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1f2937; margin-top: 0;">Password Changed Successfully</h2>
        <p style="color: #4b5563; font-size: 16px;">Hi ${firstName}, your password has been successfully updated.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't make this change, please contact support immediately.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">For security, all other sessions have been logged out.</p>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${firstName}, your password has been changed. If you didn't make this change, contact support.`;

  return sendEmail(email, subject, html, text);
}
