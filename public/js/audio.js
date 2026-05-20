const pageAudio = document.getElementById("pageAudio");
const audioToggle = document.getElementById("audioToggle");

let audioEnabled = true;

// Try autoplay immediately
window.addEventListener("load", async () => {
  if (!pageAudio) return;

  try {
    pageAudio.volume = 0.35;

    await pageAudio.play();

    console.log("Heaven audio autoplaying");
  } catch (error) {
    console.log("Autoplay blocked:", error);

    audioEnabled = false;

    if (audioToggle) {
      audioToggle.textContent = "Enable Sound";
    }
  }
});

// Toggle button
if (audioToggle && pageAudio) {
  audioToggle.addEventListener("click", async () => {
    if (!audioEnabled) {
      try {
        await pageAudio.play();

        audioEnabled = true;

        audioToggle.textContent = "Disable Sound";
      } catch (error) {
        console.log("Play failed:", error);
      }
    } else {
      pageAudio.pause();

      audioEnabled = false;

      audioToggle.textContent = "Enable Sound";
    }
  });
}
