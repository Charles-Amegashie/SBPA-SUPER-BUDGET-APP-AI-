cat > services/web/src/services/wallet.js << 'EOF'
import axios from "./axios";

class Wallet {
  async getWallets() {
    try {
      const response = await axios.get("/wallets");
      return response;
    } catch (error) {
      console.error("Error fetching wallets:", error);
      throw error;
    }
  }

  async createWallet(data) {
    try {
      const response = await axios.post("/wallets", {
        name: data.name,
        currency: data.currency || "GHS",
      });
      return response;
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  }

  async getWalletById(id) {
    try {
      const response = await axios.get(`/wallets/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching wallet:", error);
      throw error;
    }
  }

  async getTransactions(walletId) {
    try {
      const response = await axios.get(`/wallets/${walletId}/transactions`);
      return response;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  async addTransaction(data) {
    try {
      const response = await axios.post("/transactions", {
        wallet_id: data.wallet_id,
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        transaction_date: data.transaction_date,
      });
      return response;
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  }

  async getTransaction(id) {
    try {
      const response = await axios.get(`/transactions/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw error;
    }
  }

  async updateTransaction(id, data) {
    try {
      const response = await axios.put(`/transactions/${id}`, {
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
      });
      return response;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }

  async deleteTransaction(id) {
    try {
      const response = await axios.delete(`/transactions/${id}`);
      return response;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  }

  async getSpendingInsights(walletId) {
    try {
      const response = await axios.get(`/wallets/${walletId}/insights`);
      return response;
    } catch (error) {
      console.error("Error fetching insights:", error);
      throw error;
    }
  }

  async getDashboardStats(walletId) {
    try {
      const response = await axios.get(`/wallets/${walletId}/stats`);
      return response;
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    }
  }

  async chat(walletId, message) {
    try {
      const response = await axios.post("/chat", {
        wallet_id: walletId,
        message: message,
      });
      return response;
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  }
}

const wallet = new Wallet();
export default wallet;
EOF