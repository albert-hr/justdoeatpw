// Página de cada restaurante: monta o cardápio, adiciona itens e mostra a barra "Ver carrinho".
(function () {
    'use strict';
    const { cart, escapeHtml, formatCurrency, getJson, getMe, toast } = window.JDE;

    const decimal = (value) => String(value).replace('.', ',');
    const sectionId = (name) => `secao-${name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}`;

    function renderHeader(restaurant) {
        const logo = document.querySelector('[data-menu-logo]');
        logo.textContent = restaurant.logo.texto;
        logo.classList.add(`logo-${restaurant.logo.tamanho}`);
        logo.style.setProperty('--logo-bg', restaurant.logo.bg);
        logo.style.setProperty('--logo-fg', restaurant.logo.fg);

        document.querySelector('[data-menu-name]').innerHTML = `${escapeHtml(restaurant.nome)} <small>${escapeHtml(restaurant.unidade)}</small>`;
        document.querySelector('[data-menu-facts]').innerHTML = `
            <li><span class="rating">&#9733; ${decimal(restaurant.avaliacao)}</span> (${restaurant.numAvaliacoes} avaliações)</li>
            <li>${escapeHtml(restaurant.tipo)}</li>
            <li>${escapeHtml(restaurant.tempo)}</li>
            <li>Entrega ${formatCurrency(restaurant.taxaEntrega)}</li>`;
    }

    function renderMenu(restaurant) {
        const tabs = document.querySelector('[data-menu-tabs]');
        if (restaurant.cardapio.length > 1) {
            tabs.hidden = false;
            tabs.innerHTML = restaurant.cardapio.map((secao) => `<a href="#${sectionId(secao.secao)}">${escapeHtml(secao.secao)}</a>`).join('');
        }

        document.querySelector('[data-menu-sections]').innerHTML = restaurant.cardapio.map((secao) => `
            <section class="menu-section" id="${sectionId(secao.secao)}">
                <h2>${escapeHtml(secao.secao)}</h2>
                <div class="product-list">
                    ${secao.itens.map((item) => `
                        <article class="product" data-product-id="${escapeHtml(item.id)}">
                            <div class="product-image"><img src="${escapeHtml(item.imagem)}" alt="" width="120" height="120" loading="lazy"></div>
                            <div class="product-body">
                                <h3>${escapeHtml(item.nome)}</h3>
                                <p>${escapeHtml(item.descricao)}</p>
                                <div class="product-foot">
                                    <span class="price">${formatCurrency(item.preco)}</span>
                                    <div data-product-action></div>
                                </div>
                            </div>
                        </article>`).join('')}
                </div>
            </section>`).join('');
    }

    function renderAction(product, item, restaurant) {
        const slot = product.querySelector('[data-product-action]');
        const current = cart.get();
        const quantity = current.restaurantSlug === restaurant.slug ? cart.quantityOf(item.id) : 0;

        if (!quantity) {
            slot.innerHTML = `<button type="button" class="btn btn-primary btn-sm">Adicionar <span class="sr-only">${escapeHtml(item.nome)}</span></button>`;
            slot.querySelector('button').addEventListener('click', async () => {
                const added = await cart.add(
                    { id: item.id, name: item.nome, price: item.preco, image: item.imagem },
                    { slug: restaurant.slug, name: restaurant.nome, deliveryFee: restaurant.taxaEntrega }
                );
                if (added) {
                    toast(`${item.nome} adicionado ao carrinho.`, 'success', { href: '/carrinho', label: 'Ver carrinho' });
                    product.querySelector('[data-qty-plus]')?.focus();
                }
            });
            return;
        }

        slot.innerHTML = `
            <div class="qty" role="group" aria-label="Quantidade de ${escapeHtml(item.nome)}">
                <button type="button" data-qty-minus aria-label="Tirar um">&minus;</button>
                <output aria-live="polite">${quantity}</output>
                <button type="button" data-qty-plus aria-label="Adicionar mais um">+</button>
            </div>`;
        slot.querySelector('[data-qty-minus]').addEventListener('click', () => {
            cart.setQuantity(item.id, quantity - 1);
            if (quantity > 1) product.querySelector('[data-qty-minus]')?.focus();
        });
        slot.querySelector('[data-qty-plus]').addEventListener('click', () => {
            cart.setQuantity(item.id, quantity + 1);
            product.querySelector('[data-qty-plus]')?.focus();
        });
    }

    function renderCartBar() {
        const bar = document.querySelector('[data-cart-bar]');
        const count = cart.count();
        bar.hidden = count === 0;
        if (!count) return;
        bar.querySelector('[data-cart-bar-count]').textContent = `${count} ${count === 1 ? 'item' : 'itens'} de ${cart.get().restaurantName}`;
        bar.querySelector('[data-cart-bar-total]').textContent = formatCurrency(cart.subtotal());
    }

    function highlightTabs() {
        const tabs = Array.from(document.querySelectorAll('[data-menu-tabs] a'));
        if (!tabs.length || !('IntersectionObserver' in window)) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                tabs.forEach((tab) => tab.classList.toggle('is-active', tab.getAttribute('href') === `#${entry.target.id}`));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('.menu-section').forEach((section) => observer.observe(section));
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const slug = document.body.dataset.restaurant;
        let restaurant;
        try {
            ({ restaurante: restaurant } = await getJson(`/api/restaurantes/${slug}`));
        } catch (error) {
            document.querySelector('[data-menu-name]').textContent = 'Não foi possível carregar o cardápio.';
            return;
        }

        renderHeader(restaurant);
        renderMenu(restaurant);
        highlightTabs();

        // Restaurante e admin só visualizam o cardápio.
        const user = await getMe();
        if (user && user.role !== 'cliente') {
            document.querySelector('[data-menu-role-note]').hidden = false;
            document.querySelector('[data-cart-bar]').remove();
            return;
        }

        const items = new Map(restaurant.cardapio.flatMap((secao) => secao.itens).map((item) => [item.id, item]));
        const renderAll = () => {
            document.querySelectorAll('[data-product-id]').forEach((product) => renderAction(product, items.get(product.dataset.productId), restaurant));
            renderCartBar();
        };
        document.addEventListener('jde:cart', renderAll);
        renderAll();
    });
})();
