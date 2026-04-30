// scripts/seedSupportConfig.js
// ── Ensures singleton SupportConfig exists ──

const SupportConfig = require('../models/SupportConfig');

async function seedSupportConfig() {
  const existing = await SupportConfig.findOne();
  if (!existing) {
    await SupportConfig.create({
      whatsappNumber: '',
      whatsappMessage: 'Hello, I need help with my account',
      emailContact: '',
      ticketsEnabled: true,
      whatsappEnabled: false,
    });
    console.log('[seed] SupportConfig created with defaults');
  } else {
    console.log('[seed] SupportConfig already exists — skipping');
  }
}

module.exports = seedSupportConfig;