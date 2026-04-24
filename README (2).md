# Root Labs Test Tube Overlay

## What's inside
```
server.js             - Backend (Node.js)
public/overlay.html   - Stream overlay (goes in TikTok LIVE Studio)
public/producer.html  - Control panel (your second device)
package.json          - Dependencies
```

## Setup (5 minutes)

### 1. Install
```
npm install
```

### 2. Test locally
```
node server.js
```
Open http://localhost:3000/overlay.html and http://localhost:3000/producer.html in two tabs. Use producer to test.

### 3. Deploy to Railway
```
npm install -g @railway/cli
railway login
railway init
railway up
```
Railway gives you a URL like: https://your-app.up.railway.app

### 4. Set TikTok username (optional)
In Railway dashboard, add environment variable:
```
TIKTOK_USERNAME=the_creator_going_live
```
Likes will auto-fill the tube. Creator MUST be live before server starts.

### 5. Add to TikTok LIVE Studio
1. Open LIVE Studio
2. Click "+" to add source
3. Select "Link"
4. Paste: https://your-railway-url.up.railway.app/overlay.html
5. Resize and position (bottom-right works best)

### 6. Open producer on second device
Open https://your-railway-url.up.railway.app/producer.html on a phone/laptop.
Use "+clicks" buttons when you see orders come in on Seller Center.

## How it works during the live
- Likes automatically fill the tube (if TikTok connected)
- Producer manually adds clicks when real orders come in
- At 25%: Flash sale unlocks (20% off)
- At 50%: Bundle deal drops (25% off 2-pack)
- At 75%: Free shipping unlocks
- At 100%: Max potency deal (30% off everything)
- Producer reads the host line to the creator via earpiece
- Reset between mega loops

## Using with OBS instead
Add Browser Source -> URL: your-railway-url/overlay.html -> Width 340 Height 500
