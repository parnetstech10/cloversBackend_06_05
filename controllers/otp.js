// controllers/otpController.js
import OTP from '../models/otp.js';

const generateOTPCode = () => Math.floor(100000 + Math.random() * 900000);
const OTP_EXPIRATION_MINUTES = 5;

export const sendOTP = async (req, res) => {
  const { mobile, purpose } = req.body;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ message: 'Valid 10-digit mobile number required' });
  }

  try {
    const otpCode = generateOTPCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    // Upsert OTP doc, reset verified to false on new OTP
    await OTP.findOneAndUpdate(
      { mobile },
      { otp: otpCode, expiresAt, verified: false, purpose: purpose || 'guest_registration' },
      { upsert: true, new: true }
    );

    // TODO: Send OTP via SMS provider here

    return res.status(200).json({ message: 'OTP sent successfully', otp: otpCode }); // remove otp from response in prod
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ message: 'Mobile and OTP are required' });
  }

  try {
    const otpRecord = await OTP.findOne({ mobile, verified: false });

    if (!otpRecord) {
      return res.status(404).json({ message: 'No OTP request found or already verified' });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (otpRecord.otp !== Number(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const resendOTP = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ message: 'Valid 10-digit mobile number required' });
  }

  try {
    const existingOtp = await OTP.findOne({ mobile });

    if (!existingOtp) {
      return res.status(404).json({ message: 'No OTP request found to resend' });
    }

    const otpCode = generateOTPCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    existingOtp.otp = otpCode;
    existingOtp.expiresAt = expiresAt;
    existingOtp.verified = false;
    await existingOtp.save();

    // TODO: Send OTP via SMS provider here

    return res.status(200).json({ message: 'OTP resent successfully', otp: otpCode }); // remove otp from response in prod
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
