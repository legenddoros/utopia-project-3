console.log("heaven.js loaded");

const heavenAudio = document.getElementById("heavenAudio");
const audioToggle = document.getElementById("audioToggle");

console.log("heavenAudio:", heavenAudio);
console.log("audioToggle:", audioToggle);

let audioEnabled = false;

if (audioToggle && heavenAudio) {
    audioToggle.addEventListener("click", async () => {
        console.log("Audio button clicked");

        if (!audioEnabled) {
            try {
                heavenAudio.volume = 0.4;
                await heavenAudio.play();

                audioEnabled = true;
                audioToggle.textContent = "Disable Sound";

                console.log("Audio is playing");
            } catch (error) {
                console.log("Audio play error:", error);
            }
        } else {
            heavenAudio.pause();

            audioEnabled = false;
            audioToggle.textContent = "Enable Sound";

            console.log("Audio paused");
        }
    });
}