// utils/tokenUtils.js
// ── Shared token utilities for both OTP and Google auth ──

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ACCESS_TTL  = process.env.JWT_ACCESS_TTL  || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';

function signAccessToken(user) {
  return jwt.sign(
    { 
      sub: user._id.toString(), 
      role: user.role, 
      email: user.email,
      authMethod: user.googleId ? 'google' : 'email'
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken(user) {
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign(
    { sub: user._id.toString(), jti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

async function storeRefreshHash(user, refreshToken) {
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.refreshTokenIssuedAt = new Date();
  await user.save();
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  storeRefreshHash,
};