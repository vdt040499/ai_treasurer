# AI Treasurer App (APPFUND)

**APPFUND** is a smart team/company fund management application that helps track income, expenses, debts, and member contributions transparently and conveniently. Notably, the app integrates AI to automate data entry and provide spending insights.

## 🌟 Key Features

*   **Smart AI Chatbot:**
    *   Quickly input transactions via chat (text or voice-to-text).
    *   Automatically extract transaction details from invoice/transfer photos (Bill Scanning).
    *   Ask questions about fund status (e.g., "How much was spent on food this month?", "Who hasn't contributed yet?").
*   **Visual Dashboard:**
    *   Real-time income/expense statistics charts.
    *   Track fund balance fluctuations.
*   **Member & Contribution Management:**
    *   Track monthly contribution status for each member.
    *   Automated reminder system.
*   **Debt Tracker:**
    *   Record and track debts and cash advances of members.
    *   Update payment status.
*   **Food Expense Statistics:**
    *   Detailed reports on expenses for food and parties.
*   **Payment Integration (PayOS):**
    *   Support generating payment links/QR codes for easy fund contribution (under development).

## 🛠️ Tech Stack

### Backend
*   **FastAPI:** High-performance Python framework for building APIs.
*   **Supabase:** PostgreSQL database and Authentication.
*   **Google Gemini AI:** Natural Language Processing (NLP) and Vision for transaction and invoice analysis.
*   **PayOS:** Payment Gateway integration.

### Frontend
*   **React (Vite):** Modern, high-speed UI library.
*   **TailwindCSS:** Flexible styling system.
*   **Recharts:** Charting library for statistics.
*   **TypeScript:** Ensures code reliability.

## 🚀 Installation & Setup

The project consists of 2 main parts: `backend` and `frontend`. You need to run both for the application to work fully.

### Prerequisites
*   Node.js (v18+)
*   Python (v3.12+)
*   Google AI Studio Account (to get Gemini API Key)
*   Supabase Account (to get Connection String)

### 1. Backend Setup
See detailed instructions at [backend/README.md](./backend/README.md).

Summary:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create .env file and configure API Keys
python app/main.py
```

### 2. Frontend Setup
See detailed instructions at [frontend/README.md](./frontend/README.md).

Summary:
```bash
cd frontend
npm install
npm run dev
```

## 📂 Project Structure

```
ai-treasurer-app/
├── backend/            # Backend Source (FastAPI)
│   ├── app/
│   │   ├── core/       # Config, Database, Security
│   │   ├── models/     # Data Models
│   │   ├── routers/    # API Endpoints
│   │   ├── services/   # Business Logic & AI
│   │   └── main.py     # Entry point
│   └── ...
├── frontend/           # Frontend Source (React)
│   ├── src/
│   │   ├── components/ # UI Components
│   │   ├── services/   # API Clients
│   │   └── ...
│   └── ...
└── README.md           # General Instructions (This file)
```

## 🤝 Contribution

All contributions are welcome! Please create a Pull Request or open an Issue to share your ideas.
