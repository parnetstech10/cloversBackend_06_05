import twilio from 'twilio';

// Twilio Configuration (for SMS)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS (Twilio)
export const sendOTPViaSMS = async (mobileNumber, otp) => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio configuration missing');
    }

    const message = await twilioClient.messages.create({
      body: `Your OTP for guest registration is: ${otp}. Valid for 5 minutes. Do not share this OTP.`,
      from: twilioPhoneNumber,
      to: `+91${mobileNumber}` // Assuming Indian mobile numbers
    });

    return {
      success: true,
      messageId: message.sid
    };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Console log OTP (for development/testing)
export const logOTPToConsole = (mobileNumber, otp) => {
  console.log(`\nOTP for ${mobileNumber} is: ${otp} (valid for 5 minutes)\n`);
};
