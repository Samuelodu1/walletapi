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
    const provider = new ethers.WebSocketProvider('wss://ethereum-sepolia-rpc.publicnode.com');

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


// Endpoint to fetch the latest transaction for a given Ethereum address
router.get('/eth-latest-transaction/:address', async (req, res) => {
  const { address } = req.params;

  // Validate Ethereum address
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address.' });
  }

  const provider = new ethers.WebSocketProvider('wss://ethereum-sepolia-rpc.publicnode.com');

  provider.on('block', async (blockNumber) => {
    const block = await provider.getBlock(blockNumber);
    
    for (const txHash of block.transactions) {
      const transaction = await provider.getTransaction(txHash);

      if (transaction?.to?.toLowerCase() === address.toLowerCase()) {
        const receipt = await provider.getTransactionReceipt(txHash);
        const status = receipt?.status === 1 ? 'Success' : 'Pending/Failed';

        res.json({
          transactionHash: transaction.hash,
          from: transaction.from,
          to: transaction.to,
          value: ethers.formatEther(transaction.value),
          blockNumber: receipt?.blockNumber || 'Pending',
          status
        });

        provider.removeAllListeners('block');
        break;
      }
    }
  });
});


// GET endpoint for the ETH faucet
const SEPOLIA_NODE_URL = "https://rpc2.sepolia.org"; // Your Infura Project ID
const PRIVATE_KEY = "dae95053e44a307865b3bb5f113c8791942912dd529989885829817f7adede64"; // Your wallet's private key

const provider = new ethers.JsonRpcProvider(SEPOLIA_NODE_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

router.get("/eth-faucet/:address", async (req, res) => {
  const address = req.params.address;

  // Validate recipient address
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid recipient address" });
  }

  try {
    // Create the transaction
    const tx = {
      to: address,
      value: ethers.parseEther("0.02"), // Send 0.01 ETH
      gasLimit: 21000,
    };

    // Send the transaction
    const transaction = await wallet.sendTransaction(tx);
    console.log(`Transaction sent: ${transaction.hash}`);

    // Wait for the transaction to be confirmed
    const receipt = await transaction.wait();
    res.json({
      message: "Transaction successful",
      transactionHash: transaction.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Error sending transaction:", error);
    res.status(500).json({ error: "Transaction failed" });
  }
});

// Placeholder for last transaction
router.get('/eth-last-transaction/:address', async (req, res) => {
  const { address } = req.params;
  // Implement logic to fetch the last transaction for the given address using Etherscan API or similar
  res.json({ message: 'last-transaction endpoint' });
});

module.exports = router;
