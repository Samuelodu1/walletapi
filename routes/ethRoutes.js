const express = require('express');
const bip39 = require('bip39');
const { ethers } = require('ethers'); // Using ethers.js for Ethereum
const hdkey = require('hdkey');
require('dotenv').config();

const router = express.Router();

// API to generate a 12-word mnemonic
router.get('/eth-wallet-phrase', (req, res) => {
  try {
    const mnemonic = bip39.generateMnemonic(128); // 128 bits = 12 words
    res.json({ mnemonic });
  } catch (error) {
    console.error('Error generating mnemonic:', error);
    res.status(500).json({ error: 'Failed to generate mnemonic' });
  }
});

// API to generate an Ethereum wallet from mnemonic
let walletIndex = 0;
router.post('/eth-wallet-generate', (req, res) => {
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

    // Derive wallet based on BIP44 path for Ethereum (m/44'/60'/0'/0/x), where x is the index
    const walletPath = `m/44'/60'/0'/0/${walletIndex++}`;
    const child = root.derive(walletPath);

    // Get the private key in hex
    const privateKey = child.privateKey.toString('hex');

    // Generate wallet address using the private key
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;

    // Return mnemonic, address, privateKey, and wallet path
    res.json({
      mnemonic,
      address,
      privateKey,
      walletPath,
      walletIndex: walletIndex - 1 // Subtract 1 because it's incremented after derivation
    });
  } catch (error) {
    console.error('Error generating Ethereum wallet:', error);
    res.status(500).json({ error: 'Failed to generate Ethereum wallet' });
  }
});

// Placeholder for wallet balance
router.get('/eth-wallet-balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Use ethers default provider (which can work without an API key, but rate-limited)
    const provider = ethers.getDefaultProvider(); 

    // Fetch the balance of the address
    const balance = await provider.getBalance(address);

    // Convert balance to Ether (from Wei)
    const formattedBalance = ethers.formatEther(balance); 

    // Send response with the address and formatted balance
    res.json({ address, balance: formattedBalance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// Placeholder for last transaction
router.get('/eth-last-transaction/:address', async (req, res) => {
  const { address } = req.params;
  // Implement logic to fetch the last transaction for the given address using Etherscan API or similar
  res.json({ message: 'last-transaction endpoint' });
});

module.exports = router;
