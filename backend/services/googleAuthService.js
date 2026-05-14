// services/googleAuthService.js
// ── Google OAuth verification service ──

const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateUniquePromoCode } = require('../utils/promoUtils');

// Initialize Google OAuth client
const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_CALLBACK_URL,
});

/**
 * Verify Google ID token and return user data
 */
async function verifyGoogleToken(idToken) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token payload');
    }
    
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified || false,
    };
  } catch (error) {
    console.error('[GoogleAuth] Token verification failed:', error.message);
    throw new Error('Google authentication failed');
  }
}

/**
 * Find or create user from Google profile
 */
async function findOrCreateGoogleUser(googleData) {
  const { googleId, email, name, picture, emailVerified } = googleData;
  
  // Check if user exists with this email
  let user = await User.findOne({ email });
  
  if (user) {
    // Existing user - add Google ID if not present
    if (!user.googleId) {
      user.googleId = googleId;
      user.avatarUrl = user.avatarUrl || picture;
      
      // If email wasn't verified but Google says it is, mark as verified
      if (!user.isEmailVerified && emailVerified) {
        user.isEmailVerified = true;
        user.emailVerifiedAt = new Date();
        if (!user.kycTier || user.kycTier < 1) {
          user.kycTier = 1;
        }
      }
      
      await user.save();
    }
    
    return user;
  }
  
  // Create new user
  const uniquePromoCode = await generateUniquePromoCode(name);
  
  user = await User.create({
    name,
    email,
    googleId,
    avatarUrl: picture,
    country: 'Unknown', // Will be updated during onboarding
    role: 'user',
    isEmailVerified: emailVerified || false,
    emailVerifiedAt: emailVerified ? new Date() : null,
    kycTier: emailVerified ? 1 : 0,
    ownPromoCode: uniquePromoCode,
    // Generate a random secure password for Google-only accounts
    password: await require('bcryptjs').hash(require('crypto').randomBytes(32).toString('hex'), 10),
  });
  
  return user;
}

/**
 * Get Google OAuth URL for server-side flow
 */
function getGoogleAuthUrl() {
  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
  });
}

module.exports = {
  verifyGoogleToken,
  findOrCreateGoogleUser,
  getGoogleAuthUrl,
  googleClient,
};