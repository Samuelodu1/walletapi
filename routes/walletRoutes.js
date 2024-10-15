const express = require('express');
const bip39 = require('bip39');
const { TronWeb } = require('tronweb');
const hdkey = require('hdkey');
require('dotenv').config();

const router = express.Router();

// API to generate a 12-word mnemonic
router.get('/wallet-phrase', (req, res) => {
  try {
    const mnemonic = bip39.generateMnemonic(128); // 128 bits = 12 words
    res.json({ mnemonic });
  } catch (error) {
    console.error('Error generating mnemonic:', error);
    res.status(500).json({ error: 'Failed to generate mnemonic' });
  }
});

// API to generate a Tron wallet from mnemonic
let walletIndex = 0;
router.post('/wallet-generate', (req, res) => {
  try {
    const { mnemonic } = req.body;

    // Check if mnemonic is provided
    if (!mnemonic) {
      return res.status(400).json({ error: 'Mnemonic phrase is required' });
    }

    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      return res.status(400).json({ error: 'Invalid mnemonic phrase' });
    }

    // Derive seed from the provided or master mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic);

    // Create HD wallet from the seed
    const root = hdkey.fromMasterSeed(seed);

    // Derive wallet based on BIP44 path for Tron (m/44'/195'/0'/0/x), where x is the index
    const walletPath = `m/44'/195'/0'/0/${walletIndex++}`;
    const child = root.derive(walletPath);

    // Get the private key in hex
    const privateKey = child.privateKey.toString('hex');

    // Initialize TronWeb with the private key
    const tronWeb = new TronWeb({
      fullHost: 'https://nile.trongrid.io', // Tron testnet (use mainnet https://api.trongrid.io for production)
      privateKey
    });

    // Generate wallet address using the private key
    const address = tronWeb.address.fromPrivateKey(privateKey);

    // Return mnemonic, address, privateKey, and wallet path
    res.json({
      mnemonic,
      address,
      privateKey,
      walletPath,
      walletIndex: walletIndex - 1 // Subtract 1 because it's incremented after derivation
    });
  } catch (error) {
    console.error('Error generating Tron wallet:', error);
    res.status(500).json({ error: 'Failed to generate Tron wallet' });
  }
});

// Placeholder for wallet balance
router.get('/wallet-balance', (req, res) => {
  res.json({ message: 'wallet-balance endpoint' });
});

// Placeholder for last transaction
router.get('/last-transaction', (req, res) => {
  res.json({ message: 'last-transaction endpoint' });
});

module.exports = router;
