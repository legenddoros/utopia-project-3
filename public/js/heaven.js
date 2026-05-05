const canvas = new fabric.Canvas("mainCanvas", {
  preserveObjectStacking: true,
});

canvas.setWidth(900);
canvas.setHeight(600);

// -----------------------------
// ADD IMAGE FUNCTION
// -----------------------------
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
      });

      // scale down large images
      if (img.width > 300) {
        img.scaleToWidth(180);
      }

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    },
    {
      crossOrigin: "anonymous",
    },
  );
}

// -----------------------------
// CLICK TO ADD
// -----------------------------
document.querySelectorAll(".thumb").forEach((thumb) => {
  thumb.addEventListener("click", () => {
    addImage(thumb.dataset.src, 200, 200);
  });

  // enable drag
  thumb.setAttribute("draggable", true);

  thumb.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("img", thumb.dataset.src);
  });
});

// -----------------------------
// DROP ON CANVAS
// -----------------------------
const dropSurface = canvas.upperCanvasEl;

dropSurface.addEventListener("dragover", function (e) {
  e.preventDefault();
});

dropSurface.addEventListener("drop", function (e) {
  e.preventDefault();

  const src = e.dataTransfer.getData("img");

  const rect = dropSurface.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  addImage(src, x, y);
});
