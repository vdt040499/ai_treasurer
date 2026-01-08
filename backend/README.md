# AI Treasurer Backend API

Backend API sử dụng FastAPI, Supabase và Google Gemini AI.

## Yêu cầu

- Python 3.12 hoặc cao hơn
- pip (Python package manager)

## Cài đặt

### 1. Tạo virtual environment (khuyến nghị)

```bash
cd backend
python3 -m venv venv

# Kích hoạt virtual environment
# Trên macOS/Linux:
source venv/bin/activate

# Trên Windows:
# venv\Scripts\activate
```

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Tạo file `.env`

Tạo file `.env` trong thư mục `backend/` với nội dung:

```env
# Google AI API Key
GOOGLE_API_KEY=your_google_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional: CORS Origins (mặc định: *)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional: Debug mode
DEBUG=False
```

**Lưu ý:**
- `SUPABASE_SERVICE_ROLE_KEY` được ưu tiên sử dụng (bypass RLS)
- Nếu không có `SUPABASE_SERVICE_ROLE_KEY`, sẽ dùng `SUPABASE_KEY`
- Get API keys từ:
  - Google AI: https://makersuite.google.com/app/apikey
  - Supabase: Project Settings → API

## Chạy server

### Cách 1: Sử dụng uvicorn trực tiếp

```bash
# Từ thư mục backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Cách 2: Sử dụng Python module

```bash
# Từ thư mục backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Cách 3: Chạy trực tiếp từ main.py

```bash
# Từ thư mục backend
python app/main.py
```

## Kiểm tra server

Sau khi chạy, server sẽ chạy tại: `http://localhost:8000`

### API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Health Check

```bash
curl http://localhost:8000/
```

Response:
```json
{
  "message": "AI Treasurer API is running"
}
```

## Cấu trúc project

```
backend/
├── app/
│   ├── main.py              # Entry point
│   ├── core/
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Supabase client
│   │   └── queue_manager.py # Background worker
│   ├── models/              # Pydantic models
│   ├── routers/             # API routes
│   └── services/            # Business logic
├── requirements.txt         # Dependencies
└── .env                     # Environment variables (tạo file này)
```

## API Endpoints

### AI Endpoints
- `POST /api/chat` - Chat với AI để extract transaction từ text
- `POST /api/ai/process-income-image` - Xử lý ảnh income

### Transaction Endpoints
- `GET /api/transactions/` - Lấy danh sách transactions (có filters)
- `POST /api/transactions/` - Tạo transaction mới

### User Endpoints
- `GET /api/users/` - Lấy danh sách users
- `POST /api/users/` - Tạo user mới

## Troubleshooting

### Lỗi: "GOOGLE_API_KEY environment variable is not set"
- Kiểm tra file `.env` có tồn tại không
- Kiểm tra `GOOGLE_API_KEY` có được set trong `.env` không
- Đảm bảo file `.env` ở đúng thư mục `backend/`

### Lỗi: "Missing key inputs argument"
- Kiểm tra `GOOGLE_API_KEY` có đúng format không
- Đảm bảo không có khoảng trắng thừa trong `.env`

### Lỗi: "Row-level security policy violation"
- Sử dụng `SUPABASE_SERVICE_ROLE_KEY` thay vì `SUPABASE_KEY`
- Hoặc cấu hình RLS policies trong Supabase

### Port đã được sử dụng
```bash
# Thay đổi port
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Development

### Auto-reload
Server tự động reload khi code thay đổi (nếu dùng `--reload` flag).

### Logs
Logs được in ra console, bao gồm:
- Worker status
- API requests
- Error messages

## Production

Để chạy production, không dùng `--reload`:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Hoặc sử dụng Gunicorn với Uvicorn workers:

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

