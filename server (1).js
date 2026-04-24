const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

let WebcastPushConnection;
try {
  WebcastPushConnection = require("tiktok-live-connector").WebcastPushConnection;
} catch (e) {
  console.log("tiktok-live-connector not installed - manual mode only");
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.static(path.join(__dirname, "public")));

const MILESTONES = [25, 50, 75, 100];

let state = {
  clicks: 0,
  target: 500,
  fillPct: 0,
  milestones: [false, false, false, false],
};

function recalculate() {
  if (state.clicks > state.target) state.clicks = state.target;
  state.fillPct = Math.min(Math.round((state.clicks / state.target) * 100), 100);
  MILESTONES.forEach((m, i) => { state.milestones[i] = state.fillPct >= m; });
}

function addClicks(n) {
  n = parseInt(n);
  if (isNaN(n) || n < 1) return;
  state.clicks += n;
  recalculate();
  io.emit("state", state);
}

function setTarget(t) {
  t = parseInt(t);
  if (isNaN(t) || t < 10) return;
  state.target = t;
  recalculate();
  io.emit("state", state);
}

function reset() {
  state.clicks = 0;
  state.fillPct = 0;
  state.milestones = [false, false, false, false];
  io.emit("state", state);
}

const TT_USER = process.env.TIKTOK_USERNAME || "";
let ttConn = null;
let isConnected = false;

function connectTikTok(username) {
  if (!WebcastPushConnection) {
    io.emit("tt_status", { connected: false, error: "Library not installed" });
    return;
  }
  if (ttConn) { try { ttConn.disconnect(); } catch (e) {} }
  isConnected = false;

  console.log("Connecting to @" + username);
  ttConn = new WebcastPushConnection(username, {
    processInitialData: false,
    enableExtendedGiftInfo: false,
  });

  ttConn.connect()
    .then((room) => {
      isConnected = true;
      console.log("LIVE connected - Room " + room.roomId);
      io.emit("tt_status", { connected: true, user: username });
    })
    .catch((e) => {
      isConnected = false;
      ttConn = null;
      console.log("Connection failed: " + e.message);
      io.emit("tt_status", { connected: false, error: e.message });
    });

  ttConn.on("like", (data) => {
    var count = data.likeCount || data.totalLikeCount || 1;
    addClicks(Math.min(count, 50));
  });

  ttConn.on("disconnected", () => {
    isConnected = false;
    io.emit("tt_status", { connected: false });
  });
}

io.on("connection", (socket) => {
  socket.emit("state", state);
  socket.emit("tt_status", { connected: isConnected, user: TT_USER });

  socket.on("add", (n) => addClicks(n));
  socket.on("set_target", (t) => setTarget(t));
  socket.on("reset", () => reset());
  socket.on("connect_tt", (u) => {
    if (typeof u === "string" && u.trim().length > 0) connectTikTok(u.trim());
  });
});

app.get("/health", (req, res) => res.json({ ok: true, ...state, connected: isConnected }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("\n  Root Labs Test Tube Overlay");
  console.log("  Overlay:   http://localhost:" + PORT + "/overlay.html");
  console.log("  Producer:  http://localhost:" + PORT + "/producer.html");
  console.log("  Health:    http://localhost:" + PORT + "/health\n");
  if (TT_USER) connectTikTok(TT_USER);
  else console.log("  Manual mode - use producer panel to add clicks\n");
});
