import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wallet } from "@/services/wallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Loader } from "lucide-react";

const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [transactionData, setTransactionData] = useState({
    type: "expense",
    category: "Other",
    amount: "",
    description: "",
  });

  // Fetch all wallets
  const { data: wallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const response = await wallet.getWallets();
      return response.data || [];
    },
  });

  // Fetch insights for selected wallet
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["insights", selectedWallet?.id],
    queryFn: () => wallet.getSpendingInsights(selectedWallet?.id),
    enabled: !!selectedWallet?.id,
    select: (data) => data.data,
  });

  // Fetch transactions for selected wallet
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", selectedWallet?.id],
    queryFn: () => wallet.getTransactions(selectedWallet?.id),
    enabled: !!selectedWallet?.id,
    select: (data) => data.data || [],
  });

  // Create wallet mutation
  const createWalletMutation = useMutation({
    mutationFn: (data) => wallet.createWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setWalletName("");
      setIsAddWalletOpen(false);
    },
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: (data) => wallet.addTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", selectedWallet?.id] });
      queryClient.invalidateQueries({ queryKey: ["insights", selectedWallet?.id] });
      setTransactionData({ type: "expense", category: "Other", amount: "", description: "" });
      setIsAddTransactionOpen(false);
    },
  });

  // Handle create wallet
  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!walletName.trim()) return;
    await createWalletMutation.mutateAsync({ name: walletName, currency: "GHS" });
  };

  // Handle add transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!transactionData.amount || !selectedWallet?.id) return;
    await addTransactionMutation.mutateAsync({
      wallet_id: selectedWallet.id,
      ...transactionData,
      amount: parseFloat(transactionData.amount),
    });
  };

  // Auto-select first wallet
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0]);
    }
  }, [wallets, selectedWallet]);

  // Prepare chart data
  const categoryData = insights?.categoryBreakdown?.map((cat) => ({
    name: cat.category || "Other",
    value: parseFloat(cat.total),
  })) || [];

  const transactionChartData = (transactions || [])
    .slice(0, 10)
    .reverse()
    .map((t) => ({
      date: new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: parseFloat(t.amount),
      type: t.type,
    }));

  if (walletsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
          <DialogTrigger asChild>
            <Button>Create New Wallet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Wallet</DialogTitle>
              <DialogDescription>Create a new wallet to track your finances.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <Input
                placeholder="Wallet name (e.g., Monthly Budget)"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                required
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddWalletOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createWalletMutation.isPending}>
                  {createWalletMutation.isPending ? "Creating..." : "Create Wallet"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallet Selector */}
      {wallets.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium mb-2">Select Wallet</label>
          <Select
            value={selectedWallet?.id?.toString()}
            onValueChange={(value) => {
              const wallet = wallets.find((w) => w.id.toString() === value);
              setSelectedWallet(wallet);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (
                <SelectItem key={w.id} value={w.id.toString()}>
                  {w.name} - GHS {parseFloat(w.balance).toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedWallet && (
        <>
          {/* Stats Cards */}
          {insightsLoading ? (
            <div className="flex items-center justify-center">
              <Loader className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                <p className="text-sm text-gray-600">Monthly Income</p>
                <p className="text-2xl font-bold text-blue-600">GHS {parseFloat(insights?.totalIncome || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">% from last month</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg">
                <p className="text-sm text-gray-600">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">GHS {parseFloat(insights?.totalExpense || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">% from last month</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                <p className="text-sm text-gray-600">Monthly Savings</p>
                <p className="text-2xl font-bold text-green-600">GHS {parseFloat((insights?.totalIncome || 0) - (insights?.totalExpense || 0)).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">% from last month</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                <p className="text-sm text-gray-600">Monthly Transactions</p>
                <p className="text-2xl font-bold text-purple-600">{transactions.length}</p>
                <p className="text-xs text-gray-500 mt-2">from last month</p>
              </div>
            </div>
          )}

          {/* Add Transaction Button */}
          <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">Add New Transaction</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>Record a new income or expense transaction.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <Select value={transactionData.type} onValueChange={(value) => setTransactionData({ ...transactionData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={transactionData.category} onValueChange={(value) => setTransactionData({ ...transactionData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Groceries">Groceries</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                  required
                  step="0.01"
                />
                <Input
                  placeholder="Description"
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddTransactionOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addTransactionMutation.isPending}>
                    {addTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: GHS ${value.toFixed(2)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `GHS ${parseFloat(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No spending data yet</p>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              {transactionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader className="animate-spin" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{t.category || "Other"}</p>
                        <p className="text-sm text-gray-500">{t.description}</p>
                      </div>
                      <p className={`font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "income" ? "+" : "-"}GHS {parseFloat(t.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Your latest financial activity</p>
              )}
            </div>
          </div>

          {/* Transaction Chart */}
          {transactionChartData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">This Month's Spending Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transactionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `GHS ${parseFloat(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="amount" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {wallets.length === 0 && (
        <div className="bg-gray-50 p-12 rounded-lg text-center">
          <p className="text-gray-600 mb-4">No wallets yet. Create one to get started!</p>
          <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
            <DialogTrigger asChild>
              <Button>Create Your First Wallet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Wallet</DialogTitle>
                <DialogDescription>Create a new wallet to track your finances.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWallet} className="space-y-4">
                <Input
                  placeholder="Wallet name (e.g., Monthly Budget)"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  required
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddWalletOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createWalletMutation.isPending}>
                    {createWalletMutation.isPending ? "Creating..." : "Create Wallet"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
