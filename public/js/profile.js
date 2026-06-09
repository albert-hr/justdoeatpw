document.addEventListener('DOMContentLoaded', async () => {
    const nameElement = document.querySelector('[data-profile-name]');
    const ordersList = document.querySelector('[data-profile-orders]');
    const empty = document.querySelector('[data-profile-empty]');

    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const { user } = await response.json();
            if (nameElement && user?.nome) nameElement.textContent = user.nome;
        }
    } catch (error) {
        if (nameElement) nameElement.textContent = 'Cliente Just Do Eat';
    }

    const orders = window.JustDoEat.readOrders();
    if (!ordersList) return;
    ordersList.innerHTML = '';

    if (!orders.length) {
        if (empty) empty.hidden = false;
        return;
    }

    if (empty) empty.hidden = true;
    orders.forEach((order) => {
        const card = document.createElement('article');
        card.className = 'widget';
        card.innerHTML = `
            <h3>${order.id}</h3>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Data:</strong> ${order.createdAt}</p>
            <p><strong>Total:</strong> ${window.JustDoEat.formatCurrency(order.total)}</p>
            <ul class="top-items-list">${order.items.map((item) => `<li>${item.quantity}x ${item.name}</li>`).join('')}</ul>
        `;
        ordersList.appendChild(card);
    });
});
