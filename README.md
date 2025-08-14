# POS Complete (Server + Expo App)

This package contains:
- `server/` — Node.js + Express backend with SQLite (pos.db). Default admin user created (`admin` / `admin123`).
- `app/` — Expo React Native app (mobile).

## Quickstart (local)
### Backend
1. Install Node.js (v16+ recommended).
2. Open terminal in `server/`:
   ```
   cd server
   npm install
   node db_init.js
   npm start
   ```
   Server will run on port 4000 by default and create `pos.db`.

### Expo app
1. In another terminal:
   ```
   cd app
   npm install
   ```
2. Edit `App.js` and set `SERVER = 'http://YOUR_SERVER_IP:4000'` to point to your machine (or use emulator with localhost).
3. Run:
   ```
   npm start
   ```
   Open in Expo Go (scan QR) or run on emulator.

## Notes & Next steps
- This is a production *starter*. For full production you'll want:
  - Use PostgreSQL or managed DB.
  - Use HTTPS, proper JWT secrets, env vars.
  - Add role-based access, password reset, audit logs.
  - Integrate printer SDKs, payment gateways (Razorpay/Stripe), and offline sync for devices.
- To create a standalone APK/AAB for Android, use EAS Build (Expo) or build native.

If you want, I can:
- Create a ready-to-install APK (using EAS) and provide the download link.
- Add printing integration (ESC/POS) for local LAN printers.
- Deploy the server to a VPS or Render/Heroku and give you a hosted URL.
