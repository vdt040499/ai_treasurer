# AI Treasurer Backend API

The Backend API uses **FastAPI**, **Supabase**, and **Google Gemini AI**. It supports income/expense management, debt tracking, and PayOS payment integration.

## 🌟 Backend Features

*   **Transaction Management API:** Add, edit, delete, and filter transactions by day/month/type.
*   **AI Chat & Processing:**
    *   Uses Gemini AI to analyze text messages into structured transactions.
    *   Extracts information from invoice/transfer images.
*   **Debt Management:**
    *   Record debts and cash advances.
    *   Update payment status (paid/unpaid).
*   **PayOS Integration:** Automatically generate payment links (under development).
*   **User Management:** Track fund contributions and payment status.

## 🛠️ System Requirements

*   Python 3.12+
*   pip
*   Supabase & Google AI Studio accounts

## 🚀 Detailed Installation

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv

# Activate environment:
# MacOS/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables (.env)

Create a `.env` file in the `backend/` directory based on the template below:

```env
# --- Google AI (Gemini) ---
GOOGLE_API_KEY=your_google_ai_api_key

# --- Supabase Database ---
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# --- PayOS (Optional - for payments) ---
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# --- App Config ---
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=True
```

> **Note:** `SUPABASE_SERVICE_ROLE_KEY` is crucial for bypassing RLS (Row Level Security) when necessary on the backend.

### 4. Run Server

```bash
# Run with auto-reload (Development)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 📚 API Documentation

After starting the server, access:
*   **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs) - For direct API testing.
*   **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 📡 Key Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **AI** | `/api/chat` | Chat with AI to create transaction from text |
| **AI** | `/api/ai/process-income-image` | Upload image to extract transaction |
| **Transaction** | `/api/transactions/` | Get list of transactions (supports filters) |
| **Transaction** | `/api/transactions/` | Create new transaction (manual) |
| **Debt** | `/api/debts/` | Get list of debts |
| **Debt** | `/api/debts/{id}/pay` | Update debt status to paid |
| **Payment** | `/api/payments/create` | Create PayOS payment link |

## 🐛 Common Troubleshooting

1.  **Import/Module not found Error:**
    *   Ensure venv is activated (`source venv/bin/activate`).
    *   Re-run `pip install -r requirements.txt`.

2.  **Supabase Connection Error:**
    *   Double check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`.
    *   Ensure your IP is not blocked by Supabase Network Restrictions.

3.  **Google AI Key Error:**
    *   Ensure `GOOGLE_API_KEY` is valid and has access to Gemini Pro/Flash.
