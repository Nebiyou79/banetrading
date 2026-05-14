// utils/promoUtils.js
// ── Promo code generation utility ──

const User = require('../models/User');

/**
 * Generate a unique promo code based on username
 */
async function generateUniquePromoCode(name) {
  const base = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
  
  let code = base || 'USER';
  let suffix = 0;
  let unique = false;
  
  while (!unique) {
    const testCode = suffix === 0 ? code : `${code}${suffix}`;
    const existing = await User.findOne({ ownPromoCode: testCode });
    
    if (!existing) {
      code = testCode;
      unique = true;
    } else {
      suffix++;
      
      // Prevent infinite loops
      if (suffix > 9999) {
        code = `${code}${Date.now().toString(36).toUpperCase()}`;
        unique = true;
      }
    }
  }
  
  return code;
}

module.exports = { generateUniquePromoCode };