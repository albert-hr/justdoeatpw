document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('config-restaurante-form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        window.JustDoEatUI.showToast('Configuracoes salvas.', 'success');
    });
});
