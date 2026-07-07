import { Router } from "express";
import connection from "../db.js";
import { sanitize } from "../utility.js";
import axios from "axios";

const router = Router();
// Get wallet insights
router.get('/wallets/:id/insights', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT SUM(amount) as total_income FROM wallet_transactions WHERE wallet_id = ? AND type = "income"';
    const [income] = await pool.query(query, [id]);
    
    const expenseQuery = 'SELECT SUM(amount) as total_expense FROM wallet_transactions WHERE wallet_id = ? AND type = "expense"';
    const [expense] = await expenseQuery.query(expenseQuery, [id]);
    
    res.json({
      income: income[0]?.total_income || 0,
      expense: expense[0]?.total_expense || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user wallets
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 10 } = req.query;
  if (!userId) res.status(400).json({ message: "User ID is required" });
  try {
    const [rows] = await connection.query(
      "SELECT * FROM wallets WHERE user_id = ? LIMIT ? OFFSET ?",
      [userId, pageSize, (page - 1) * pageSize]
    );
    const [[{ total }]] = await connection.query(
      "SELECT COUNT(*) as total FROM wallets WHERE user_id = ?",
      [userId]
    );
    const sanitizedData = sanitize({
      data: rows,
      page,
      pageSize,
      total,
    });
    res.json(sanitizedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user transactions
router.get("/:userId/transactions", async (req, res) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 5, orderBy = "DESC" } = req.query;
  if (!userId) res.status(400).json({ message: "User ID is required" });
  try {
    const [rows] = await connection.query(
      `SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY timestamp ${orderBy} LIMIT ? OFFSET ?`,
      [userId, pageSize, (page - 1) * pageSize]
    );

    const [[{ total }]] = await connection.query(
      "SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?",
      [userId]
    );
    const sanitizedData = sanitize({
      data: rows,
      page,
      pageSize,
      total,
    });
    res.json(sanitizedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user dashboard stats
router.get("/:userId/stats", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ message: "User ID is required" });

  try {
    // 1. Total Spent
    const [[{ currentMonthSpent }]] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0) AS currentMonthSpent
       FROM wallet_transactions
       WHERE user_id = ?
         AND type = 'debit'
         AND MONTH(timestamp) = MONTH(NOW())
         AND YEAR(timestamp) = YEAR(NOW())`,
      [userId]
    );

    const [[{ previousMonthSpent }]] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0) AS previousMonthSpent
       FROM wallet_transactions
       WHERE user_id = ?
         AND type = 'debit'
         AND MONTH(timestamp) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
         AND YEAR(timestamp) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))`,
      [userId]
    );

    const totalSpent = {
      currentMonth: Number(currentMonthSpent),
      previousMonth: Number(previousMonthSpent),
      difference: Number((currentMonthSpent - previousMonthSpent).toFixed(2)),
      percentageChange:
        previousMonthSpent === 0
          ? null
          : Number(
              (
                ((currentMonthSpent - previousMonthSpent) /
                  previousMonthSpent) *
                100
              ).toFixed(2)
            ),
      trend:
        currentMonthSpent > previousMonthSpent
          ? "up"
          : currentMonthSpent < previousMonthSpent
          ? "down"
          : "no_change",
    };

    // 2. Total Income
    const [[{ currentMonthIncome }]] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0) AS currentMonthIncome
       FROM wallet_transactions
       WHERE user_id = ?
         AND type = 'credit'
         AND MONTH(timestamp) = MONTH(NOW())
         AND YEAR(timestamp) = YEAR(NOW())`,
      [userId]
    );

    const [[{ previousMonthIncome }]] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0) AS previousMonthIncome
       FROM wallet_transactions
       WHERE user_id = ?
         AND type = 'credit'
         AND MONTH(timestamp) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
         AND YEAR(timestamp) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))`,
      [userId]
    );

    const totalIncome = {
      currentMonth: Number(currentMonthIncome),
      previousMonth: Number(previousMonthIncome),
      difference: Number((currentMonthIncome - previousMonthIncome).toFixed(2)),
      percentageChange:
        previousMonthIncome === 0
          ? null
          : Number(
              (
                ((currentMonthIncome - previousMonthIncome) /
                  previousMonthIncome) *
                100
              ).toFixed(2)
            ),
      trend:
        currentMonthIncome > previousMonthIncome
          ? "up"
          : currentMonthIncome < previousMonthIncome
          ? "down"
          : "no_change",
    };

    // 3. Net Savings (current month)
    const netSavingsCurrent = currentMonthIncome - currentMonthSpent;
    const netSavingsPrevious = previousMonthIncome - previousMonthSpent;
    const netSavings = {
      currentMonth: Number(netSavingsCurrent.toFixed(2)),
      previousMonth: Number(netSavingsPrevious.toFixed(2)),
      difference: Number((netSavingsCurrent - netSavingsPrevious).toFixed(2)),
      percentageChange:
        netSavingsPrevious === 0
          ? null
          : Number(
              (
                ((netSavingsCurrent - netSavingsPrevious) /
                  netSavingsPrevious) *
                100
              ).toFixed(2)
            ),
      trend:
        netSavingsCurrent > netSavingsPrevious
          ? "up"
          : netSavingsCurrent < netSavingsPrevious
          ? "down"
          : "no_change",
    };

    // 4. Transaction Count
    const [[{ currentTransactionCount }]] = await connection.query(
      `SELECT COUNT(*) AS currentTransactionCount
       FROM wallet_transactions
       WHERE user_id = ?
         AND MONTH(timestamp) = MONTH(NOW())
         AND YEAR(timestamp) = YEAR(NOW())`,
      [userId]
    );

    const [[{ previousTransactionCount }]] = await connection.query(
      `SELECT COUNT(*) AS previousTransactionCount
       FROM wallet_transactions
       WHERE user_id = ?
         AND MONTH(timestamp) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
         AND YEAR(timestamp) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))`,
      [userId]
    );

    const transactionCount = {
      currentMonth: currentTransactionCount,
      previousMonth: previousTransactionCount,
      difference: currentTransactionCount - previousTransactionCount,
      percentageChange:
        previousTransactionCount === 0
          ? null
          : Number(
              (
                ((currentTransactionCount - previousTransactionCount) /
                  previousTransactionCount) *
                100
              ).toFixed(2)
            ),
      trend:
        currentTransactionCount > previousTransactionCount
          ? "up"
          : currentTransactionCount < previousTransactionCount
          ? "down"
          : "no_change",
    };

    // 5. Top Spending Categories (Top 5)
    const [currentTopCategories] = await connection.query(
      `SELECT category, SUM(amount) AS amount
       FROM wallet_transactions
       WHERE user_id = ?
         AND type = 'debit'
         AND MONTH(timestamp) = MONTH(NOW())
         AND YEAR(timestamp) = YEAR(NOW())
       GROUP BY category
       ORDER BY amount DESC
       LIMIT 5`,
      [userId]
    );

    const topCategories = [];

    for (const row of currentTopCategories) {
      const category = row.category;
      const currentAmount = Number(row.amount);

      const [[{ amount: previousAmount = 0 } = {}]] = await connection.query(
        `SELECT SUM(amount) AS amount
         FROM wallet_transactions
         WHERE user_id = ?
           AND type = 'debit'
           AND category = ?
           AND MONTH(timestamp) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
           AND YEAR(timestamp) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))`,
        [userId, category]
      );

      const difference = currentAmount - previousAmount;
      const percentageChange =
        previousAmount === 0
          ? null
          : Number(((difference / previousAmount) * 100).toFixed(2));
      const trend =
        currentAmount > previousAmount
          ? "up"
          : currentAmount < previousAmount
          ? "down"
          : "no_change";

      topCategories.push({
        name: category,
        currentMonth: Number(currentAmount),
        previousMonth: Number(previousAmount),
        difference: Number(difference.toFixed(2)),
        percentageChange,
        trend,
      });
    }

    // Return formatted response
    const data = {
      totalSpent,
      totalIncome,
      netSavings,
      transactionCount,
      topCategories,
    };

    const sanitizedData = sanitize({ data });
    res.json(sanitizedData);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create wallet
router.post("/:userId", async (req, res) => {
  const { userId } = req.params;
  const { provider, source, label, is_active = 1 } = req.body;

  if (!userId || !provider || !source || !label) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [result] = await connection.query(
      `INSERT INTO wallets (user_id, provider, source, label, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, provider, source, label, is_active]
    );

    const [wallet] = await connection.query(
      `SELECT * FROM wallets WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(wallet[0]);
  } catch (err) {
    console.error("Error creating wallet:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:userId/transactions", async (req, res) => {
  const { userId } = req.params;
  const {
    walletId = 1,
    source,
    amount,
    type,
    description = "",
    category = "",
    timestamp = new Date(),
  } = req.body;

  if (!walletId || !userId || !source || !amount || !type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [result] = await connection.query(
      `INSERT INTO wallet_transactions
       (wallet_id, user_id, source, amount, type, description, category, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [walletId, userId, source, amount, type, description, category, timestamp]
    );

    const [transaction] = await connection.query(
      `SELECT * FROM wallet_transactions WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(transaction[0]);
  } catch (err) {
    console.error("Error creating transaction:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:userId/insights", async (req, res) => {
  const { userId } = req.params;
  try {
    const response = await axios.get(
      `${process.env.PREDICTION_URL}/v1/ai/predict/${userId}/insights`
    );
    const insights = response.data;

    const sanitizedData = sanitize({ data: insights });

    res.json(sanitizedData);
  } catch (error) {
    console.error("AI insights error:", error.message);
    res.status(500).json({ message: "Failed to fetch AI insights" });
  }
});

export default router;
