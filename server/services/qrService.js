import QRCode from 'qrcode';

/**
 * Generates a base64 QR Code containing a secure booking verification payload
 * @param {string} bookingReference
 * @returns {Promise<string>} Data URL string (image/png)
 */
export const generateBookingQRCode = async (bookingReference) => {
  try {
    const payload = JSON.stringify({
      ref: bookingReference,
      system: 'ParkPulse-FYP',
      verifyUrl: `/api/bookings/verify/${encodeURIComponent(bookingReference)}`,
    });

    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 250,
      color: {
        dark: '#0B192C',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};
