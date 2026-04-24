# Root Labs Price Urgency Widget

Live countdown timer + stock bar that pairs with the Root Labs Mag + Ashwa TikTok LIVE script. Anchors the `$20 live price` + `timer is running` + `lowest price ever` urgency beats.

## What it looks like

**Overlay (top-right corner of stream):**
- Big countdown timer: `$20 LIVE PRICE ENDS IN 00:47:32`
- Stock bar underneath: `47 bags left at $20` with visual depletion
- Color shifts from green → amber → red as either timer or stock gets low
- When either hits zero: transforms into `$20 SOLD OUT — $24 NOW LIVE`

**Producer panel (second device):**
- Start timer: 30min / 1hr / 2hr / 4hr
- Set stock: 50 / 100 / 250 / 500 / 1000 bags at live price
- Record sold: +1 / +2 / +3 / +5 / +10 buttons (bump down as orders come in)
- Host line shown live based on current state (under 5min? under 20% stock? sold out? paused?)
- Emergency: End live price NOW · Restore (undo)
- Editable price labels

## What's inside
```
server.js             - Backend (Node.js, Express, Socket.io)
public/overlay.html   - Stream overlay (goes in TikTok LIVE Studio)
public/producer.html  - Control panel (second device)
package.json          - Dependencies
```

## Setup

### 1. Install
```
npm install
```

### 2. Test locally
```
node server.js
```
Open http://localhost:3000/overlay.html and http://localhost:3000/producer.html in two tabs.

### 3. Deploy to Railway
```
npm install -g @railway/cli
railway login
railway init
railway up
```
Railway gives you a URL like: `https://your-app.up.railway.app`

### 4. Add to TikTok LIVE Studio
1. Open LIVE Studio
2. Click "+" to add source → select "Link"
3. Paste: `https://your-railway-url.up.railway.app/overlay.html`
4. Position in the TOP-RIGHT corner (this is where the card is designed to sit)

### 5. Open producer on second device
`https://your-railway-url.up.railway.app/producer.html` on a phone or laptop.

## How to use during the live

**Pre-stream:**
1. Set stock: click "100" (or whatever allocation you've given the $20 tier for this block)
2. Confirm price labels ($20 / $24 / $27) match what's actually in TikTok Shop
3. Start timer: click "2 hr" (or your block length)

**During stream:**
- Producer hits +1/+2/+3 when each order comes in on Seller Center
- Host reads the live guidance panel ("Stock is going fast — X bags left")
- Widget auto-flips to SOLD OUT when stock hits zero or timer expires
- If host fluffs and says "only 5 min left" too early, producer can pause the timer

**Between rotations:**
- Don't reset the timer — it's supposed to keep counting down across rotations
- Only reset when starting a new stream block

## Notes

- Timer end and stock end are both "real" — the widget doesn't lie. If you don't want the price to actually change, don't ever let it hit zero.
- The `Restore` button is there for honest mistakes (producer clicked End by accident).
- Stock tracking is manual. The widget does not auto-sync with TikTok Shop — your producer enters orders manually because TikTok Shop's order API isn't exposed through the live-connector library.
- If you deploy with the test tube widget as a second overlay, position the test tube bottom-right (as it's designed) and this widget top-right. They won't overlap.
