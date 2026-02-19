# AI Treasurer Frontend (APPFUND)

The Frontend application is built with **React**, **Vite**, and **TailwindCSS**. It provides an intuitive, user-friendly interface integrated with AI Chatbot and Statistical Dashboard.

## 🌟 Key Features

*   **Overview Dashboard:** View fund balance, total income/expenses by month/year.
*   **AI Chatbot:** Smart data entry via voice or text.
*   **Member Management:** View contribution lists and payment status for each member.
*   **Transaction List:** Detailed history with search filters.
*   **Debt Tracker:** Display debts and payment status.
*   **Food Statistics:** Separate charts for food expenses.

## 🛠️ Frontend Technologies

*   **React (w/ TypeScript):** Core UI library.
*   **Vite:** Super-fast build tool.
*   **TailwindCSS:** Utility-first CSS framework.
*   **Recharts:** Powerful charting library.
*   **Axios:** HTTP request handler.
*   **Google GenAI SDK:** Direct Gemini AI integration (if client-side processing is needed).

## 🚀 Installation & Run

### 1. Install Node.js

Ensure Node.js (version 18 or higher) is installed.

### 2. Install Dependencies

```bash
cd frontend
npm install
# Or use yarn: yarn install
```

### 3. Configure Environment Variables (.env.local)

Create a `.env.local` file if needed (e.g., API URL, Client-side Google AI Key):

```env
# Backend API URL (Default is http://localhost:8000)
VITE_API_URL=http://localhost:8000

# Google Gemini API Key (If using client-side AI)
# VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open your browser at: [http://localhost:5173](http://localhost:5173)

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/     # UI Components (Dashboard, TransactionList, ChatBot...)
│   ├── services/       # API Calls (axios configs)
│   ├── utils/          # Utility functions (currency formatting, date)
│   ├── types.ts        # TypeScript interfaces
│   ├── App.tsx         # Main Component
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── package.json        # Dependencies & Scripts
```

## 🎨 Customization

*   **Tailwind Config:** Edit `tailwind.config.js` to change themes, colors.
*   **Global Styles:** `index.css` contains global styles (fonts, base styles).

## 📦 Build Production

To build the application for production:

```bash
npm run build
```

The build result will be in the `dist/` directory. You can deploy this folder to Vercel, Netlify, or any static hosting.
