import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure latest .env variables are loaded
dotenv.config();

/**
 * Creates and caches a Nodemailer transport instance
 */
let cachedTransporter = null;

const getTransporter = async () => {
  // Always refresh .env in case credentials were added while server was running
  dotenv.config();

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (user && pass) {
    if (cachedTransporter && cachedTransporter._isReal) {
      return cachedTransporter;
    }

    const isGmail = host.includes('gmail') || user.includes('gmail');
    cachedTransporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
          }
        : {
            host,
            port,
            secure,
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
          }
    );
    cachedTransporter._isReal = true;
    return cachedTransporter;
  }

  // Fallback: If no real credentials, log clearly and use jsonTransport
  console.warn(
    '[EmailService] ⚠️ Notice: Real Gmail delivery requires a 16-digit Google App Password in server/.env (SMTP_PASS=xxxx). An email was simulated locally.'
  );
  return nodemailer.createTransport({
    jsonTransport: true,
  });
};

/**
 * Format a Date to a clean Pakistan / local readable string
 */
const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('en-PK', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Send Welcome Email when a new user registers an account
 */
export const sendWelcomeEmail = async ({ user }) => {
  try {
    if (!user || !user.email) {
      console.warn('[EmailService] Cannot send welcome email: Missing user email.');
      return { success: false, reason: 'missing_email' };
    }

    const transporter = await getTransporter();
    const cleanEmail = user.email.toLowerCase().trim();
    const vehiclePlate = (user.vehicleNumber || 'N/A').toUpperCase();

    const subject = `Welcome to ParkPulse Smart Parking, ${user.name}!`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ParkPulse</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    
    <!-- Top Header Banner -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 36px 32px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
        ✓ Account Successfully Activated
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
        Welcome to Park<span style="color: #93c5fd;">Pulse</span>!
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
        Smart Parking Reservation & Digital Bay Management System
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 28px;">
      
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #1e293b;">
        Hello <strong>${user.name}</strong>,<br>
        ParkPulse me khush aamdeed! Aapka driver account kamyabi ke sath create aur activate ho chuka hai. Aap ab real-time parking bays search aur reserve kar sakte hain.
      </p>

      <!-- Account Overview Card -->
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">
          Driver Profile Details
        </span>
        <table style="width: 100%; font-size: 13px; line-height: 1.8;">
          <tr>
            <td style="color: #64748b; width: 45%;"><strong>Driver Name:</strong></td>
            <td style="color: #0f172a; font-weight: 700;">${user.name}</td>
          </tr>
          <tr>
            <td style="color: #64748b;"><strong>Registered Email:</strong></td>
            <td style="color: #0f172a;">${cleanEmail}</td>
          </tr>
          <tr>
            <td style="color: #64748b;"><strong>Car Number Plate:</strong></td>
            <td style="color: #2563eb; font-family: monospace; font-weight: 800; font-size: 15px;">🚗 ${vehiclePlate}</td>
          </tr>
          <tr>
            <td style="color: #64748b;"><strong>Account Status:</strong></td>
            <td style="color: #16a34a; font-weight: 700;">🟢 Active (Verified)</td>
          </tr>
        </table>
      </div>

      <!-- Features Section -->
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
          🌟 ParkPulse Features:
        </h3>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #475569;">
          <li><strong>Real-Time Slot Availability:</strong> Boulevard Mall, Abdullah Mall, Chase Value, aur Mehran Walk me live parking slots dekhein.</li>
          <li><strong>Easy Login:</strong> Aap apni <strong>Email Address</strong> ya <strong>Car Plate Number (${vehiclePlate})</strong> se login kar sakte hain.</li>
          <li><strong>Instant QR & Email Receipt:</strong> Har booking per QR gate pass aur automated confirmation email hasil karein.</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
        Kisi bhi madad ya support ke liye hamari team se rabta karein:<br>
        <strong>Email:</strong> ${process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com'}
      </p>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} ParkPulse Smart Parking System. Automated FYP Notification.<br>
      This welcome email was sent to ${cleanEmail}.
    </div>

  </div>
</body>
</html>
    `;

    const userEmail = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com').trim();
    const fromAddress = `"ParkPulse Smart Parking" <${userEmail}>`;

    const mailOptions = {
      from: fromAddress,
      to: cleanEmail,
      replyTo: userEmail,
      subject,
      html: htmlContent,
      text: `Welcome to ParkPulse, ${user.name}!\nYour driver account is active.\nRegistered Vehicle: ${vehiclePlate}\nLogin with your email or vehicle plate.\n\nThank you for choosing ParkPulse!`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Welcome email dispatched to ${cleanEmail} (MessageId: ${info.messageId || 'local'})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Failed to send welcome email (non-fatal):', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send automated parking booking confirmation email
 */
export const sendBookingConfirmationEmail = async ({ user, booking, slot, payment }) => {
  try {
    if (!user || !user.email) {
      console.warn('[EmailService] Cannot send confirmation: Missing user email.');
      return { success: false, reason: 'missing_email' };
    }

    const transporter = await getTransporter();

    const formattedStart = formatDateTime(booking.startTime);
    const formattedEnd = formatDateTime(booking.endTime);
    const formattedAmount = `PKR ${Number(booking.amount).toLocaleString()}`;
    const vehiclePlate = (booking.vehicleNumber || user.vehicleNumber || 'N/A').toUpperCase();
    const areaName = slot?.area || 'Smart Parking Area';
    const slotNum = slot?.slotNumber || 'Assigned Slot';
    const floorZone = slot?.floorOrZone || 'Ground Floor';
    const vehicleType = (slot?.slotType || 'Car').toUpperCase();
    const durationHours = (booking.durationMinutes / 60).toFixed(1).replace('.0', '');
    const txnRef = payment?.transactionReference || `TXN-${booking.bookingReference}`;

    const subject = `ParkPulse: Parking Booking Confirmed - Slot ${slotNum} (${areaName})`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parking Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    
    <!-- Top Header Banner -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 36px 32px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
        ✓ Booking Confirmed & Paid
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
        Park<span style="color: #93c5fd;">Pulse</span> Smart Parking
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
        Your parking reservation has been secured successfully!
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 28px;">
      
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #1e293b;">
        Hello <strong>${user.name || 'Valued Driver'}</strong>,<br>
        Aapki parking successfully book ho chuki hai. Booking aur gaari ki mukammal details neeche darj hain:
      </p>

      <!-- Highlight Card -->
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <span style="font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
          Booking Reference ID
        </span>
        <div style="font-family: monospace, Courier, sans-serif; font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: 2px;">
          ${booking.bookingReference}
        </div>
        <div style="margin-top: 8px; font-size: 13px; color: #3b82f6; font-weight: 600;">
          📍 ${areaName} — Slot ${slotNum}
        </div>
      </div>

      <!-- Details Table -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 24px;">
        <tbody>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; width: 40%;">Vehicle Plate Number</td>
            <td style="padding: 12px 16px; font-size: 14px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-family: monospace;">🚗 ${vehiclePlate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Parking Location</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${areaName}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Slot & Zone</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${slotNum} (${floorZone})</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Vehicle Type</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${vehicleType}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Start Time</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #059669; border-bottom: 1px solid #e2e8f0;">🟢 ${formattedStart}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">End Time</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #dc2626; border-bottom: 1px solid #e2e8f0;">🔴 ${formattedEnd}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Duration</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${durationHours} Hours (${booking.durationMinutes} mins)</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Total Amount Paid</td>
            <td style="padding: 12px 16px; font-size: 16px; font-weight: 800; color: #059669; border-bottom: 1px solid #e2e8f0;">${formattedAmount}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b;">Transaction Ref</td>
            <td style="padding: 12px 16px; font-size: 12px; font-family: monospace; color: #64748b;">${txnRef}</td>
          </tr>
        </tbody>
      </table>

      <!-- Instructions Section -->
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
          📌 Important Arrival Instructions:
        </h3>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #475569;">
          <li>Parking area me dakhil hone per automatic camera aapki car plate (<strong>${vehiclePlate}</strong>) scan karega.</li>
          <li>Apna booking reference <strong>${booking.bookingReference}</strong> gate scanner per dikha sakte hain.</li>
          <li>Kripya booking shuru hone se 10-15 minute pehle pohnchein taake slot easily access ho sake.</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
        Agar aapko koi sawal ya madad darkaar ho, to hamare admin se rabta kar sakte hain.<br>
        <strong>Email:</strong> ${process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com'}
      </p>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} ParkPulse Smart Parking System. Automated FYP Notification.<br>
      This email was sent to ${user.email} regarding booking reference ${booking.bookingReference}.
    </div>

  </div>
</body>
</html>
    `;

    const userEmail = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com').trim();
    const fromAddress = `"ParkPulse Smart Parking" <${userEmail}>`;

    const mailOptions = {
      from: fromAddress,
      to: user.email,
      replyTo: userEmail,
      subject,
      html: htmlContent,
      text: `Parking Confirmed!\nBooking Reference: ${booking.bookingReference}\nVehicle Plate: ${vehiclePlate}\nSlot: ${slotNum} (${areaName})\nTime: ${formattedStart} to ${formattedEnd}\nAmount: ${formattedAmount}\nStatus: Confirmed & Paid`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`[EmailService] Booking confirmation email dispatched successfully to ${user.email} (MessageId: ${info.messageId || 'local-preview'})`);
    return {
      success: true,
      messageId: info.messageId,
      preview: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error) {
    console.error('[EmailService] Failed to send booking confirmation email (non-fatal):', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Password Reset Code Email
 */
export const sendPasswordResetEmail = async ({ user, resetCode }) => {
  try {
    if (!user || !user.email) {
      console.warn('[EmailService] Cannot send reset email: Missing user email.');
      return { success: false, reason: 'missing_email' };
    }

    const transporter = await getTransporter();
    const cleanEmail = user.email.toLowerCase().trim();
    const subject = `ParkPulse Password Reset Code: ${resetCode}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    
    <!-- Top Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: rgba(59, 130, 246, 0.25); border: 1px solid rgba(147, 197, 253, 0.4); padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; color: #93c5fd;">
        🔒 Security Verification
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">
        Reset Your Park<span style="color: #60a5fa;">Pulse</span> Password
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">
        Smart Parking Reservation & Digital Bay Management System
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 28px;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #1e293b;">
        Hello <strong>${user.name}</strong>,<br>
        We received a request to reset the password for your ParkPulse driver account registered to vehicle <strong>${user.vehicleNumber || 'driver'}</strong>.
      </p>

      <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">
        Use the 6-digit verification code below to complete your password reset. This code will expire in <strong>15 minutes</strong>:
      </p>

      <!-- Code Box -->
      <div style="background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">
          One-Time Verification Code
        </span>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1e40af; font-family: monospace;">
          ${resetCode}
        </div>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #991b1b;">
          <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email or contact support immediately. Your password remains unchanged until verified.
        </p>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
        Need assistance? Contact system administration:<br>
        <strong>Email:</strong> ${process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com'}
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} ParkPulse Smart Parking System. Automated Security Notification.
    </div>
  </div>
</body>
</html>
    `;

    const userEmail = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com').trim();
    const fromAddress = `"ParkPulse Security" <${userEmail}>`;

    const mailOptions = {
      from: fromAddress,
      to: cleanEmail,
      replyTo: userEmail,
      subject,
      html: htmlContent,
      text: `Your ParkPulse password reset code is: ${resetCode}\nThis code will expire in 15 minutes.\nIf you did not request this, please ignore this email.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Password reset email sent to ${cleanEmail} (MessageId: ${info.messageId || 'simulated'})`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[EmailService] Failed to send password reset email (non-fatal):', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 15-Minute Expiry Reminder Email
 */
export const sendExpiryReminderEmail = async ({ user, booking, slot, minutesRemaining = 15 }) => {
  try {
    if (!user || !user.email) return { success: false, reason: 'missing_email' };

    const transporter = await getTransporter();
    const cleanEmail = user.email.toLowerCase().trim();
    const clientBase = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const extensionUrl = `${clientBase}/my-bookings?extend=${booking._id}`;

    const slotNum = slot?.slotNumber || 'Slot';
    const areaName = slot?.area || 'Parking Deck';
    const formattedEnd = formatDateTime(booking.endTime);
    const vehiclePlate = (booking.vehicleNumber || user.vehicleNumber || 'N/A').toUpperCase();

    const subject = `⚠️ Parking Alert: Your slot ${slotNum} expires in ${minutesRemaining} minutes!`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Parking Expiry Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: rgba(0,0,0,0.15); padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        ⏳ Expiry Countdown
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">
        Reservation Expiring in ${minutesRemaining} Minutes!
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">
        ParkPulse Smart Parking Alert
      </p>
    </div>

    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 18px 0; color: #1e293b;">
        Hello <strong>${user.name}</strong>,<br>
        Your parking session for slot <strong>${slotNum}</strong> (${areaName}) is scheduled to conclude at <strong>${formattedEnd}</strong>.
      </p>

      <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 14px; padding: 18px; margin-bottom: 22px;">
        <table style="width: 100%; font-size: 13px; line-height: 1.8;">
          <tr>
            <td style="color: #92400e; width: 45%;"><strong>Vehicle Plate:</strong></td>
            <td style="color: #78350f; font-family: monospace; font-weight: 800; font-size: 14px;">🚗 ${vehiclePlate}</td>
          </tr>
          <tr>
            <td style="color: #92400e;"><strong>Reserved Bay:</strong></td>
            <td style="color: #78350f; font-weight: 700;">${slotNum} (${areaName})</td>
          </tr>
          <tr>
            <td style="color: #92400e;"><strong>Scheduled End:</strong></td>
            <td style="color: #b45309; font-weight: 800;">${formattedEnd}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #475569; margin: 0 0 20px 0;">
        Need more time? You can extend your reservation online right now to keep your parking slot without disruption:
      </p>

      <div style="text-align: center; margin: 26px 0;">
        <a href="${extensionUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
          Extend Parking Reservation →
        </a>
      </div>

      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
        Direct link: <a href="${extensionUrl}" style="color: #2563eb;">${extensionUrl}</a>
      </p>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} ParkPulse Smart Parking System. Automated Expiry Notification.
    </div>
  </div>
</body>
</html>
    `;

    const userEmail = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com').trim();
    const fromAddress = `"ParkPulse Alerts" <${userEmail}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      replyTo: userEmail,
      subject,
      html: htmlContent,
      text: `Parking Alert: Your slot ${slotNum} at ${areaName} expires in ${minutesRemaining} minutes at ${formattedEnd}.\nExtend parking now: ${extensionUrl}`,
    });

    console.log(`[EmailService] Expiry reminder email dispatched to ${cleanEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send expiry reminder email (non-fatal):', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * At-Expiry / Overdue Notification Email
 */
export const sendBookingExpiredEmail = async ({ user, booking, slot, extensionUrl }) => {
  try {
    if (!user || !user.email) return { success: false, reason: 'missing_email' };

    const transporter = await getTransporter();
    const cleanEmail = user.email.toLowerCase().trim();
    const clientBase = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const extendLink = extensionUrl || `${clientBase}/my-bookings?extend=${booking._id}`;

    const slotNum = slot?.slotNumber || 'Slot';
    const areaName = slot?.area || 'Parking Deck';
    const formattedEnd = formatDateTime(booking.endTime);
    const vehiclePlate = (booking.vehicleNumber || user.vehicleNumber || 'N/A').toUpperCase();

    const subject = `⛔ Notice: Parking Reservation for Slot ${slotNum} Has Elapsed`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reservation Period Elapsed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: rgba(0,0,0,0.2); padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        ⚠️ Time Elapsed
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">
        Reservation Has Reached Expiry Time
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">
        Scheduled End Time: ${formattedEnd}
      </p>
    </div>

    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 18px 0; color: #1e293b;">
        Hello <strong>${user.name}</strong>,<br>
        Your scheduled reservation for <strong>Slot ${slotNum}</strong> (${areaName}) with vehicle <strong>${vehiclePlate}</strong> has elapsed as of ${formattedEnd}.
      </p>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 18px; margin-bottom: 22px;">
        <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.6;">
          <strong>Grace Period & Overstay Rules:</strong> A standard grace period applies for departure. If your vehicle is still parked, please extend your reservation immediately or proceed to the exit gate to avoid penalty fees.
        </p>
      </div>

      <div style="text-align: center; margin: 26px 0;">
        <a href="${extendLink}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
          Extend Parking Time Online →
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} ParkPulse Smart Parking System. Automated Expiry Notification.
    </div>
  </div>
</body>
</html>
    `;

    const userEmail = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com').trim();
    const fromAddress = `"ParkPulse Alerts" <${userEmail}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      replyTo: userEmail,
      subject,
      html: htmlContent,
      text: `Notice: Your parking session for Slot ${slotNum} (${areaName}) elapsed at ${formattedEnd}.\nIf you are still parked, please extend your reservation: ${extendLink}`,
    });

    console.log(`[EmailService] Booking expired notification sent to ${cleanEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send expired booking email (non-fatal):', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Extension Confirmation & Digital Receipt Email
 */
export const sendExtensionConfirmationEmail = async ({ user, booking, slot, payment, extensionDetails }) => {
  try {
    if (!user || !user.email) return { success: false, reason: 'missing_email' };

    const transporter = await getTransporter();
    const cleanEmail = user.email.toLowerCase().trim();

    const slotNum = slot?.slotNumber || booking.slotId?.slotNumber || 'Slot';
    const areaName = slot?.area || booking.slotId?.area || 'Parking Deck';
    const formattedNewEnd = formatDateTime(booking.endTime);
    const vehiclePlate = (booking.vehicleNumber || user.vehicleNumber || 'N/A').toUpperCase();
    const txnRef = payment?.transactionReference || 'TXN-EXT-SIM';
    const addedMinutes = extensionDetails?.addedMinutes || 60;
    const additionalAmount = Number(extensionDetails?.additionalAmount || 0).toLocaleString();

    const subject = `✅ Extension Confirmed: Slot ${slotNum} until ${formattedNewEnd}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Parking Extension Receipt</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        ✓ Extension Approved
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">
        +${addedMinutes} Minutes Added Successfully!
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">
        New Departure Time: ${formattedNewEnd}
      </p>
    </div>

    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 18px 0; color: #1e293b;">
        Hello <strong>${user.name}</strong>,<br>
        Your parking session for slot <strong>${slotNum}</strong> has been successfully extended. Your parking space is reserved through <strong>${formattedNewEnd}</strong>.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 13px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b;"><strong>Booking Reference:</strong></td>
          <td style="padding: 10px 0; font-family: monospace; font-weight: 800; color: #0f172a;">${booking.bookingReference}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b;"><strong>Vehicle Plate:</strong></td>
          <td style="padding: 10px 0; font-family: monospace; font-weight: 800; color: #2563eb;">🚗 ${vehiclePlate}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b;"><strong>Slot & Deck:</strong></td>
          <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">${slotNum} (${areaName})</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b;"><strong>New End Time:</strong></td>
          <td style="padding: 10px 0; font-weight: 800; color: #059669;">${formattedNewEnd}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b;"><strong>Extension Fee Paid:</strong></td>
          <td style="padding: 10px 0; font-weight: 800; color: #059669;">PKR ${additionalAmount}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b;"><strong>Transaction Ref:</strong></td>
          <td style="padding: 10px 0; font-family: monospace; color: #64748b;">${txnRef}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} ParkPulse Smart Parking System. Automated Extension Receipt.
    </div>
  </div>
</body>
</html>
    `;

    const userEmail = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com').trim();
    const fromAddress = `"ParkPulse Billing" <${userEmail}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      replyTo: userEmail,
      subject,
      html: htmlContent,
      text: `Extension Confirmed!\nBooking: ${booking.bookingReference}\nSlot: ${slotNum} (${areaName})\nAdded: ${addedMinutes} mins\nNew End Time: ${formattedNewEnd}\nAmount Paid: PKR ${additionalAmount}\nTxn: ${txnRef}`,
    });

    console.log(`[EmailService] Extension confirmation email dispatched to ${cleanEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send extension confirmation email (non-fatal):', err.message);
    return { success: false, error: err.message };
  }
};

