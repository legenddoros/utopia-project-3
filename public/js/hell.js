const canvas = new fabric.Canvas("mainCanvas", {
  preserveObjectStacking: true,
  selection: true,
});

// Resize Canvas To Fit Layout
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

// Add Image Function
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
        cornerColor: "#8b1d1d",
        borderColor: "#8b1d1d",
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

// Click To Add
document.querySelectorAll(".thumb").forEach((thumb) => {
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
});

// Drop On Canvas
const dropSurface = canvas.upperCanvasEl;

dropSurface.addEventListener("dragover", function (e) {
  e.preventDefault();
});

dropSurface.addEventListener("drop", function (e) {
  e.preventDefault();

  const src = e.dataTransfer.getData("img");
  const rect = canvas.upperCanvasEl.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  addImage(src, x, y);
});

// Delete Key Support
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete" || e.key === "Backspace") {
    const active = canvas.getActiveObject();

    if (active) {
      canvas.remove(active);
      canvas.requestRenderAll();
    }
  }
});

// Mouse Position UI
canvas.on("mouse:move", function (opt) {
  const pointer = canvas.getPointer(opt.e);

  const mouseX = document.getElementById("mouseX");
  const mouseY = document.getElementById("mouseY");

  if (mouseX) mouseX.textContent = Math.round(pointer.x);
  if (mouseY) mouseY.textContent = Math.round(pointer.y);
});

// Initialize
window.addEventListener("load", () => {
  resizeCanvas();
});

window.addEventListener("resize", resizeCanvas);
