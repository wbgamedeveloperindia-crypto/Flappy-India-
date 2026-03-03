// --- game_audio.js ---

// 1. Audio Objects load karein
const bgMusic = new Audio('Bg.mp3');
const tapSound = new Audio('Tap.mp3');
const crashSound = new Audio('popup.mp3');
const winSound = new Audio('win.mp3');

// 2. Initial Settings
bgMusic.loop = true;
bgMusic.volume = 0.4; // Background music thoda halka rakhein

// 3. Audio Control Functions
const GameAudio = {
    playBG: function() {
        if (!isMuted) bgMusic.play().catch(e => console.log("Music blocked"));
    },
    pauseBG: function() {
        bgMusic.pause();
    },
    playTap: function() {
        if (!isMuted) {
            tapSound.currentTime = 0;
            tapSound.play();
        }
    },
    playCrash: function() {
        this.pauseBG(); // Harne par music band
        if (!isMuted) crashSound.play();
    },
    playWin: function() {
        this.pauseBG(); // Jeetne par music band
        if (!isMuted) winSound.play();
    },
    stopAll: function() {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
};

// 4. Mute Toggle Control (Global isMuted variable ka use karega)
function syncMuteState() {
    if (typeof isMuted !== 'undefined' && isMuted) {
        bgMusic.pause();
    } else if (typeof isGamePaused !== 'undefined' && !isGamePaused) {
        bgMusic.play();
    }
}
