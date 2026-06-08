function ensureToastRegion() {
    let region = document.querySelector('.toast-region');
    if (region) return region;

    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
    return region;
}

function showToast(message, type = 'info') {
    const region = ensureToastRegion();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.textContent = message;
    region.appendChild(toast);

    window.setTimeout(() => toast.remove(), 4200);
}

function playLogoutFeedback() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 520;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.08);
}

document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.action.endsWith('/api/logout')) {
        showToast('Saindo da sua conta...', 'info');
        playLogoutFeedback();
    }
});

window.JustDoEatUI = {
    showToast,
    playLogoutFeedback
};
