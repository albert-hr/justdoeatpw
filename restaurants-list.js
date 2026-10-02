// Lista de restaurantes (/restaurantes) e vitrine "Mais bem avaliados" da página inicial.
(function () {
    'use strict';
    const { escapeHtml, formatCurrency, getJson } = window.JDE;

    const DESCRIPTIONS = {
        '': ['Restaurantes', 'Os restaurantes mais pedidos da região, com entrega até a sua porta.'],
        comidas: ['Comidas', 'Lanches, pratos e marmitas perto de você.'],
        bebidas: ['Bebidas', 'Cafés, sucos e bebidas geladas perto de você.']
    };

    const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const decimal = (value) => String(value).replace('.', ',');

    function buildRestaurantCard(restaurant) {
        const link = document.createElement('a');
        link.href = `/restaurantes/${restaurant.slug}`;
        link.className = 'restaurant-card';
        link.dataset.search = normalize(`${restaurant.nome} ${restaurant.tipo} ${restaurant.descricao} ${restaurant.cardapio.flatMap((secao) => secao.itens.map((item) => item.nome)).join(' ')}`);
        link.innerHTML = `
            <span class="logo-box logo-${restaurant.logo.tamanho}" aria-hidden="true">${escapeHtml(restaurant.logo.texto)}</span>
            <span class="restaurant-card-body">
                <span class="restaurant-card-title">
                    <strong>${escapeHtml(restaurant.nome)}</strong>
                    <span class="rating" aria-label="Avaliação ${decimal(restaurant.avaliacao)} de 5">&#9733; ${decimal(restaurant.avaliacao)}</span>
                </span>
                <span class="restaurant-card-meta">${escapeHtml(restaurant.tipo)}, ${decimal(restaurant.distanciaKm)} km</span>
                <span class="restaurant-card-meta">${escapeHtml(restaurant.tempo)} &nbsp;|&nbsp; entrega ${formatCurrency(restaurant.taxaEntrega)}</span>
                <span class="restaurant-card-desc">${escapeHtml(restaurant.descricao)}</span>
            </span>`;
        const logo = link.querySelector('.logo-box');
        logo.style.setProperty('--logo-bg', restaurant.logo.bg);
        logo.style.setProperty('--logo-fg', restaurant.logo.fg);
        return link;
    }

    // Página inicial: vitrine "Mais bem avaliados"
    async function renderHome(list) {
        try {
            const { restaurantes } = await getJson(`/api/restaurantes?destaques=${list.dataset.destaques}`);
            list.replaceChildren(...restaurantes.map(buildRestaurantCard));
        } catch (error) {
            list.innerHTML = '<p class="muted">Não foi possível carregar os restaurantes agora.</p>';
        }
    }

    // Página /restaurantes: categoria vem da URL e a busca filtra enquanto a pessoa digita.
    async function renderList(list) {
        const params = new URLSearchParams(window.location.search);
        const categoria = DESCRIPTIONS[params.get('categoria')] ? params.get('categoria') : '';
        const search = document.querySelector('[data-restaurant-search]');
        const counter = document.querySelector('[data-results-count]');
        const empty = document.querySelector('[data-restaurants-empty]');

        const [title, description] = DESCRIPTIONS[categoria];
        document.querySelector('[data-list-title]').textContent = title;
        document.querySelector('[data-list-description]').textContent = description;
        if (categoria) document.title = `Just Do Eat - ${title}`;

        document.querySelectorAll('[data-category-chip]').forEach((chip) => {
            chip.setAttribute('aria-current', String(chip.dataset.categoryChip === categoria));
        });

        // Mantém a categoria quando a busca é enviada pelo Enter.
        if (categoria) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'categoria';
            hidden.value = categoria;
            search.form.appendChild(hidden);
        }
        search.value = params.get('q') || '';

        let cards = [];
        try {
            const { restaurantes } = await getJson(`/api/restaurantes${categoria ? `?categoria=${categoria}` : ''}`);
            cards = restaurantes.map(buildRestaurantCard);
            list.replaceChildren(...cards);
        } catch (error) {
            counter.textContent = 'Não foi possível carregar os restaurantes agora.';
            return;
        }

        function applyFilter() {
            const query = normalize(search.value);
            let visible = 0;
            cards.forEach((card) => {
                card.hidden = Boolean(query) && !card.dataset.search.includes(query);
                if (!card.hidden) visible += 1;
            });
            const typed = search.value.trim();
            counter.textContent = `${visible} ${visible === 1 ? 'restaurante encontrado' : 'restaurantes encontrados'}${typed ? ` para "${typed}"` : ''}`;
            empty.hidden = visible > 0;
            // Atualiza a busca nos links de categoria e na URL (o "voltar" do navegador continua funcionando).
            document.querySelectorAll('[data-category-chip]').forEach((chip) => {
                const url = new URL(chip.href);
                if (typed) url.searchParams.set('q', typed); else url.searchParams.delete('q');
                chip.href = url.pathname + url.search;
            });
            const url = new URL(window.location.href);
            if (typed) url.searchParams.set('q', typed); else url.searchParams.delete('q');
            window.history.replaceState(null, '', url);
        }

        search.addEventListener('input', applyFilter);
        search.form.addEventListener('submit', (event) => {
            event.preventDefault();
            applyFilter();
        });
        applyFilter();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const list = document.querySelector('[data-restaurant-list]');
        if (!list) return;
        if (list.dataset.destaques) renderHome(list);
        else renderList(list);
    });
})();
