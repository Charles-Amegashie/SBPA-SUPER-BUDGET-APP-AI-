# SBPA: Super Budget App AI 💰🤖

A full-stack AI-powered personal finance management platform that predicts spending patterns, provides smart financial insights, and simplifies budget tracking with an intuitive interface.

**[Live Demo](https://powerful-contentment-production-2e84.up.railway.app/)** | **[GitHub](https://github.com/Charles-Amegashie/SBPA-SUPER-BUDGET-APP-AI-)**

---

## 🚀 Features

### Core Functionality
- **Smart Wallet Management** - Create and manage multiple wallets with real-time balance tracking
- **Transaction Logging** - Record income and expenses with categorization and timestamps
- **Interactive Dashboard** - Visual analytics with charts and spending summaries
- **AI Chat Assistant** - Natural language financial advice and budget insights
- **Predictive Analytics** - ML-powered spending pattern recognition and forecasting

### Technical Highlights
- **Full-Stack Architecture** - Seamlessly integrated frontend, backend, and ML services
- **Microservices Design** - Modular, scalable services (prediction, wallet, web, database)
- **Machine Learning** - Scikit-learn powered budget prediction engine
- **Real-time Data** - Live transaction updates and balance synchronization
- **Docker Containerization** - One-command deployment for development and production

---

## 🛠️ Tech Stack

### Frontend
- **React** (with Vite) - Modern, responsive UI
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Interactive data visualizations
- **Sonner** - Toast notifications

### Backend
- **Node.js + Express** - RESTful API server
- **MySQL** - Relational database for transactions and wallet data
- **Axios** - HTTP client for frontend-backend communication

### ML & Prediction
- **Python 3.12** - Core language
- **Flask** - Lightweight API framework
- **Scikit-learn** - Machine learning models
- **Pandas** - Data processing and analysis
- **Joblib** - Model serialization (spba.pkl)

### Infrastructure
- **Docker & Docker Compose** - Containerized microservices
- **Nginx** - Reverse proxy and load balancing
- **Railway** - Cloud deployment platform

---

## 📦 Project Structure

```
SBPA-SUPER-BUDGET-APP-AI/
├── services/
│   ├── web/                    # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── pages/          # Dashboard, Wallets, Chat, Budget
│   │   │   ├── components/     # UI components, forms, charts
│   │   │   ├── services/       # API integration (wallet.js, chat.js)
│   │   │   └── main.jsx
│   │   └── Dockerfile
│   │
│   ├── wallet/                 # Node.js backend API
│   │   ├── index.js            # Express server
│   │   ├── db.js               # MySQL connection
│   │   ├── routes/             # API endpoints (wallet.js, chat.js)
│   │   └── Dockerfile
│   │
│   ├── prediction/             # Python ML service
│   │   ├── api.py              # Flask API
│   │   ├── engine.py           # ML prediction logic
│   │   ├── spba.pkl            # Pre-trained model
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── walletdb/               # MySQL database
│   │   ├── data/               # Database files
│   │   └── init.d/             # Database initialization scripts
│   │
│   └── nginx/                  # Reverse proxy config
│       └── conf.d/web.conf
│
├── docker-compose.yaml         # Orchestrate all services
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker & Docker Compose)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Charles-Amegashie/SBPA-SUPER-BUDGET-APP-AI-.git
   cd SBPA-SUPER-BUDGET-APP-AI-
   ```

2. **Start all services**
   ```bash
   docker-compose up
   ```
   Docker will build and start:
   - React frontend (http://localhost)
   - Node.js API (port 3000)
   - Python ML service (port 5000)
   - MySQL database

3. **Access the app**
   - Open your browser to: **http://localhost**
   - Create a wallet and start tracking expenses!

### First Time Setup
The database initializes automatically with `wallet.sql` schema.

---

## 💡 How It Works

### User Workflow
1. **Create a Wallet** - Set up your personal or shared wallet
2. **Log Transactions** - Add income/expenses with categories
3. **View Analytics** - See spending patterns in real-time charts
4. **Get AI Insights** - Chat with the AI assistant for budget advice
5. **Receive Predictions** - ML model forecasts your next month's spending

### Architecture Flow
```
User Interface (React)
         ↓
    Nginx (Reverse Proxy)
         ↓
Node.js API (Express) ←→ MySQL Database
         ↓
Python ML Engine (Flask)
```

---

## 📊 Key Features in Detail

### Smart Dashboard
- Real-time wallet balance display
- Monthly spending breakdown by category
- Interactive expense charts
- Quick action buttons for common tasks

### AI Chat Assistant
- Natural language financial questions
- Budget recommendations
- Spending analysis
- Integration with wallet data

### Predictive Analytics
- ML model trained on spending patterns
- Forecasts future expenses
- Identifies spending trends
- Helps users plan budgets proactively

---

## 🔧 Configuration

### Environment Variables
Configuration files are auto-generated. Key services:

**Prediction Service** (`services/prediction/.env`)
```
FLASK_ENV=development
PORT=5000
```

**Wallet API** (`services/wallet/.env`)
```
DB_HOST=walletdb
DB_USER=root
DB_PASSWORD=root
DB_NAME=walletdb
APP_PORT=3000
```

**Frontend** (`services/web/.env`)
```
VITE_API_BASE_URL=http://localhost:3000
```

---

## 📈 Performance & Scalability

- **Containerized Services** - Each component scales independently
- **Database Optimization** - MySQL with indexed queries for fast lookups
- **ML Model** - Pre-trained and cached for instant predictions
- **Nginx Load Balancing** - Distributes traffic efficiently
- **RESTful API** - Stateless design for horizontal scaling

---

## 🔒 Security Considerations

- Database credentials in `.env` (not committed to repo)
- Input validation on all API endpoints
- CORS configured for secure cross-origin requests
- MySQL running in isolated container

---

## 🧪 Testing the App

### Sample Workflow
1. Create a wallet named "Monthly Budget"
2. Add test transactions:
   - Income: +$5,000
   - Groceries: -$300
   - Transport: -$150
   - Entertainment: -$200
3. View the dashboard - see your balance and spending breakdown
4. Ask the AI: "Should I adjust my entertainment budget?"
5. Check predictions for next month

---

## 📚 API Endpoints

### Wallet Service
- `GET /wallets` - Retrieve all wallets
- `POST /wallets` - Create new wallet
- `GET /wallets/:id/transactions` - Get transactions
- `POST /transactions` - Add transaction
- `GET /chat` - AI chat endpoint

### Prediction Service
- `POST /predict` - Get spending predictions
- `POST /analyze` - Analyze spending patterns

---

## 🚢 Deployment

### Deploy to Railway (Recommended)
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repo
4. Railway auto-deploys on every push
5. Get a live URL in ~10 minutes

### Docker Production Build
```bash
docker-compose -f docker-compose.yaml up -d
```

---

## 📝 Development

### Adding New Features
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes in appropriate service (web/, wallet/, prediction/)
3. Test locally: `docker-compose up`
4. Commit and push: `git push origin feature/your-feature`
5. Open a pull request

### Service Development
- **Frontend**: Edit `services/web/src/` → Hot reload
- **Backend**: Edit `services/wallet/` → Rebuild with `docker-compose up --build`
- **ML**: Edit `services/prediction/` → Retrain or update model

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👨‍💻 Author

**Charles Amegashie** - Full-Stack Developer
- [GitHub](https://github.com/Charles-Amegashie)
- [LinkedIn](https://www.linkedin.com/in/charlesamegashie)

---

## 🎯 Future Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced budget planning tools
- [ ] Multi-currency support
- [ ] Recurring transaction automation
- [ ] Bill reminders and notifications
- [ ] Investment portfolio tracking
- [ ] Dark mode UI
- [ ] Export reports (PDF/CSV)

---

## ❓ FAQ

**Q: Do I need to install anything besides Docker?**  
A: Nope! Docker handles everything else.

**Q: Can I use this on my phone?**  
A: Currently web-only, but it's responsive. Mobile app coming soon!

**Q: How accurate are the predictions?**  
A: The ML model learns from your spending patterns. Accuracy improves as you log more transactions.

**Q: Is my data safe?**  
A: Yes! Data stays in your local MySQL database. Nothing is sent to external servers.

---

## 📞 Support

Found a bug or have a question? Open an [issue](https://github.com/Charles-Amegashie/SBPA-SUPER-BUDGET-APP-AI-/issues) on GitHub!

---

**Made with ❤️ for smart financial management.**
