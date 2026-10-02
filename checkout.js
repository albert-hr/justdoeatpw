// Checkout: endereço, pagamento e confirmação do pedido.
(function () {
    'use strict';
    const ADDRESS_KEY = 'jde.checkout.address';
    const { cart, escapeHtml, formatCurrency, getJson, getMe, postJson, statusClass, toast } = window.JDE;

    function readAddress() {
        try { return JSON.parse(sessionStorage.getItem(ADDRESS_KEY)) || null; } catch (error) { return null; }
    }

    // Sem itens não há o que pagar: volta para o carrinho.
    function requireCart() {
        if (cart.count()) return true;
        window.location.replace('/carrinho');
        return false;
    }

    function formatCep(value) {
        const numbers = value.replace(/\D/g, '').slice(0, 8);
        return numbers.length > 5 ? `${numbers.slice(0, 5)}-${numbers.slice(5)}` : numbers;
    }

    function setError(input, message) {
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        const error = document.getElementById(`${input.id}-error`);
        if (error) error.textContent = message || '';
    }

    async function setupAddress(form) {
        if (!requireCart()) return;
        form.querySelector('[data-checkout-restaurant]').textContent = cart.get().restaurantName;

        // Preenche com o que já foi digitado nesta visita, ou com o endereço do cadastro.
        const user = await getMe();
        const saved = readAddress() || { cep: user?.cep, endereco: user?.endereco, numero: user?.numero };
        Object.entries(saved).forEach(([name, value]) => {
            if (form.elements[name] && value) form.elements[name].value = value;
        });

        const cep = form.elements.cep;
        cep.addEventListener('input', () => { cep.value = formatCep(cep.value); });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const checks = [
                [cep, /^\d{5}-\d{3}$/.test(cep.value) ? '' : 'Use o formato 12345-678.'],
                [form.elements.endereco, form.elements.endereco.value.trim() ? '' : 'Informe a rua ou avenida.'],
                [form.elements.numero, form.elements.numero.value.trim() ? '' : 'Informe o número (ou "s/n").']
            ];
            checks.forEach(([input, message]) => setError(input, message));
            const firstInvalid = checks.find(([, message]) => message);
            if (firstInvalid) {
                firstInvalid[0].focus();
                return;
            }
            sessionStorage.setItem(ADDRESS_KEY, JSON.stringify(Object.fromEntries(new FormData(form))));
            window.location.href = '/checkout/pagamento';
        });
    }

    function setupPayment(form) {
        if (!requireCart()) return;
        const address = readAddress();
        if (!address) {
            window.location.replace('/checkout/endereco');
            return;
        }

        const current = cart.get();
        const subtotal = cart.subtotal();
        const percent = Number(form.dataset.parcelaPercent || 0);

        form.querySelector('[data-checkout-restaurant]').textContent = current.restaurantName;
        const list = form.querySelector('[data-checkout-items]');
        current.items.forEach((item) => {
            const li = document.createElement('li');
            const name = document.createElement('span');
            name.textContent = `${item.quantity}x ${item.name}`;
            const price = document.createElement('span');
            price.textContent = formatCurrency(item.price * item.quantity);
            li.append(name, price);
            list.appendChild(li);
        });
        form.querySelector('[data-checkout-subtotal]').textContent = formatCurrency(subtotal);
        form.querySelector('[data-checkout-fee]').textContent = formatCurrency(current.deliveryFee);
        form.querySelector('[data-checkout-total]').textContent = formatCurrency(subtotal + current.deliveryFee);
        form.querySelector('[data-checkout-parcela]').textContent = formatCurrency((subtotal * percent) / 100);

        const addressText = [`${address.endereco}, ${address.numero}`, address.complemento, `CEP ${address.cep}`, address.referencia && `Ref.: ${address.referencia}`]
            .filter(Boolean).join('\n');
        const addressBox = form.querySelector('[data-checkout-address-text]');
        addressBox.textContent = addressText;
        addressBox.style.whiteSpace = 'pre-line';

        const button = form.querySelector('[data-place-order]');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            button.disabled = true;
            button.textContent = 'Enviando pedido...';
            try {
                const result = await postJson('/api/pedidos', {
                    itens: current.items.map((item) => ({ id: item.id, quantity: item.quantity })),
                    endereco: address,
                    pagamento: new FormData(form).get('pagamento')
                });
                cart.clear();
                window.location.href = result.redirectTo;
            } catch (error) {
                if (error.status === 401) {
                    window.location.href = `/login?next=${encodeURIComponent('/checkout/pagamento')}`;
                    return;
                }
                toast(error.message, 'error');
                button.disabled = false;
                button.textContent = 'Finalizar pedido';
            }
        });
    }

    // Confirmação: busca o pedido recém-criado (?pedido=id) no servidor.
    async function setupSuccess(box) {
        const id = new URLSearchParams(window.location.search).get('pedido');
        if (!id) {
            window.location.replace('/minha-conta');
            return;
        }
        try {
            const { pedido } = await getJson(`/api/pedidos/${encodeURIComponent(id)}`);
            box.querySelectorAll('[data-order-restaurant]').forEach((el) => { el.textContent = pedido.restauranteNome; });
            box.querySelector('[data-order-id]').textContent = pedido.codigo;
            const status = box.querySelector('[data-order-status]');
            status.textContent = pedido.status;
            status.className = statusClass(pedido.status);
            box.querySelector('[data-order-items]').innerHTML = pedido.itens
                .map((item) => `<li><span>${item.quantidade}x ${escapeHtml(item.nome)}</span><span>${formatCurrency(item.preco * item.quantidade)}</span></li>`).join('');
            box.querySelector('[data-order-payment]').textContent = pedido.pagamento;
            box.querySelector('[data-order-address]').textContent = `${pedido.endereco.endereco}, ${pedido.endereco.numero}`;
            box.querySelector('[data-order-total]').textContent = formatCurrency(pedido.total);
            box.querySelector('[data-order-parcela]').textContent = formatCurrency(pedido.parcelaAmiga);
        } catch (error) {
            toast('Não encontramos esse pedido. Veja todos os seus pedidos na sua conta.', 'error');
            window.setTimeout(() => window.location.replace('/minha-conta'), 1500);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const addressForm = document.querySelector('[data-checkout-address]');
        const paymentForm = document.querySelector('[data-checkout-payment]');
        const successBox = document.querySelector('[data-checkout-success]');
        if (addressForm) setupAddress(addressForm);
        if (paymentForm) setupPayment(paymentForm);
        if (successBox) setupSuccess(successBox);
    });
})();
