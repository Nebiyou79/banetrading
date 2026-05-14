// controllers/googleAuthController.js
// ── Google OAuth controller for mobile/react-native flows ──

const jwt = require('jsonwebtoken');
const googleAuthService = require('../services/googleAuthService');
const { signAccessToken, signRefreshToken, storeRefreshHash } = require('../utils/tokenUtils');

/**
 * POST /api/auth/google
 * Body: { idToken: string } (Google ID token from client-side)
 */
async function googleSignIn(req, res) {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ 
        message: 'Google ID token is required' 
      });
    }
    
    // Verify the Google token
    const googleData = await googleAuthService.verifyGoogleToken(idToken);
    
    // Find or create user
    const user = await googleAuthService.findOrCreateGoogleUser(googleData);
    
    // Check if account is frozen
    if (user.isFrozen) {
      return res.status(403).json({ 
        message: user.freezeReason || 'Your account has been frozen. Please contact support.' 
      });
    }
    
    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await storeRefreshHash(user, refreshToken);
    
    return res.status(200).json({
      message: 'Google sign-in successful',
      accessToken,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('[GoogleAuth] Sign-in failed:', error.message);
    
    if (error.message === 'Google authentication failed') {
      return res.status(401).json({ message: 'Invalid Google token' });
    }
    
    return res.status(500).json({ message: 'Server error during Google sign-in' });
  }
}

/**
 * GET /api/auth/google/url
 * Returns the Google OAuth consent screen URL
 */
async function getGoogleAuthUrl(req, res) {
  try {
    const url = googleAuthService.getGoogleAuthUrl();
    return res.status(200).json({ url });
  } catch (error) {
    console.error('[GoogleAuth] URL generation failed:', error.message);
    return res.status(500).json({ message: 'Failed to generate auth URL' });
  }
}

module.exports = {
  googleSignIn,
  getGoogleAuthUrl,
};