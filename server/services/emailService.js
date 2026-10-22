import nodemailer from 'nodemailer';

/**
 * Creates and caches a Nodemailer transport instance
 */
let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (user && pass) {
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
    return cachedTransporter;
  }

  // Fallback: If no real credentials, log clearly and use jsonTransport/test transport
  console.warn(
    '[EmailService] ⚠️ Notice: Real Gmail delivery requires a 16-digit Google App Password in server/.env (SMTP_PASS=xxxx). An email was simulated locally.'
  );
  cachedTransporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  return cachedTransporter;
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

    const fromAddress = process.env.EMAIL_FROM || `"ParkPulse Smart Parking" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'noreply@parkpulse.pk'}>`;

    const mailOptions = {
      from: fromAddress,
      to: user.email,
      replyTo: process.env.SMTP_USER || 'usamakhan58461@gmail.com',
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
