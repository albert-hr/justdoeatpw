// Meu perfil: pedidos do cliente com o andamento de cada um.
(function () {
    'use strict';
    const { escapeHtml, formatCurrency, formatDateTime, getJson, getMe, statusClass } = window.JDE;

    const FLOW = ['Recebido', 'Preparando', 'Saiu para entrega', 'Entregue'];
    const FINISHED = ['Entregue', 'Cancelado'];

    function orderCard(pedido, withTracker) {
        const step = FLOW.indexOf(pedido.status);
        const items = pedido.itens.map((item) => `${item.quantidade}x ${item.nome}`).join(', ');
        const tracker = withTracker ? `
            <ol class="tracker" aria-label="Andamento do pedido">
                ${FLOW.map((status, index) => `<li class="${index <= step ? 'is-done' : ''}"${index === step ? ' aria-current="step"' : ''}>${status}</li>`).join('')}
            </ol>` : `<a href="/restaurantes/${escapeHtml(pedido.restauranteSlug)}" class="btn btn-secondary btn-sm">Pedir de novo</a>`;

        return `
            <article class="order-card">
                <div class="order-card-head">
                    <h3>${escapeHtml(pedido.restauranteNome)}</h3>
                    <span class="${statusClass(pedido.status)}">${escapeHtml(pedido.status)}</span>
                </div>
                <p class="order-meta">Pedido ${escapeHtml(pedido.codigo)}, feito em ${formatDateTime(pedido.criadoEm)}</p>
                <p class="order-items">${escapeHtml(items)}</p>
                <p class="order-total">Total ${formatCurrency(pedido.total)} <small>(${escapeHtml(pedido.pagamento)})</small></p>
                ${tracker}
            </article>`;
    }

    document.addEventListener('DOMContentLoaded', async () => {
        if (!document.querySelector('[data-profile-page]')) return;

        const user = await getMe();
        if (user) {
            document.querySelector('[data-profile-name]').textContent = user.nome.split(' ')[0];
            const lines = [`<strong>${escapeHtml(user.nome)}</strong>`, escapeHtml(user.email)];
            if (user.telefone) lines.push(escapeHtml(user.telefone));
            if (user.endereco) lines.push(`${escapeHtml(user.endereco)}, ${escapeHtml(user.numero || 's/n')}${user.cidade ? `, ${escapeHtml(user.cidade)}` : ''}`);
            document.querySelector('[data-profile-data]').innerHTML = lines.join('<br>');
        }

        let pedidos = [];
        try {
            ({ pedidos } = await getJson('/api/pedidos'));
        } catch (error) {
            document.querySelector('[data-profile-orders]').innerHTML = '<p class="muted">Não foi possível carregar seus pedidos agora.</p>';
            return;
        }

        const ativos = pedidos.filter((pedido) => !FINISHED.includes(pedido.status));
        const anteriores = pedidos.filter((pedido) => FINISHED.includes(pedido.status));

        document.querySelector('[data-profile-empty]').hidden = ativos.length > 0;
        document.querySelector('[data-profile-orders]').innerHTML = ativos.map((pedido) => orderCard(pedido, true)).join('');
        document.querySelector('[data-profile-history-block]').hidden = anteriores.length === 0;
        document.querySelector('[data-profile-history]').innerHTML = anteriores.map((pedido) => orderCard(pedido, false)).join('');
    });
})();
