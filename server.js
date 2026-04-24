const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.static(path.join(__dirname, "public")));

let state = {
  // Timer
  timerEndsAt: null,          // Unix ms when $20 price ends (null = not running)
  timerPausedRemainingSec: 7200, // when paused, we store remaining seconds here
  timerRunning: false,
  // Stock
  stockInitial: 100,
  stockSold: 0,
  // Price labels (editable from producer)
  priceLive: "$20",
  priceFlash: "$24",
  priceRegular: "$27",
  // State
  priceActive: true,          // false when sold out OR timer expired
  endReason: null,            // "timer" | "stock" | "manual" | null
};

function checkTransitions() {
  if (!state.priceActive) return;
  const now = Date.now();
  const timerExpired = state.timerRunning && state.timerEndsAt && state.timerEndsAt <= now;
  const stockOut = state.stockSold >= state.stockInitial;
  if (timerExpired) {
    state.priceActive = false;
    state.timerRunning = false;
    state.endReason = "timer";
  } else if (stockOut) {
    state.priceActive = false;
    state.endReason = "stock";
  }
}

function broadcast() {
  checkTransitions();
  io.emit("state", state);
}

// Broadcast every second so clients can update their live timer display
setInterval(broadcast, 1000);

io.on("connection", (socket) => {
  socket.emit("state", state);

  socket.on("start_timer", (durationSec) => {
    const dur = parseInt(durationSec) || state.timerPausedRemainingSec;
    state.timerEndsAt = Date.now() + (dur * 1000);
    state.timerPausedRemainingSec = dur;
    state.timerRunning = true;
    state.priceActive = true;
    state.endReason = null;
    broadcast();
  });

  socket.on("pause_timer", () => {
    if (state.timerRunning && state.timerEndsAt) {
      state.timerPausedRemainingSec = Math.max(0, Math.floor((state.timerEndsAt - Date.now()) / 1000));
      state.timerEndsAt = null;
      state.timerRunning = false;
    }
    broadcast();
  });

  socket.on("resume_timer", () => {
    if (!state.timerRunning) {
      state.timerEndsAt = Date.now() + (state.timerPausedRemainingSec * 1000);
      state.timerRunning = true;
      state.priceActive = true;
      state.endReason = null;
    }
    broadcast();
  });

  socket.on("reset_timer", (durationSec) => {
    const dur = parseInt(durationSec) || 7200;
    state.timerEndsAt = null;
    state.timerPausedRemainingSec = dur;
    state.timerRunning = false;
    state.priceActive = true;
    state.endReason = null;
    broadcast();
  });

  socket.on("end_price_now", () => {
    state.priceActive = false;
    state.timerRunning = false;
    state.timerEndsAt = null;
    state.endReason = "manual";
    broadcast();
  });

  socket.on("restore_price", () => {
    // Manual "put $20 back on" if the producer ended it by mistake
    state.priceActive = true;
    state.endReason = null;
    if (state.stockSold >= state.stockInitial) {
      // can't restore if stock is out — bump stock
      state.stockInitial = state.stockSold + 10;
    }
    broadcast();
  });

  socket.on("set_stock", (initial) => {
    const n = parseInt(initial);
    if (!isNaN(n) && n > 0) {
      state.stockInitial = n;
      state.stockSold = 0;
      state.priceActive = true;
      state.endReason = null;
      broadcast();
    }
  });

  socket.on("add_sold", (n) => {
    const count = parseInt(n) || 1;
    state.stockSold = Math.min(state.stockInitial, state.stockSold + count);
    broadcast();
  });

  socket.on("sub_sold", (n) => {
    const count = parseInt(n) || 1;
    state.stockSold = Math.max(0, state.stockSold - count);
    if (state.stockSold < state.stockInitial && state.endReason === "stock") {
      state.priceActive = true;
      state.endReason = null;
    }
    broadcast();
  });

  socket.on("set_prices", (prices) => {
    if (prices.live) state.priceLive = prices.live;
    if (prices.flash) state.priceFlash = prices.flash;
    if (prices.regular) state.priceRegular = prices.regular;
    broadcast();
  });
});

app.get("/health", (req, res) => res.json({ ok: true, ...state }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("\n  Root Labs Price Urgency");
  console.log("  Overlay:   http://localhost:" + PORT + "/overlay.html");
  console.log("  Producer:  http://localhost:" + PORT + "/producer.html");
  console.log("  Health:    http://localhost:" + PORT + "/health\n");
});
