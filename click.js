// --- click.js ---
const clickSound = new Audio('click.mp3');

function playClick() {
    if (typeof isMuted !== 'undefined' && isMuted) return;
    clickSound.currentTime = 0;
    clickSound.play().catch(e => console.log("Audio play blocked by browser"));
}

document.addEventListener('click', function(event) {
    const target = event.target;

    // Condition: Check karein ki click hone wali cheez button hai ya koi specific ID/Class
    if (
        target.tagName === 'BUTTON' || 
        target.classList.contains('play-btn') || 
        target.classList.contains('menu-icon') ||
        target.classList.contains('retry-btn') ||
        target.classList.contains('toggle-link') || // "Don't have an account?" link
        target.classList.contains('back-btn') ||    // Back to game/main menu
        target.classList.contains('switch') ||      // Mute toggle
        target.id === 'mainBtn' ||                  // Login/Register Button
        target.closest('.enter-btn-wrapper')        // Index page ka Enter button
    ) {
        playClick();
    }
});
