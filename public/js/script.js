const canvas = new fabric.Canvas("mainCanvas", {
  preserveObjectStacking: true,
  selection: true,
});

const world = document.body.dataset.world || "heaven";
const uploadBtn = document.getElementById("uploadBtn");
const assetUpload = document.getElementById("assetUpload");
const uploadStatus = document.getElementById("uploadStatus");
const assetScroll = document.querySelector(".asset-scroll");

// implementing draw features

const drawBtn = document.getElementById("drawBtn");

const brushColor = document.getElementById("brushColor");
const brushSize = document.getElementById("brushSize");

canvas.isDrawingMode = false;

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
window.addEventListener("load", resizeCanvas);
window.addEventListener("resize", resizeCanvas);
