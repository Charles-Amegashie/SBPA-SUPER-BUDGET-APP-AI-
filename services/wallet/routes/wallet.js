import express from 'express';
import pool from '../db.js';
import axios from 'axios';

const router = express.Router();

// Get all wallets
router.get('/wallets', async (req, res) => {
  try {
    const [wallets] = await pool.query('SELECT * FROM wallets');
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new wallet
router.post('/wallets', async (req, res) => {
  try {
    const { name, currency } = req.body;
    const [result] = await pool.query(
      'INSERT INTO wallets (name, currency, balance) VALUES (?, ?, 0)',
      [name, currency || 'GHS']
    );
    res.json({ id: result.insertId, name, currency, balance: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet by ID
router.get('/wallets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [wallets] = await pool.query('SELECT * FROM wallets WHERE id = ?', [id]);
    if (wallets.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    res.json(wallets[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet insights/stats
router.get('/wallets/:id/insights', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get total income
    const [incomeResult] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM wallet_transactions WHERE wallet_id = ? AND type = "income"',
      [id]
    );
    
    // Get total expenses
    const [expenseResult] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM wallet_transactions WHERE wallet_id = ? AND type = "expense"',
      [id]
    );
    
    // Get category breakdown
    const [categoryBreakdown] = await pool.query(
      'SELECT category, SUM(amount) as total, COUNT(*) as count FROM wallet_transactions WHERE wallet_id = ? AND type = "expense" GROUP BY category',
      [id]
    );
    
    // Get recent transactions
    const [recent] = await pool.query(
      'SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 5',
      [id]
    );
    
    res.json({
      totalIncome: incomeResult[0].total,
      totalExpense: expenseResult[0].total,
      balance: incomeResult[0].total - expenseResult[0].total,
      categoryBreakdown,
      recentTransactions: recent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transactions for a wallet
router.get('/wallets/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const [transactions] = await pool.query(
      'SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a transaction
router.post('/transactions', async (req, res) => {
  try {
    const { wallet_id, type, category, amount, description, transaction_date } = req.body;
    
    // Validate input
    if (!wallet_id || !type || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert transaction
    const [result] = await pool.query(
      'INSERT INTO wallet_transactions (wallet_id, type, category, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?)',
      [wallet_id, type, category || 'Other', amount, description || '', transaction_date || new Date()]
    );
    
    // Update wallet balance
    const [walletData] = await pool.query('SELECT balance FROM wallets WHERE id = ?', [wallet_id]);
    const currentBalance = walletData[0].balance;
    const newBalance = type === 'income' ? currentBalance + parseFloat(amount) : currentBalance - parseFloat(amount);
    
    await pool.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet_id]);
    
    res.json({ 
      id: result.insertId, 
      wallet_id, 
      type, 
      category, 
      amount, 
      description,
      newBalance 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction by ID
router.get('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [transactions] = await pool.query('SELECT * FROM wallet_transactions WHERE id = ?', [id]);
    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transactions[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
router.put('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category, amount, description } = req.body;
    
    // Get old transaction to adjust balance
    const [oldTransaction] = await pool.query('SELECT * FROM wallet_transactions WHERE id = ?', [id]);
    if (oldTransaction.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const oldAmount = oldTransaction[0].amount;
    const oldType = oldTransaction[0].type;
    const wallet_id = oldTransaction[0].wallet_id;
    
    // Update transaction
    await pool.query(
      'UPDATE wallet_transactions SET type = ?, category = ?, amount = ?, description = ? WHERE id = ?',
      [type, category, amount, description, id]
    );
    
    // Adjust wallet balance
    const [walletData] = await pool.query('SELECT balance FROM wallets WHERE id = ?', [wallet_id]);
    let newBalance = walletData[0].balance;
    
    // Reverse old transaction
    newBalance = oldType === 'income' ? newBalance - oldAmount : newBalance + oldAmount;
    // Apply new transaction
    newBalance = type === 'income' ? newBalance + parseFloat(amount) : newBalance - parseFloat(amount);
    
    await pool.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet_id]);
    
    res.json({ id, type, category, amount, description, newBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
router.delete('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [transaction] = await pool.query('SELECT * FROM wallet_transactions WHERE id = ?', [id]);
    if (transaction.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const { wallet_id, type, amount } = transaction[0];
    
    // Delete transaction
    await pool.query('DELETE FROM wallet_transactions WHERE id = ?', [id]);
    
    // Adjust wallet balance
    const [walletData] = await pool.query('SELECT balance FROM wallets WHERE id = ?', [wallet_id]);
    const newBalance = type === 'income' ? walletData[0].balance - amount : walletData[0].balance + amount;
    await pool.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet_id]);
    
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { wallet_id, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get wallet transactions for context
    const [transactions] = await pool.query(
      'SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 10',
      [wallet_id]
    );
    
    const [walletData] = await pool.query('SELECT * FROM wallets WHERE id = ?', [wallet_id]);
    
    // Build context for AI
    const walletContext = walletData[0] ? `Wallet: ${walletData[0].name}, Balance: ${walletData[0].balance}` : '';
    const transactionContext = transactions.map(t => `${t.type}: ${t.amount} (${t.category})`).join(', ');
    
    const systemPrompt = `You are a helpful financial advisor. The user has a budget tracking app. ${walletContext}. Recent transactions: ${transactionContext}. Provide helpful financial advice based on their spending patterns.`;
    
    // Call prediction service for AI response
    try {
      const response = await axios.post(
        process.env.PREDICTION_URL + '/chat',
        { message, system_prompt: systemPrompt },
        { timeout: 10000 }
      );
      
      const botResponse = response.data.response || 'I could not process your request.';
      
      // Save chat message
      await pool.query(
        'INSERT INTO chat_messages (wallet_id, user_message, bot_response) VALUES (?, ?, ?)',
        [wallet_id, message, botResponse]
      );
      
      res.json({ userMessage: message, botResponse });
    } catch (error) {
      res.status(500).json({ error: 'Chat service unavailable: ' + error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;
