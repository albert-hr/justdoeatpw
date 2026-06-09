document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-order-status]').forEach((button) => {
        button.addEventListener('click', () => {
            const row = button.closest('[data-order-row]');
            const status = button.dataset.orderStatus;
            const statusElement = row?.querySelector('[data-status-text]');
            if (statusElement) statusElement.textContent = status;
            window.JustDoEatUI.showToast(`Status atualizado para ${status}.`, 'success');
        });
    });

    document.querySelectorAll('[data-admin-action]').forEach((button) => {
        button.addEventListener('click', () => {
            window.JustDoEatUI.showToast(button.dataset.adminAction, 'success');
        });
    });
});
