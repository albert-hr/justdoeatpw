// Carrinho de compras: lista os itens, permite mudar a quantidade e mostra o resumo.
document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-cart-page]');
    if (!page) return;
    const { cart, confirm, formatCurrency, getMe, toast } = window.JDE;
    const percent = Number(page.dataset.parcelaPercent || 0);

    const list = page.querySelector('[data-cart-items]');

    function itemRow(item) {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <img alt="" width="72" height="72">
            <div>
                <h3></h3>
                <span class="cart-item-unit"></span>
            </div>
            <div class="cart-item-side">
                <div class="qty" role="group">
                    <button type="button" data-minus>&minus;</button>
                    <output aria-live="polite"></output>
                    <button type="button" data-plus>+</button>
                </div>
                <span class="cart-item-total"></span>
            </div>`;
        li.querySelector('img').src = item.image;
        li.querySelector('h3').textContent = item.name;
        li.querySelector('.cart-item-unit').textContent = `${formatCurrency(item.price)} cada`;
        li.querySelector('.qty').setAttribute('aria-label', `Quantidade de ${item.name}`);
        li.querySelector('[data-minus]').setAttribute('aria-label', item.quantity === 1 ? `Remover ${item.name}` : `Tirar um ${item.name}`);
        li.querySelector('[data-plus]').setAttribute('aria-label', `Adicionar mais um ${item.name}`);
        li.querySelector('output').textContent = item.quantity;
        li.querySelector('.cart-item-total').textContent = formatCurrency(item.price * item.quantity);

        li.querySelector('[data-minus]').addEventListener('click', () => {
            cart.setQuantity(item.id, item.quantity - 1);
            if (item.quantity === 1) toast(`${item.name} saiu do carrinho.`, 'info');
        });
        li.querySelector('[data-plus]').addEventListener('click', () => cart.setQuantity(item.id, item.quantity + 1));
        return li;
    }

    function render() {
        const current = cart.get();
        const hasItems = current.items.length > 0;
        page.querySelector('[data-cart-empty]').hidden = hasItems;
        page.querySelector('[data-cart-filled]').hidden = !hasItems;
        if (!hasItems) return;

        // Guarda o foco para não "perder o lugar" ao re-renderizar.
        const focused = document.activeElement?.closest('.cart-item');
        const focusIndex = focused ? Array.from(list.children).indexOf(focused) : -1;
        const focusPlus = document.activeElement?.hasAttribute('data-plus');

        page.querySelector('[data-cart-restaurant]').textContent = current.restaurantName;
        page.querySelector('[data-cart-restaurant-link]').href = `/restaurantes/${current.restaurantSlug}`;
        list.replaceChildren(...current.items.map(itemRow));

        const subtotal = cart.subtotal();
        page.querySelector('[data-summary-subtotal]').textContent = formatCurrency(subtotal);
        page.querySelector('[data-summary-fee]').textContent = formatCurrency(current.deliveryFee);
        page.querySelector('[data-summary-total]').textContent = formatCurrency(subtotal + current.deliveryFee);
        page.querySelector('[data-summary-parcela]').textContent = formatCurrency((subtotal * percent) / 100);

        if (focusIndex >= 0 && list.children[focusIndex]) {
            list.children[focusIndex].querySelector(focusPlus ? '[data-plus]' : '[data-minus]').focus();
        }
    }

    page.querySelector('[data-clear-cart]').addEventListener('click', async () => {
        const ok = await confirm({
            title: 'Limpar o carrinho?',
            message: 'Todos os itens serão removidos.',
            confirmText: 'Limpar carrinho',
            cancelText: 'Manter itens'
        });
        if (ok) {
            cart.clear();
            toast('Carrinho limpo.', 'info');
        }
    });

    // Visitante: avisa que o login vem no próximo passo. Restaurante/admin: não podem finalizar.
    getMe().then((user) => {
        if (!user) page.querySelector('[data-cart-login-hint]').hidden = false;
        else if (user.role !== 'cliente') {
            page.querySelector('[data-finish-cart]').hidden = true;
            page.querySelector('[data-cart-role-note]').hidden = false;
        }
    });

    document.addEventListener('jde:cart', render);
    render();
});
