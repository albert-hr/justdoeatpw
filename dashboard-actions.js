// Painel do restaurante e área do administrador: carrega os números e pedidos da API
// e permite mudar o status dos pedidos sem recarregar a página.
(function () {
    'use strict';
    const { confirm, escapeHtml, formatCurrency, formatDateTime, getJson, getMe, postJson, statusClass, toast } = window.JDE;

    // Próximo passo de cada status (o mesmo fluxo que o cliente acompanha no perfil dele).
    const NEXT = {
        Recebido: { status: 'Preparando', label: 'Começar preparo' },
        Preparando: { status: 'Saiu para entrega', label: 'Saiu para entrega' },
        'Saiu para entrega': { status: 'Entregue', label: 'Marcar como entregue' }
    };
    const CAN_CANCEL = ['Recebido', 'Preparando'];
    const FINISHED = ['Entregue', 'Cancelado'];

    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const itemsText = (pedido) => pedido.itens.map((item) => `${item.quantidade}x ${item.nome}`).join(', ');

    function setStat(root, name, value) {
        root.querySelectorAll(`[data-stat="${name}"]`).forEach((el) => { el.textContent = value; });
    }

    function compactOrder(pedido, showRestaurant) {
        return `
            <li>
                <span><strong>${escapeHtml(pedido.codigo)}</strong> ${escapeHtml(pedido.clienteNome)}${showRestaurant ? ` em ${escapeHtml(pedido.restauranteNome)}` : ''}<br>
                <small class="muted">${showRestaurant ? `${formatDateTime(pedido.criadoEm)}, ${formatCurrency(pedido.total)}` : escapeHtml(itemsText(pedido))}</small></span>
                <span class="${statusClass(pedido.status)}">${escapeHtml(pedido.status)}</span>
            </li>`;
    }

    /* ---------- Restaurante: visão geral ---------- */
    async function renderOverview(root, user) {
        const [{ resumo }, { pedidos }] = await Promise.all([getJson('/api/pedidos/resumo'), getJson('/api/pedidos')]);
        setStat(root, 'ativos', resumo.ativos);
        setStat(root, 'vendasHoje', formatCurrency(resumo.vendasHoje));
        setStat(root, 'pedidosHoje', plural(resumo.pedidosHoje, 'pedido', 'pedidos'));
        setStat(root, 'parcelaAmiga', formatCurrency(resumo.parcelaAmiga));

        try {
            const { restaurante } = await getJson(`/api/restaurantes/${user.restauranteSlug}`);
            setStat(root, 'avaliacao', String(restaurante.avaliacao).replace('.', ','));
            setStat(root, 'numAvaliacoes', `${restaurante.numAvaliacoes} avaliações`);
            const link = document.querySelector('[data-my-page-link]');
            link.href = `/restaurantes/${restaurante.slug}`;
            link.hidden = false;
        } catch (error) {
            root.querySelector('[data-unpublished-notice]').hidden = false;
        }

        const ativos = pedidos.filter((pedido) => !FINISHED.includes(pedido.status)).slice(0, 4);
        root.querySelector('[data-recent-orders]').innerHTML = ativos.map((pedido) => compactOrder(pedido, false)).join('');
        root.querySelector('[data-recent-empty]').hidden = ativos.length > 0;

        root.querySelector('[data-top-items]').innerHTML = resumo.maisVendidos
            .map((item, index) => `<li><b>${index + 1}</b><span>${escapeHtml(item.nome)}</span><small>${plural(item.quantidade, 'vendido', 'vendidos')}</small></li>`).join('');
        root.querySelector('[data-top-empty]').hidden = resumo.maisVendidos.length > 0;
    }

    /* ---------- Restaurante: fila de pedidos ---------- */
    function orderCard(pedido) {
        const address = pedido.endereco || {};
        return `
            <article class="order-card" data-order-card data-order-id="${escapeHtml(pedido.id)}" data-status="${escapeHtml(pedido.status)}">
                <div class="order-card-head">
                    <h3>Pedido ${escapeHtml(pedido.codigo)}</h3>
                    <span class="${statusClass(pedido.status)}" data-status-pill>${escapeHtml(pedido.status)}</span>
                </div>
                <p class="order-meta">${escapeHtml(pedido.clienteNome)}, ${formatDateTime(pedido.criadoEm)}</p>
                <p class="order-items">${escapeHtml(itemsText(pedido))}</p>
                <p class="order-meta">Entregar em ${escapeHtml(address.endereco)}, ${escapeHtml(address.numero)}${address.complemento ? ` (${escapeHtml(address.complemento)})` : ''}. ${escapeHtml(pedido.pagamento)}.</p>
                <p class="order-total">${formatCurrency(pedido.total)}</p>
                <div class="order-actions" data-order-actions></div>
            </article>`;
    }

    async function changeStatus(card, status) {
        try {
            const { pedido } = await postJson(`/api/pedidos/${card.dataset.orderId}/status`, { status }, 'PATCH');
            card.dataset.status = pedido.status;
            const pill = card.querySelector('[data-status-pill]');
            pill.textContent = pedido.status;
            pill.className = statusClass(pedido.status);
            renderActions(card);
            toast(`Pedido ${pedido.codigo}: ${pedido.status.toLowerCase()}.`, 'success');
        } catch (error) {
            toast(error.message, 'error');
        }
    }

    function renderActions(card) {
        const slot = card.querySelector('[data-order-actions]');
        if (!slot) return;
        slot.innerHTML = '';
        const { status } = card.dataset;

        if (NEXT[status]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-primary btn-sm';
            button.textContent = NEXT[status].label;
            button.addEventListener('click', () => changeStatus(card, NEXT[status].status));
            slot.appendChild(button);
        }
        if (CAN_CANCEL.includes(status)) {
            const cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.className = 'btn btn-secondary btn-sm';
            cancel.textContent = 'Cancelar pedido';
            cancel.addEventListener('click', async () => {
                const ok = await confirm({
                    title: 'Cancelar este pedido?',
                    message: 'O cliente verá o pedido como cancelado. Isso não pode ser desfeito.',
                    confirmText: 'Cancelar pedido',
                    cancelText: 'Voltar'
                });
                if (ok) changeStatus(card, 'Cancelado');
            });
            slot.appendChild(cancel);
        }
        slot.hidden = !slot.children.length;
    }

    async function renderOrders(root) {
        const { pedidos } = await getJson('/api/pedidos');
        const ativos = pedidos.filter((pedido) => !FINISHED.includes(pedido.status));
        const finalizados = pedidos.filter((pedido) => FINISHED.includes(pedido.status)).slice(0, 15);

        root.querySelector('[data-active-orders]').innerHTML = ativos.map(orderCard).join('');
        root.querySelector('[data-orders-empty]').hidden = ativos.length > 0;
        root.querySelector('[data-finished-orders]').innerHTML = finalizados.map(orderCard).join('');
        root.querySelector('[data-finished-block]').hidden = finalizados.length === 0;
        root.querySelectorAll('[data-order-card]').forEach(renderActions);
    }

    /* ---------- Restaurante: relatórios ---------- */
    async function renderReports(root) {
        const { resumo, semana } = await getJson('/api/pedidos/resumo');
        const semanaTotal = semana.reduce((sum, dia) => sum + dia.total, 0);
        const semanaPedidos = semana.reduce((sum, dia) => sum + dia.pedidos, 0);

        setStat(root, 'faturamento', formatCurrency(resumo.faturamento));
        setStat(root, 'vendasHoje', formatCurrency(resumo.vendasHoje));
        setStat(root, 'pedidosHoje', plural(resumo.pedidosHoje, 'pedido', 'pedidos'));
        setStat(root, 'semanaTotal', formatCurrency(semanaTotal));
        setStat(root, 'semanaPedidos', plural(semanaPedidos, 'pedido', 'pedidos'));
        setStat(root, 'parcelaAmiga', formatCurrency(resumo.parcelaAmiga));

        root.querySelector('[data-week-empty]').hidden = semanaTotal > 0;
        const chart = root.querySelector('[data-week-chart]');
        chart.setAttribute('aria-label', `Vendas por dia: ${semana.map((dia) => `${dia.rotulo} ${formatCurrency(dia.total)}`).join(', ')}`);
        chart.innerHTML = semana.map((dia) => `
            <div class="bar">
                <span class="bar-value">${dia.total ? formatCurrency(dia.total) : ''}</span>
                <span class="bar-fill" style="height: ${dia.percentual}%"></span>
                <span class="bar-label">${escapeHtml(dia.rotulo)}</span>
            </div>`).join('');
    }

    /* ---------- Admin ---------- */
    async function renderAdminOverview(root) {
        const [{ resumo }, { pedidos }] = await Promise.all([getJson('/api/pedidos/resumo'), getJson('/api/pedidos')]);
        setStat(root, 'parcelaAmiga', formatCurrency(resumo.parcelaAmiga));
        setStat(root, 'totalPedidos', resumo.totalPedidos);
        setStat(root, 'ativosTexto', `${resumo.ativos} em andamento`);
        setStat(root, 'vendasHoje', formatCurrency(resumo.vendasHoje));
        setStat(root, 'pedidosHoje', plural(resumo.pedidosHoje, 'pedido', 'pedidos'));
        setStat(root, 'faturamento', formatCurrency(resumo.faturamento));

        const recentes = pedidos.slice(0, 5);
        root.querySelector('[data-recent-orders]').innerHTML = recentes.map((pedido) => compactOrder(pedido, true)).join('');
        root.querySelector('[data-recent-empty]').hidden = recentes.length > 0;
    }

    async function renderAdminOrders(root) {
        const { pedidos, statuses } = await getJson('/api/pedidos');
        root.querySelector('[data-orders-empty]').hidden = pedidos.length > 0;
        root.querySelector('[data-table-wrap]').hidden = pedidos.length === 0;
        root.querySelector('[data-orders-table]').innerHTML = pedidos.map((pedido) => `
            <tr>
                <td><strong>${escapeHtml(pedido.codigo)}</strong></td>
                <td>${escapeHtml(pedido.clienteNome)}</td>
                <td>${escapeHtml(pedido.restauranteNome)}</td>
                <td>${formatDateTime(pedido.criadoEm)}</td>
                <td class="num">${formatCurrency(pedido.total)}</td>
                <td>
                    <label class="sr-only" for="status-${escapeHtml(pedido.id)}">Status do pedido ${escapeHtml(pedido.codigo)}</label>
                    <select id="status-${escapeHtml(pedido.id)}" data-status-select data-order-id="${escapeHtml(pedido.id)}" data-current="${escapeHtml(pedido.status)}">
                        ${statuses.map((status) => `<option${status === pedido.status ? ' selected' : ''}>${status}</option>`).join('')}
                    </select>
                </td>
            </tr>`).join('');

        root.querySelectorAll('[data-status-select]').forEach((select) => {
            select.addEventListener('change', async () => {
                try {
                    const { pedido } = await postJson(`/api/pedidos/${select.dataset.orderId}/status`, { status: select.value }, 'PATCH');
                    select.dataset.current = pedido.status;
                    toast(`Pedido ${pedido.codigo}: ${pedido.status.toLowerCase()}.`, 'success');
                } catch (error) {
                    select.value = select.dataset.current;
                    toast(error.message, 'error');
                }
            });
        });
    }

    async function renderAdminCustomers(root) {
        const { clientes } = await getJson('/api/usuarios/clientes');
        root.querySelector('[data-customers-table]').innerHTML = clientes.length
            ? clientes.map((cliente) => `
                <tr>
                    <td><strong>${escapeHtml(cliente.nome)}</strong>${cliente.demo ? ' <small class="muted">(demonstração)</small>' : ''}</td>
                    <td>${escapeHtml(cliente.email)}</td>
                    <td>${escapeHtml(cliente.telefone || '-')}</td>
                    <td class="num">${cliente.pedidos}</td>
                    <td class="num">${formatCurrency(cliente.gasto)}</td>
                    <td><a href="mailto:${escapeHtml(cliente.email)}">Enviar e-mail</a></td>
                </tr>`).join('')
            : '<tr><td colspan="6" class="muted">Nenhum cliente cadastrado ainda.</td></tr>';
    }

    async function renderAdminRestaurants(root) {
        const { restaurantes } = await getJson('/api/usuarios/restaurantes');
        root.querySelector('[data-restaurants-table]').innerHTML = restaurantes.map((restaurante) => `
            <tr>
                <td><strong>${escapeHtml(restaurante.nome)}</strong></td>
                <td>${escapeHtml(restaurante.tipo || '-')}</td>
                <td>${escapeHtml(restaurante.email || '-')}</td>
                <td class="num">${restaurante.pedidos}</td>
                <td>${restaurante.publicado ? '<span class="status status-entregue">Publicado</span>' : '<span class="status status-preparando">Aguardando cardápio</span>'}</td>
                <td>${restaurante.publicado
                    ? `<a href="/restaurantes/${escapeHtml(restaurante.slug)}">Ver página</a>`
                    : (restaurante.email ? `<a href="mailto:${escapeHtml(restaurante.email)}">Contatar</a>` : '')}</td>
            </tr>`).join('');
    }

    const VIEWS = {
        '[data-panel-overview]': renderOverview,
        '[data-panel-orders]': renderOrders,
        '[data-panel-reports]': renderReports,
        '[data-admin-overview]': renderAdminOverview,
        '[data-admin-orders]': renderAdminOrders,
        '[data-admin-customers]': renderAdminCustomers,
        '[data-admin-restaurants]': renderAdminRestaurants
    };

    document.addEventListener('DOMContentLoaded', async () => {
        const user = await getMe();

        for (const [selector, render] of Object.entries(VIEWS)) {
            const root = document.querySelector(selector);
            if (!root) continue;
            try {
                await render(root, user);
            } catch (error) {
                toast('Não foi possível carregar os dados do painel. Recarregue a página.', 'error');
            }
        }
    });
})();
