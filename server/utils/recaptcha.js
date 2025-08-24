// This is a simple backend utility to verify Google reCAPTCHA v2 tokens
const axios = require('axios');

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error('reCAPTCHA secret key not set');
  const response = await axios.post(
    'https://www.google.com/recaptcha/api/siteverify',
    null,
    {
      params: {
        secret,
        response: token
      }
    }
  );
  return response.data.success;
}

module.exports = { verifyRecaptcha };
