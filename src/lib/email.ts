import nodemailer from "nodemailer";

// Use Gmail SMTP server with GMAIL_ID and GMAIL_PASSWORD env variables
// For Gmail, use an App Password (not regular password) if 2FA is enabled
// Generate App Password: Google Account > Security > 2-Step Verification > App passwords
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for port 587
  auth: {
    user: process.env.GMAIL_ID,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.GMAIL_ID || "noreply@furniture-store.com";
const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL ||
  process.env.GMAIL_ID ||
  "support@furniture-store.com";

interface EmailOptions {
  to: string | string[]; // Can be a single email or array of emails
  subject: string;
  html: string;
  text?: string;
  bcc?: string | string[]; // BCC for bulk sends (privacy)
}

export async function sendEmail(options: EmailOptions) {
  try {
    // If 'to' is an array with multiple recipients, use BCC for privacy
    // and send to the first recipient (or a noreply address)
    let mailOptions: any = {
      from: FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    if (Array.isArray(options.to) && options.to.length > 1) {
      // Bulk send: use BCC for privacy, put all recipients in BCC
      mailOptions.to = FROM_EMAIL; // Send to self (or could use a noreply address)
      mailOptions.bcc = options.to; // All recipients in BCC
    } else {
      // Single recipient
      mailOptions.to = options.to;
      if (options.bcc) {
        mailOptions.bcc = options.bcc;
      }
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  name: string
) {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #333; font-size: 24px;">Welcome to Our Store!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 20px;">
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                    Hi ${name},
                  </p>
                  <p style="margin: 16px 0 0; color: #666; font-size: 16px; line-height: 1.6;">
                    Thank you for creating an account. Please verify your email address by clicking the button below:
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 30px; text-align: center;">
                  <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Verify Email
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 20px;">
                  <p style="margin: 0; color: #999; font-size: 14px; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 8px 0 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                    ${verificationUrl}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 40px;">
                  <p style="margin: 0; color: #999; font-size: 14px;">
                    This link will expire in 24 hours.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                    If you didn't create an account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    html,
    text: `Hi ${name}, Please verify your email by visiting: ${verificationUrl}`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name: string
) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #333; font-size: 24px;">Reset Your Password</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 20px;">
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                    Hi ${name},
                  </p>
                  <p style="margin: 16px 0 0; color: #666; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password. Click the button below to create a new password:
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 30px; text-align: center;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Reset Password
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 20px;">
                  <p style="margin: 0; color: #999; font-size: 14px; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 8px 0 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                    ${resetUrl}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 40px;">
                  <p style="margin: 0; color: #999; font-size: 14px;">
                    This link will expire in 1 hour.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                    If you didn't request a password reset, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your Password",
    html,
    text: `Hi ${name}, Reset your password by visiting: ${resetUrl}`,
  });
}

export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #3b82f6; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px;">New Contact Form Submission</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <strong style="color: #333;">Name:</strong>
                      </td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">
                        ${data.name}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <strong style="color: #333;">Email:</strong>
                      </td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">
                        <a href="mailto:${
                          data.email
                        }" style="color: #3b82f6;">${data.email}</a>
                      </td>
                    </tr>
                    ${
                      data.phone
                        ? `
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <strong style="color: #333;">Phone:</strong>
                      </td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">
                        ${data.phone}
                      </td>
                    </tr>
                    `
                        : ""
                    }
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <strong style="color: #333;">Subject:</strong>
                      </td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">
                        ${data.subject}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 30px;">
                  <p style="margin: 0 0 10px; color: #333; font-weight: bold;">Message:</p>
                  <div style="padding: 15px; background-color: #f9f9f9; border-radius: 6px; color: #666; line-height: 1.6;">
                    ${data.message.replace(/\n/g, "<br>")}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                    This message was sent from the contact form on your website.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: SUPPORT_EMAIL,
    subject: `Contact Form: ${data.subject}`,
    html,
    text: `New contact form submission:\n\nName: ${data.name}\nEmail: ${
      data.email
    }\nPhone: ${data.phone || "N/A"}\nSubject: ${data.subject}\n\nMessage:\n${
      data.message
    }`,
  });
}
