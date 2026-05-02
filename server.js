const express = require("express");
const nunjucks = require("nunjucks");

const app = express();
const PORT = 3000;

// serve static files (CSS, images, etc.)
app.use(express.static("public"));

// nunjucks setup
nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");

// MAIN PAGE
app.get("/", (req, res) => {
  res.render("index", {
    title: "Main",
  });
});

// HEAVEN PAGE
app.get("/heaven", (req, res) => {
  res.render("network-a", {
    title: "Heaven",
  });
});

// HELL PAGE
app.get("/hell", (req, res) => {
  res.render("network-b", {
    title: "Hell",
  });
});

// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
