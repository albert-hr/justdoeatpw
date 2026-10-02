// Cadastro / edição de produtos do cardápio: listar, buscar, adicionar, editar e remover.
(function () {
    'use strict';
    const { confirm, formatCurrency, getJson, getMe, toast } = window.JDE;

    // Começa com o cardápio publicado do restaurante (se ele já estiver no catálogo).
    async function initialProducts(slug) {
        try {
            const { restaurante } = await getJson(`/api/restaurantes/${slug}`);
            return restaurante.cardapio.flatMap((secao) => secao.itens.map((item) => ({
                id: item.id, name: item.nome, description: item.descricao, price: item.preco,
                category: secao.secao, image: item.imagem, active: true, additional: ''
            })));
        } catch (error) {
            return [];
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const root = document.querySelector('[data-menu-admin]');
        if (!root) return;

        const user = await getMe();
        const slug = user?.restauranteSlug || 'restaurante';
        const storageKey = `justdoeat-products.${slug}`;
        const initial = await initialProducts(slug);
        const dialog = document.querySelector('[data-product-dialog]');
        const form = dialog.querySelector('[data-product-form]');
        const list = root.querySelector('[data-product-list]');
        const search = root.querySelector('[data-product-search]');
        const state = { filter: 'todos', image: '' };

        const fallbackImage = '/images/icons/marmita_icon.png';
        const normalize = (value) => String(value || '').normalize('NFD').replace(/[^\w\s]/g, '').toLowerCase();

        function load() {
            try {
                const saved = JSON.parse(localStorage.getItem(storageKey));
                if (Array.isArray(saved)) return saved;
            } catch (error) { /* usa o cardápio inicial */ }
            return initial;
        }
        let products = load();

        function save() {
            localStorage.setItem(storageKey, JSON.stringify(products));
        }

        function parsePrice(text) {
            const digits = String(text).replace(/\D/g, '');
            return digits ? Number(digits) / 100 : 0;
        }

        function render() {
            const query = normalize(search.value.trim());
            const visible = products.filter((product) => {
                if (state.filter === 'ativos' && !product.active) return false;
                if (state.filter === 'inativos' && product.active) return false;
                return !query || normalize(`${product.name} ${product.description} ${product.category}`).includes(query);
            });

            list.replaceChildren(...visible.map((product) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `product-admin${product.active ? '' : ' is-inactive'}`;
                button.innerHTML = '<img alt="" width="64" height="64"><div><h3></h3><p></p></div><span class="price"></span>';
                button.querySelector('img').src = product.image || fallbackImage;
                button.querySelector('h3').textContent = product.name;
                button.querySelector('p').textContent = `${product.category}${product.active ? '' : ' (indisponível)'}. ${product.description}`;
                button.querySelector('.price').textContent = formatCurrency(product.price);
                button.setAttribute('aria-label', `Editar ${product.name}`);
                button.addEventListener('click', () => openDialog(product));
                return button;
            }));

            root.querySelector('[data-product-count]').textContent = `${visible.length} de ${products.length} produtos`;
            root.querySelector('[data-product-empty]').hidden = visible.length > 0;

            const categories = [...new Set(products.map((product) => product.category))];
            document.getElementById('product-categories').innerHTML = categories.map((category) => `<option value="${category.replace(/"/g, '&quot;')}">`).join('');
        }

        function openDialog(product) {
            form.reset();
            state.image = product?.image || '';
            dialog.querySelector('#product-dialog-title').textContent = product ? 'Editar produto' : 'Novo produto';
            form.elements.id.value = product?.id || '';
            form.elements.name.value = product?.name || '';
            form.elements.description.value = product?.description || '';
            form.elements.price.value = product ? formatCurrency(product.price) : '';
            form.elements.category.value = product?.category || '';
            form.elements.additional.value = product?.additional || '';
            form.elements.active.checked = product ? product.active : true;
            form.querySelector('[data-delete-product]').hidden = !product;
            dialog.showModal();
            form.elements.name.focus();
        }

        form.elements.price.addEventListener('input', () => {
            const value = parsePrice(form.elements.price.value);
            form.elements.price.value = value ? formatCurrency(value) : '';
        });

        document.getElementById('product-image').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                toast('Use uma imagem PNG, JPG ou WEBP.', 'error');
                event.target.value = '';
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                toast('A imagem deve ter no máximo 2 MB.', 'error');
                event.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = () => { state.image = reader.result; };
            reader.readAsDataURL(file);
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const missing = ['name', 'description', 'price', 'category'].find((name) => !form.elements[name].value.trim());
            if (missing) {
                toast('Preencha nome, descrição, preço e seção.', 'error');
                form.elements[missing].focus();
                return;
            }

            const product = {
                id: form.elements.id.value || `produto-${Date.now()}`,
                name: form.elements.name.value.trim(),
                description: form.elements.description.value.trim(),
                price: parsePrice(form.elements.price.value),
                category: form.elements.category.value.trim(),
                additional: form.elements.additional.value.trim(),
                image: state.image || fallbackImage,
                active: form.elements.active.checked
            };

            const index = products.findIndex((item) => item.id === product.id);
            if (index >= 0) products[index] = product;
            else products.unshift(product);

            try {
                save();
            } catch (error) {
                toast('Não deu para salvar: a imagem é grande demais para o navegador. Tente uma menor.', 'error');
                return;
            }
            dialog.close();
            render();
            toast(index >= 0 ? `${product.name} atualizado.` : `${product.name} adicionado ao cardápio.`, 'success');
        });

        form.querySelector('[data-cancel-product]').addEventListener('click', () => dialog.close());

        form.querySelector('[data-delete-product]').addEventListener('click', async () => {
            const id = form.elements.id.value;
            const product = products.find((item) => item.id === id);
            dialog.close();
            const ok = await confirm({
                title: `Remover ${product.name}?`,
                message: 'O produto sai do cardápio. Você pode cadastrá-lo de novo depois.',
                confirmText: 'Remover',
                cancelText: 'Manter'
            });
            if (!ok) return;
            products = products.filter((item) => item.id !== id);
            save();
            render();
            toast(`${product.name} removido.`, 'success');
        });

        document.querySelectorAll('[data-add-product]').forEach((button) => button.addEventListener('click', () => openDialog(null)));
        search.addEventListener('input', render);
        root.querySelectorAll('[data-filter]').forEach((chip) => {
            chip.addEventListener('click', () => {
                state.filter = chip.dataset.filter;
                root.querySelectorAll('[data-filter]').forEach((other) => other.setAttribute('aria-pressed', String(other === chip)));
                render();
            });
        });

        render();
    });
})();
