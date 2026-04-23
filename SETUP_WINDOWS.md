# 📱 Running AI Gallery on Your Android Phone (Windows)

## Why you got the error
`java.io.IOException: Failed to download remote update`

Metro bundler was running on `127.0.0.1` (your PC's localhost).  
Your Android phone **cannot reach your PC's localhost** over WiFi.  
You need to use your PC's **LAN IP address** (like `192.168.x.x`) or a **tunnel**.

---

## ✅ Fix — Choose ONE of these methods:

---

### Method 1 — TUNNEL (Easiest, works everywhere) ⭐ RECOMMENDED

This uses ngrok to create a public URL. No IP address needed.

```powershell
cd D:\AI-Gallery-v3\frontend
npx expo start --tunnel
```

Expo will show a new QR code with an `exp://xxx.ngrok.io` URL.  
Scan it with Expo Go — it will work.

> First time only: it may ask to install `@expo/ngrok` — say yes.

---

### Method 2 — LAN (Fastest, phone and PC on same WiFi)

**Step 1** — Find your PC's IP:
```powershell
ipconfig
```
Look for `IPv4 Address` under your WiFi adapter (e.g. `192.168.1.45`)

**Step 2** — Start Expo with LAN mode:
```powershell
cd D:\AI-Gallery-v3\frontend
npx expo start --lan
```

**Step 3** — Set your backend URL  
Create/edit `D:\AI-Gallery-v3\frontend\.env`:
```
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.45:8000
```
Replace `192.168.1.45` with your actual IP from Step 1.

**Step 4** — Start backend with LAN binding:
```powershell
cd D:\AI-Gallery-v3\backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```
The `--host 0.0.0.0` is critical — without it the backend only listens on localhost.

---

### Method 3 — USB Debugging (No WiFi needed)

```powershell
# Enable Developer Options on Android → USB Debugging → plug in phone
adb reverse tcp:8081 tcp:8081   # forwards Metro
adb reverse tcp:8000 tcp:8000   # forwards backend
npx expo start
```
Now `localhost` will work because adb tunnels the ports.

---

## 🔄 Start Everything — Quick Reference

### Terminal 1 — Backend
```powershell
cd D:\AI-Gallery-v3\backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 — Frontend (Tunnel)
```powershell
cd D:\AI-Gallery-v3\frontend
npx expo start --tunnel
```

Scan the NEW QR code (not the old one with 127.0.0.1).

---

## ❓ Common issues

| Problem | Fix |
|---|---|
| `127.0.0.1` in QR URL | Use `--tunnel` or `--lan` flag |
| Still getting network error | Make sure `.env` has your LAN IP, not localhost |
| Backend unreachable | Add `--host 0.0.0.0` to uvicorn command |
| ngrok not installed | Run `npm install -g @expo/ngrok` |
| Different WiFi networks | Phone and PC must be on the **same** WiFi network (for LAN method) |
| Firewall blocking | Allow port 8000 + 8081 in Windows Defender Firewall |
