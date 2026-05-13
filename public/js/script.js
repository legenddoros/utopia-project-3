const canvas = new fabric.Canvas("mainCanvas", {
  preserveObjectStacking: true,
  selection: true,
});

const wordBank = document.getElementById("wordBank");
const refreshWordsBtn = document.getElementById("refreshWordsBtn");
const openAboutBtn = document.getElementById("openAboutBtn");
const closeAboutBtn = document.getElementById("closeAboutBtn");
const aboutModal = document.getElementById("aboutModal");
const world = document.body.dataset.world || "heaven";
const uploadBtn = document.getElementById("uploadBtn");
const assetUpload = document.getElementById("assetUpload");
const uploadStatus = document.getElementById("uploadStatus");
const assetScroll = document.querySelector(".asset-scroll");

// implementing draw features

const drawBtn = document.getElementById("drawBtn");
const eraseBtn = document.getElementById("eraseBtn");
const brushColor = document.getElementById("brushColor");
const brushSize = document.getElementById("brushSize");

canvas.isDrawingMode = false;

if (openAboutBtn && aboutModal) {
  openAboutBtn.addEventListener("click", () => {
    aboutModal.classList.remove("hidden");
  });
}

if (closeAboutBtn && aboutModal) {
  closeAboutBtn.addEventListener("click", () => {
    aboutModal.classList.add("hidden");
  });
}

if (aboutModal) {
  aboutModal.addEventListener("click", (event) => {
    if (event.target === aboutModal) {
      aboutModal.classList.add("hidden");
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && aboutModal && !aboutModal.classList.contains("hidden")) {
    aboutModal.classList.add("hidden");
  }
});

if (brushColor) {
  canvas.freeDrawingBrush.color = brushColor.value;

  brushColor.addEventListener("input", () => {
    canvas.freeDrawingBrush.color = brushColor.value;
  });
}

if (brushSize) {
  canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10);

  brushSize.addEventListener("input", () => {
    canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10);
  });
}

if (drawBtn) {
  drawBtn.addEventListener("click", () => {
    canvas.isDrawingMode = !canvas.isDrawingMode;

    drawBtn.textContent = canvas.isDrawingMode
      ? "Draw Mode: On"
      : "Draw Mode: Off";

    // make it easier to draw without selecting objects
    canvas.selection = !canvas.isDrawingMode;
    canvas.forEachObject((obj) => {
      obj.selectable = !canvas.isDrawingMode;
      obj.evented = !canvas.isDrawingMode;
    });

    canvas.discardActiveObject();
    canvas.requestRenderAll();
  });
}
//eraser button
if (eraseBtn) {
  eraseBtn.addEventListener("click", () => {
    // if draw mode is on, turn it off first
    if (canvas.isDrawingMode) {
      canvas.isDrawingMode = false;
      canvas.selection = true;

      if (drawBtn) {
        drawBtn.textContent = "Draw Mode: Off";
      }

      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    }

    const active = canvas.getActiveObject();

    if (!active) {
      if (uploadStatus) uploadStatus.textContent = "Select something to erase.";
      return;
    }

    if (active.type === "activeSelection") {
      active.forEachObject((obj) => canvas.remove(obj));
    } else {
      canvas.remove(active);
    }

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    if (uploadStatus) uploadStatus.textContent = "Object removed.";
  });
}

// resize canvas to fit layout
function resizeCanvas() {
  const stage = document.querySelector(".canvas-stage");
  const canvasEl = document.getElementById("mainCanvas");

  if (!stage || !canvasEl) return;

  const width = stage.clientWidth;
  const height = stage.clientHeight;

  canvas.setWidth(width);
  canvas.setHeight(height);
  canvas.calcOffset();
  canvas.requestRenderAll();
}

