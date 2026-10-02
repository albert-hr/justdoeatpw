// Configuração do restaurante: preenche com os dados atuais e salva neste navegador.
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('config-restaurante-form');
    if (!form) return;
    const { formatCurrency, getJson, getMe, toast } = window.JDE;

    const user = await getMe();
    const key = `justdoeat-config.${user?.restauranteSlug || 'restaurante'}`;

    // Valores iniciais: cadastro + página publicada (se existir).
    const values = { nome: user?.nome || '', telefone: user?.telefone || '' };
    try {
        const { restaurante } = await getJson(`/api/restaurantes/${user.restauranteSlug}`);
        Object.assign(values, {
            nome: restaurante.nome,
            categoria: restaurante.tipo,
            tempo: restaurante.tempo,
            taxa: formatCurrency(restaurante.taxaEntrega),
            descricao: restaurante.descricao
        });
    } catch (error) { /* restaurante ainda não publicado */ }

    try {
        Object.assign(values, JSON.parse(localStorage.getItem(key) || '{}'));
    } catch (error) { /* sem configurações salvas */ }

    Object.entries(values).forEach(([name, value]) => {
        if (form.elements[name] && value) form.elements[name].value = value;
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        localStorage.setItem(key, JSON.stringify(Object.fromEntries(new FormData(form))));
        toast('Configurações salvas.', 'success');
    });
});
