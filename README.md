# RYVON

Souled Store–style shoes ecommerce (React + Node).

**Repo:** https://github.com/Harshit7563/RYVON

## Local run

```bash
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5001
- Admin: http://localhost:5173/admin/login

## cPanel live (SSH)

```bash
# 1) Clone
cd ~
git clone https://github.com/Harshit7563/RYVON.git
cd RYVON
npm run install:all

# 2) Build website (change domain if needed)
cd client
cat > .env <<'EOF'
VITE_API_URL=https://api.ryvon.fit/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
EOF
npm run build

# 3) Upload frontend to public_html
cp -r dist/* ~/public_html/

# 4) API deps
cd ~/RYVON/server
npm install --production
```

Then in **cPanel → Setup Node.js App**:

- Application root: `RYVON/server`
- Application startup file: `index.js`
- Application URL: `api.ryvon.fit` (or subdomain you create)
- Node version: 18+ / 20+
- Click **Run NPM Install** → **Restart**

DNS: point `ryvon.fit` → main hosting, `api.ryvon.fit` → same server.

Google Console: add `https://ryvon.fit` to OAuth JS origins.