// add image to canvas
function addImage(src, x = 200, y = 200) {
  fabric.Image.fromURL(
    src,
    function (img) {
      img.set({
        left: x,
        top: y,
        originX: "center",
        originY: "center",
        selectable: true,
        transparentCorners: false,
        cornerColor: "#3657c8",
        borderColor: "#3657c8",
        cornerStyle: "circle",
      });

      if (img.width > 300) {
        img.scaleToWidth(180);
      }

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    },
    {
      crossOrigin: "anonymous",
    },
  );
}
function addWordMagnet(word, x = 220, y = 220) {
  const textColor = world === "hell" ? "#ffe1e1" : "#18325e";
  const fillColor = world === "hell" ? "#241515" : "#ffffff";
  const strokeColor = world === "hell" ? "#7a2b2b" : "#8fb1f1";

  const text = new fabric.Text(word, {
    fontSize: 18,
    fontFamily: '"Trebuchet MS", "Segoe UI", Arial, sans-serif',
    fontWeight: "700",
    fill: textColor,
    originX: "center",
    originY: "center",
  });

  const bg = new fabric.Rect({
    width: text.width + 28,
    height: text.height + 18,
    rx: 8,
    ry: 8,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: 1.5,
    originX: "center",
    originY: "center",
    shadow:
      world === "hell"
        ? "0 3px 10px rgba(0,0,0,0.25)"
        : "0 3px 10px rgba(90,125,215,0.12)",
  });

  const magnet = new fabric.Group([bg, text], {
    left: x,
    top: y,
    originX: "center",
    originY: "center",
    selectable: true,
    transparentCorners: false,
    cornerColor: world === "hell" ? "#ff4d4d" : "#3657c8",
    borderColor: world === "hell" ? "#ff4d4d" : "#3657c8",
    cornerStyle: "circle",
  });

  canvas.add(magnet);
  canvas.setActiveObject(magnet);
  canvas.requestRenderAll();
}

// wire up a thumb so it can be clicked or dragged
function wireThumb(thumb) {
  thumb.addEventListener("click", () => {
    addImage(
      thumb.dataset.src,
      200 + Math.random() * 250,
      150 + Math.random() * 200,
    );
  });

  thumb.setAttribute("draggable", true);

  thumb.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("img", thumb.dataset.src);
  });
}

// existing thumbs
document.querySelectorAll(".thumb").forEach(wireThumb);

async function loadWordBank() {
  if (!wordBank) return;

  try {
    const response = await fetch("/assets/words.json");
    const data = await response.json();

    const words = Array.isArray(data[world]) ? data[world] : [];
    if (!words.length) {
      wordBank.innerHTML = "<span class='upload-status'>No words found.</span>";
      return;
    }

    renderRandomWords(words, 12);
  } catch (err) {
    console.error("Could not load words.json", err);
    wordBank.innerHTML = "<span class='upload-status'>Word bank failed to load.</span>";
  }
}

function renderRandomWords(words, count = 12) {
  if (!wordBank) return;

  wordBank.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const word = words[Math.floor(Math.random() * words.length)];

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "word-chip";
    chip.textContent = word;

    chip.addEventListener("click", () => {
      addWordMagnet(
        word,
        220 + Math.random() * 220,
        160 + Math.random() * 180,
      );
    });

    wordBank.appendChild(chip);
  }
}

if (refreshWordsBtn) {
  refreshWordsBtn.addEventListener("click", async () => {
    await loadWordBank();
  });
}

// upload button
if (uploadBtn && assetUpload) {
  uploadBtn.addEventListener("click", () => {
    assetUpload.click();
  });
}

// handle upload
if (assetUpload) {
  assetUpload.addEventListener("change", async () => {
    const file = assetUpload.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      if (uploadStatus) uploadStatus.textContent = "Please choose an image.";
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    if (uploadStatus) uploadStatus.textContent = "Uploading...";

    try {
      const response = await fetch(`/api/assets/${world}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (assetScroll && data.url) {
        const img = document.createElement("img");
        img.src = data.url;
        img.className = "thumb";
        img.dataset.src = data.url;
        img.alt = "uploaded asset";
        wireThumb(img);
        assetScroll.prepend(img);
      }

      if (uploadStatus) uploadStatus.textContent = "Added to archive.";
      assetUpload.value = "";
    } catch (err) {
      console.error(err);
      if (uploadStatus) uploadStatus.textContent = "Upload failed.";
    }
  });
}

// drop on canvas
const dropSurface = canvas.upperCanvasEl;

dropSurface.addEventListener("dragover", function (e) {
  e.preventDefault();
});

dropSurface.addEventListener("drop", function (e) {
  e.preventDefault();

  const src = e.dataTransfer.getData("img");
  if (!src) return;

  const rect = canvas.upperCanvasEl.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  addImage(src, x, y);
});

// delete key support
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete" || e.key === "Backspace") {
    const active = canvas.getActiveObject();

    if (active) {
      canvas.remove(active);
      canvas.requestRenderAll();
    }
  }
});

// mouse position ui
canvas.on("mouse:move", function (opt) {
  const pointer = canvas.getPointer(opt.e);

  const mouseX = document.getElementById("mouseX");
  const mouseY = document.getElementById("mouseY");

  if (mouseX) mouseX.textContent = Math.round(pointer.x);
  if (mouseY) mouseY.textContent = Math.round(pointer.y);
});

// init
window.addEventListener("load", async () => {
  resizeCanvas();
  await loadWordBank();
});
window.addEventListener("resize", resizeCanvas);
