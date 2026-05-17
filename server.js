const express = require("express");
const nunjucks = require("nunjucks");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const STATE_FILE = path.join(__dirname, "canvas-state.json");

const WORLD_NAMES = new Set(["heaven", "hell"]);
const IMAGE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".avif",
  ".svg",
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readImageAssets(folderPath, publicPrefix) {
  try {
    if (!fs.existsSync(folderPath)) return [];

    return fs
      .readdirSync(folderPath)
      .filter((file) => IMAGE_EXTS.has(path.extname(file).toLowerCase()))
      .sort()
      .map((file) => `${publicPrefix}/${file}`);
  } catch (err) {
    console.error(`Could not read assets from ${folderPath}:`, err.message);
    return [];
  }
}

function getWorldAssets(world) {
  const baseAssets = readImageAssets(
    path.join(__dirname, "public", "assets", world),
    `/assets/${world}`,
  );

  const uploadedAssets = readImageAssets(
    path.join(__dirname, "public", "uploads", world),
    `/uploads/${world}`,
  );

  return [...baseAssets, ...uploadedAssets];
}

function validateWorld(req, res, next) {
  const { world } = req.params;
  if (!WORLD_NAMES.has(world)) {
    return res.status(400).json({ error: "Invalid world" });
  }
  next();
}

function loadCanvasState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return { heaven: null, hell: null };
    }

    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);

    return {
      heaven: parsed.heaven ?? null,
      hell: parsed.hell ?? null,
    };
  } catch (err) {
    console.error("Could not load canvas state:", err.message);
    return { heaven: null, hell: null };
  }
}

function saveCanvasState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(canvasState, null, 2), "utf8");
  } catch (err) {
    console.error("Could not save canvas state:", err.message);
  }
}

let canvasState = loadCanvasState();

// static files
app.use(express.static(path.join(__dirname, "public")));

// nunjucks
nunjucks.configure(path.join(__dirname, "views"), {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");

// ensure upload folders exist
ensureDir(path.join(__dirname, "public", "uploads", "heaven"));
ensureDir(path.join(__dirname, "public", "uploads", "hell"));

// multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const world = req.params.world;
    const dest = path.join(__dirname, "public", "uploads", world);
    ensureDir(dest);
    cb(null, dest);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]+/gi, "_")
      .slice(0, 40);

    const safeBase = baseName || "upload";
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    cb(null, `${unique}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

// pages
app.get("/", (req, res) => {
  res.render("index", {
    title: "Main",
  });
});

app.get("/heaven", (req, res) => {
  res.render("heaven", {
    title: "Heaven",
    assets: getWorldAssets("heaven"),
  });
});

app.get("/hell", (req, res) => {
  res.render("hell", {
    title: "Hell",
    assets: getWorldAssets("hell"),
  });
});

// upload
app.post(
  "/api/assets/:world/upload",
  validateWorld,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const url = `/uploads/${req.params.world}/${req.file.filename}`;
    res.json({ url });
  },
);

app.post("/api/whisper", express.json(), (req, res) => {
  const answer = String(req.body.answer || "")
    .trim()
    .toLowerCase();

  // hidden server-side secret
  const success = answer === "love";

  res.json({ success });
});

// realtime canvas sync
io.on("connection", (socket) => {
  socket.on("canvas:join", (world) => {
    if (!WORLD_NAMES.has(world)) return;

    socket.join(world);
    socket.data.world = world;

    socket.emit("canvas:init", {
      world,
      state: canvasState[world],
    });
  });

  socket.on("canvas:update", ({ world, state }) => {
    if (!WORLD_NAMES.has(world)) return;

    canvasState[world] = state;
    saveCanvasState();

    socket.to(world).emit("canvas:update", { world, state });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
