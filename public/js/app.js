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

const JDE_CART_KEY = 'justdoeat.cart';
const JDE_ORDERS_KEY = 'justdoeat.orders';

const JDE_RESTAURANTS = [
    {
        slug: 'mcdonalds',
        page: 'mcdonalds.html',
        name: "Mc. Donald's",
        category: 'comidas',
        logoClass: 'bg-mc',
        logo: 'M',
        details: 'Lanches &bull; 1,5 km',
        eta: '15-24 min &bull; R$ 6,99',
        rating: '4.9',
        description: 'Hamburgueres iconicos, batatas crocantes e o sabor classico que todo mundo ama.'
    },
    {
        slug: 'burgerking',
        page: 'burgerking.html',
        name: 'Burger King',
        category: 'comidas',
        logoClass: 'bg-bk',
        logo: 'BURGER<br>KING',
        details: 'Lanches &bull; 2,1 km',
        eta: '16-25 min &bull; R$ 5,99',
        rating: '4.8',
        description: 'Sabor grelhado no fogo de verdade, com combos generosos para matar a fome.'
    },
    {
        slug: 'starbucks',
        page: 'starbucks.html',
        name: 'Starbucks',
        category: 'bebidas',
        logoClass: 'bg-sb',
        logo: 'STARBUCKS',
        details: 'Cafes &bull; 3,6 km',
        eta: '27-37 min &bull; R$ 8,99',
        rating: '4.7',
        description: 'Cafes especiais, bebidas quentes, geladas e doces para acompanhar.'
    },
    {
        slug: 'outback',
        page: 'outback.html',
        name: 'Outback',
        category: 'comidas',
        logoClass: 'bg-outback',
        logo: 'OUTBACK',
        details: 'Pratos &bull; 3,7 km',
        eta: '20-30 min &bull; R$ 12,00',
        rating: '4.7',
        description: 'Carnes suculentas, porcoes marcantes e pratos inspirados no sabor australiano.'
    },
    {
        slug: 'habibs',
        page: 'habibs.html',
        name: "Habib's",
        category: 'comidas',
        logoClass: 'bg-habibs',
        logo: "HABIB'S",
        details: 'Arabe &bull; 8,6 km',
        eta: '10-14 min &bull; R$ 3,99',
        rating: '4.3',
        description: 'Esfihas, beirutes, kibes e opcoes para dividir com toda a familia.'
    }
];

function parseCurrency(value) {
    return Number(String(value || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function readCart() {
    try {
        return JSON.parse(localStorage.getItem(JDE_CART_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function writeCart(items) {
    localStorage.setItem(JDE_CART_KEY, JSON.stringify(items));
    updateCartBadges();
}

function addCartItem(item) {
    const cart = readCart();
    const existing = cart.find((cartItem) => cartItem.id === item.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    writeCart(cart);
    showToast(`${item.name} adicionado ao carrinho.`, 'success');
}

function clearCart() {
    writeCart([]);
}

function readOrders() {
    try {
        return JSON.parse(localStorage.getItem(JDE_ORDERS_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function writeOrders(orders) {
    localStorage.setItem(JDE_ORDERS_KEY, JSON.stringify(orders));
}

function updateCartBadges() {
    const total = readCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
        badge.textContent = String(total);
        badge.hidden = total === 0;
    });
}

function applyGlobalLinks() {
    document.querySelectorAll('a').forEach((link) => {
        const text = link.textContent.trim().toLowerCase();
        if (text === 'comidas') link.href = 'listasderestaurantes.html?categoria=comidas';
        if (text === 'bebidas') link.href = 'listasderestaurantes.html?categoria=bebidas';
        if (text.includes('carreiras')) link.href = 'carreiras.html';
        if (text.includes('parceiras')) link.href = 'parceiros.html';
        if (text.includes('entregador')) link.href = 'entregador.html';
    });
}

function bindHeaderSearch() {
    document.querySelectorAll('.search-form').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const query = new FormData(form).get('q') || '';
            window.location.href = `listasderestaurantes.html?q=${encodeURIComponent(query)}`;
        });
    });
}

function getProfilePageByRole(role) {
    const normalizedRole = String(role || '').toLowerCase();
    if (normalizedRole === 'admin' || normalizedRole === 'administrador') return 'admin.html';
    if (normalizedRole === 'restaurante') return 'dashboardv2.html';
    return 'meu-perfil.html';
}

function renderAuthenticatedHeader(user) {
    const headerActions = document.querySelectorAll('.header-actions');
    const profileHref = getProfilePageByRole(user?.perfil);
    const normalizedRole = String(user?.perfil || '').toLowerCase();
    const cartLink = normalizedRole === 'cliente'
        ? '<a href="carrinhodecompras.html" class="btn btn-secondary">Carrinho</a>'
        : '';

    headerActions.forEach((actions) => {
        actions.innerHTML = `
            <a href="${profileHref}" class="btn btn-primary">Perfil</a>
            ${cartLink}
            <form action="/api/logout" method="post">
                <button type="submit" class="btn btn-secondary">Sair</button>
            </form>
        `;
    });
}

async function hydrateAuthHeader() {
    try {
        const response = await fetch('/api/me', { headers: { Accept: 'application/json' } });
        if (!response.ok) return;
        const result = await response.json();
        if (result.user) renderAuthenticatedHeader(result.user);
    } catch (error) {
        return;
    }
}

function showAccessMessages() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('erro') === 'acesso-negado') {
        showToast('Seu perfil nao tem permissao para acessar essa area.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyGlobalLinks();
    bindHeaderSearch();
    updateCartBadges();
    hydrateAuthHeader();
    showAccessMessages();
});

window.JustDoEat = {
    restaurants: JDE_RESTAURANTS,
    addCartItem,
    clearCart,
    formatCurrency,
    parseCurrency,
    readCart,
    readOrders,
    writeCart,
    writeOrders
};
