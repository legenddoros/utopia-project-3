const express = require("express");
const nunjucks = require("nunjucks");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// serve static files (CSS, images, js, etc.)
app.use(express.static(path.join(__dirname, "public")));

// nunjucks setup
nunjucks.configure(path.join(__dirname, "views"), {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");

// helper to safely read asset folders
function getAssets(folderPath, publicPrefix) {
  try {
    const files = fs.readdirSync(folderPath);
    return files.map((file) => `${publicPrefix}/${file}`);
  } catch (err) {
    console.error(`Could not read assets from ${folderPath}:`, err.message);
    return [];
  }
}

// MAIN PAGE
app.get("/", (req, res) => {
  res.render("index", {
    title: "Main",
  });
});

// HEAVEN PAGE
app.get("/heaven", (req, res) => {
  const assets = getAssets(
    path.join(__dirname, "public/assets/heaven"),
    "/assets/heaven",
  );

  res.render("heaven", {
    title: "Heaven",
    assets,
  });
});

// HELL PAGE
app.get("/hell", (req, res) => {
  const assets = getAssets(
    path.join(__dirname, "public/assets/hell"),
    "/assets/hell",
  );

  res.render("hell", {
    title: "Hell",
    assets,
  });
});

// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
