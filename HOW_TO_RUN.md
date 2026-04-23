# How to Run AI Gallery

## Terminal 1 — Backend
```powershell
cd D:\AI-Gallery-final\backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

## Terminal 2 — Frontend
```powershell
cd D:\AI-Gallery-final\frontend
yarn install
npx expo start --clear
```

## On your phone
1. Make sure phone and PC are on the **same WiFi**
2. Open Expo Go → scan the QR code
3. If it shows `127.0.0.1` in the URL → run: `set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.6 && npx expo start --clear`
   (replace with your actual IP from `ipconfig`)

## Google Photos
- Already configured in frontend/.env
- Tap the pinwheel icon in Gallery → sign in with Google
- Make sure `https://auth.expo.io/@sahil6383/ai-gallery` is in Google Console redirect URIs
