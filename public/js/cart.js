function renderCart() {
    const list = document.querySelector('[data-cart-items]');
    const totalElement = document.querySelector('[data-cart-total]');
    const emptyElement = document.querySelector('[data-cart-empty]');
    const finishButtons = document.querySelectorAll('[data-finish-cart]');
    if (!list || !totalElement) return;

    const cart = window.JustDoEat.readCart();
    list.innerHTML = '';

    if (!cart.length) {
        if (emptyElement) emptyElement.hidden = false;
        finishButtons.forEach((button) => button.classList.add('disabled'));
        totalElement.textContent = window.JustDoEat.formatCurrency(0);
        return;
    }

    if (emptyElement) emptyElement.hidden = true;
    finishButtons.forEach((button) => button.classList.remove('disabled'));

    cart.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="item-price-box">
                <div>
                    <div class="label">${item.name}</div>
                    <small>${item.restaurant} &bull; Quantidade: ${item.quantity}</small>
                </div>
                <div class="value">${window.JustDoEat.formatCurrency(item.price * item.quantity)}</div>
            </div>
        `;
        list.appendChild(row);
    });

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalElement.textContent = window.JustDoEat.formatCurrency(total);
}

document.addEventListener('DOMContentLoaded', () => {
    renderCart();

    document.querySelector('[data-clear-cart]')?.addEventListener('click', () => {
        window.JustDoEat.clearCart();
        renderCart();
        window.JustDoEatUI.showToast('Carrinho limpo.', 'success');
    });

    document.querySelectorAll('[data-finish-cart]').forEach((button) => {
        button.addEventListener('click', (event) => {
            if (!window.JustDoEat.readCart().length) {
                event.preventDefault();
                window.JustDoEatUI.showToast('Adicione itens antes de finalizar.', 'error');
            }
        });
    });
});
