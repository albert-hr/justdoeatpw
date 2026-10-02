/* Just Do Eat — script carregado em todas as telas.
   Cuida de: avisos (toast), diálogo de confirmação, menu no celular, carrinho
   e funções usadas pelos outros scripts (window.JDE). */
(function () {
    'use strict';

    // ---------- Avisos ----------
    function toastRegion() {
        let region = document.querySelector('.toast-region');
        if (!region) {
            region = document.createElement('div');
            region.className = 'toast-region';
            region.setAttribute('aria-live', 'polite');
            document.body.appendChild(region);
        }
        return region;
    }

    function showToast(message, type = 'info', action) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        const text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(text);
        if (action) {
            const link = document.createElement('a');
            link.href = action.href;
            link.textContent = action.label;
            toast.appendChild(link);
        }
        toastRegion().appendChild(toast);
        window.setTimeout(() => toast.remove(), action ? 6000 : 4200);
    }

    // ---------- Confirmação (substitui o confirm() do navegador) ----------
    function confirmDialog({ title = 'Confirmar', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
        const dialog = document.querySelector('[data-confirm-dialog]');
        if (!dialog || typeof dialog.showModal !== 'function') return Promise.resolve(window.confirm(message || title));

        dialog.querySelector('[data-confirm-title]').textContent = title;
        dialog.querySelector('[data-confirm-message]').textContent = message;
        dialog.querySelector('[data-confirm-ok]').textContent = confirmText;
        dialog.querySelector('[data-confirm-cancel]').textContent = cancelText;
        dialog.returnValue = '';

        return new Promise((resolve) => {
            dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
            dialog.showModal();
            dialog.querySelector('[data-confirm-ok]').focus();
        });
    }

    // ---------- Dinheiro ----------
    function formatCurrency(value) {
        return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // ---------- Carrinho (fica no navegador até o pedido ser enviado) ----------
    const CART_KEY = 'jde.cart.v2';
    localStorage.removeItem('justdoeat.cart'); // formato antigo

    function emptyCart() {
        return { restaurantSlug: null, restaurantName: '', deliveryFee: 0, items: [] };
    }

    function readCart() {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY));
            return cart && Array.isArray(cart.items) ? cart : emptyCart();
        } catch (error) {
            return emptyCart();
        }
    }

    function writeCart(cart) {
        if (!cart.items.length) cart = emptyCart();
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadges(true);
        document.dispatchEvent(new CustomEvent('jde:cart', { detail: cart }));
    }

    const cart = {
        get: readCart,
        count() {
            return readCart().items.reduce((sum, item) => sum + item.quantity, 0);
        },
        subtotal() {
            return readCart().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        },
        quantityOf(id) {
            return readCart().items.find((item) => item.id === id)?.quantity || 0;
        },
        // Um pedido é sempre de um restaurante só (igual aos apps de delivery).
        async add(item, restaurant) {
            let current = readCart();
            if (current.items.length && current.restaurantSlug !== restaurant.slug) {
                const replace = await confirmDialog({
                    title: 'Começar um carrinho novo?',
                    message: `Seu carrinho tem itens de ${current.restaurantName}. Cada pedido é de um restaurante só. Quer esvaziar o carrinho e adicionar este item de ${restaurant.name}?`,
                    confirmText: 'Esvaziar e adicionar',
                    cancelText: 'Manter carrinho'
                });
                if (!replace) return false;
                current = emptyCart();
            }
            current.restaurantSlug = restaurant.slug;
            current.restaurantName = restaurant.name;
            current.deliveryFee = restaurant.deliveryFee;

            const existing = current.items.find((cartItem) => cartItem.id === item.id);
            if (existing) existing.quantity += 1;
            else current.items.push({ ...item, quantity: 1 });
            writeCart(current);
            return true;
        },
        setQuantity(id, quantity) {
            const current = readCart();
            current.items = current.items
                .map((item) => (item.id === id ? { ...item, quantity } : item))
                .filter((item) => item.quantity > 0);
            writeCart(current);
        },
        clear() {
            writeCart(emptyCart());
        }
    };

    function updateCartBadges(animate) {
        const total = cart.count();
        document.querySelectorAll('[data-cart-count]').forEach((badge) => {
            badge.textContent = String(total);
            badge.hidden = total === 0;
            if (animate && total) {
                badge.classList.remove('bump');
                void badge.offsetWidth;
                badge.classList.add('bump');
            }
        });
    }

    // ---------- Requisições JSON ----------
    async function postJson(url, data, method = 'POST') {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(data)
        });
        let result = {};
        try { result = await response.json(); } catch (error) { result = {}; }
        if (!response.ok) {
            const error = new Error(result.error || 'Não foi possível concluir. Tente de novo.');
            error.status = response.status;
            throw error;
        }
        return result;
    }

    async function getJson(url) {
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        let result = {};
        try { result = await response.json(); } catch (error) { result = {}; }
        if (!response.ok) {
            const error = new Error(result.error || 'Não foi possível carregar os dados.');
            error.status = response.status;
            throw error;
        }
        return result;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDateTime(value) {
        return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // Classe CSS do status ("Saiu para entrega" -> "status-saiu-para-entrega")
    function statusClass(status) {
        return `status status-${String(status).toLowerCase().normalize('NFD').replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '-')}`;
    }

    // Usuário logado (uma chamada só por página).
    let mePromise = null;
    function getMe() {
        if (!mePromise) mePromise = getJson('/api/me').then((result) => result.user).catch(() => null);
        return mePromise;
    }

    // Marca as etapas do pedido (carrinho > endereço > pagamento > confirmação).
    function markCheckoutSteps() {
        const holder = document.querySelector('[data-checkout-step]');
        const steps = document.querySelectorAll('[data-checkout-steps] li');
        if (!holder || !steps.length) return;
        const current = Number(holder.dataset.checkoutStep);
        steps.forEach((li, index) => {
            const n = index + 1;
            const state = n < current ? 'done' : n === current ? 'current' : 'todo';
            li.className = `step-${state}`;
            if (state === 'current') li.setAttribute('aria-current', 'step');
            // Só dá para voltar a etapas anteriores, e nunca depois do pedido enviado.
            const link = li.querySelector('a');
            if (link && (state !== 'done' || current === 4)) link.replaceWith(...link.childNodes);
        });
    }

    // ---------- Inicialização ----------
    function bindNavToggle() {
        const toggle = document.querySelector('[data-nav-toggle]');
        const menu = document.getElementById('header-menu');
        if (!toggle || !menu) return;
        toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') !== 'true';
            toggle.setAttribute('aria-expanded', String(open));
            menu.classList.toggle('is-open', open);
        });
    }

    function showServerFlash() {
        const { flashType, flashMessage } = document.body.dataset;
        if (flashMessage) showToast(flashMessage, flashType || 'info');
    }

    document.addEventListener('DOMContentLoaded', () => {
        bindNavToggle();
        markCheckoutSteps();
        updateCartBadges(false);
        // Nome do restaurante no topo do painel
        if (document.querySelector('[data-user-name]')) {
            getMe().then((user) => {
                if (user) document.querySelectorAll('[data-user-name]').forEach((el) => { el.textContent = user.nome; });
            });
        }
        showServerFlash();
    });

    // Atualiza o contador quando o carrinho muda em outra aba.
    window.addEventListener('storage', (event) => {
        if (event.key === CART_KEY) {
            updateCartBadges(false);
            document.dispatchEvent(new CustomEvent('jde:cart', { detail: readCart() }));
        }
    });

    window.JDE = { cart, confirm: confirmDialog, escapeHtml, formatCurrency, formatDateTime, getJson, getMe, postJson, statusClass, toast: showToast };
})();
