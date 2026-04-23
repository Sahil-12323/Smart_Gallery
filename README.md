# AI Gallery v2.0 — Supabase + Google Photos 🧠✨

## 🐛 Fixes in this version

| Error | Fix |
|---|---|
| `ImagePicker.MediaTypeOptions deprecated` | Changed to `mediaTypes: ["images"]` (new API) |
| `Network request failed` | Better error messages, 15s timeout, LAN IP guidance |
| Upload not working | Proper error handling, progress indicator |

---

## 🔗 Google Photos Integration

The gallery now has a **Google Photos button** (coloured pinwheel icon in the header).

### What it does
- Browse your entire Google Photos library inside the app
- Browse albums
- **Import individual photos** → downloads + analyzes with Groq AI → stores in Supabase
- **Import entire albums** at once
- Checkmark shows which photos are already imported

### Setup (one-time)

**Step 1 — Google Cloud Console**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Google Photos Library API**
3. OAuth Consent Screen → External → add scope `photoslibrary.readonly`
4. Credentials → Create OAuth 2.0 Client ID → **Web application**
5. Authorized redirect URI: `http://localhost:8000/api/auth/google/callback`
6. Copy **Client ID** and **Client Secret**

**Step 2 — Backend `.env`**
```
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
```

**Step 3 — Frontend `.env`**
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

That's it! Tap the Google Photos pinwheel icon in the Gallery header to connect.

---

## ⚙️ Fixing "Network request failed"

This error means the app can't reach your backend. Common causes:

### Running on a physical device
You **must** use your machine's LAN IP, not `localhost`:
```bash
# Find your IP
ifconfig | grep "inet " | grep -v 127    # macOS/Linux
ipconfig                                  # Windows

# Set in frontend/.env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.42:8000
```

### Running in simulator/emulator
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000    # iOS simulator
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000     # Android emulator
```

### Backend not running?
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```
The `--host 0.0.0.0` is important — it makes the backend reachable from your phone.

---

## 🚀 Full Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env   # set EXPO_PUBLIC_BACKEND_URL
npx expo start
```

### Supabase Schema (first time only)
SQL Editor → paste `backend/schema.sql` → Run

---

## 📱 API Endpoints (new in this version)

| Method | Path | Description |
|---|---|---|
| GET | /api/auth/google/callback | OAuth redirect handler |
| POST | /api/auth/google/token | Exchange auth code for token |
| POST | /api/photos/import-url | Import photo from URL (Google Photos) |
