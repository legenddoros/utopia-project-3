const express = require("express");
const nunjucks = require("nunjucks");
const fs = require("fs");
const path = require('path');

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

const files = fs.readdirSync("public/assets/heaven");
const assets = files.map(file => "/assets/heaven/" + file);
 res.render('heaven', {assets});

});

// HELL PAGE
app.get("/hell", (req, res) => {
  const files = fs.readdirSync('public/assets/hell');
  const assets = files.map(file =>'assets/hell' + file);
  res.render('hell', {assets});
});

// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
