const CHECKOUT_ADDRESS_KEY = 'justdoeat.checkout.address';
const CHECKOUT_PAYMENT_KEY = 'justdoeat.checkout.payment';

function redirectIfCartEmpty() {
    if (!window.JustDoEat.readCart().length) {
        window.JustDoEatUI.showToast('Seu carrinho esta vazio.', 'error');
        window.setTimeout(() => {
            window.location.href = 'carrinhodecompras.html';
        }, 700);
        return true;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const addressForm = document.querySelector('[data-checkout-address]');
    const paymentForm = document.querySelector('[data-checkout-payment]');
    const successBox = document.querySelector('[data-checkout-success]');

    if (addressForm) {
        redirectIfCartEmpty();
        addressForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!addressForm.reportValidity()) return;
            localStorage.setItem(CHECKOUT_ADDRESS_KEY, JSON.stringify(Object.fromEntries(new FormData(addressForm))));
            window.location.href = 'checkout-pagamento.html';
        });
    }

    if (paymentForm) {
        redirectIfCartEmpty();
        paymentForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const payment = new FormData(paymentForm).get('pagamento');
            localStorage.setItem(CHECKOUT_PAYMENT_KEY, JSON.stringify({ payment }));

            const cart = window.JustDoEat.readCart();
            const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const orders = window.JustDoEat.readOrders();
            orders.unshift({
                id: `JDE-${Date.now()}`,
                createdAt: new Date().toLocaleString('pt-BR'),
                status: 'Pedido confirmado',
                total,
                items: cart
            });
            window.JustDoEat.writeOrders(orders);
            window.JustDoEat.clearCart();
            window.location.href = 'checkout-sucesso.html';
        });
    }

    if (successBox) {
        const order = window.JustDoEat.readOrders()[0];
        if (order) {
            successBox.querySelector('[data-order-id]').textContent = order.id;
            successBox.querySelector('[data-order-total]').textContent = window.JustDoEat.formatCurrency(order.total);
        }
    }
});
