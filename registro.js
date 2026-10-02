// Tela de cadastro: campos de restaurante, máscaras, validação e envio sem recarregar.
(function () {
    'use strict';
    const { toast } = window.JDE;

    const onlyNumbers = (value, maxLength) => value.replace(/\D/g, '').slice(0, maxLength);

    const masks = {
        telefone(value) {
            const numbers = onlyNumbers(value, 11);
            if (numbers.length <= 2) return numbers ? `(${numbers}` : '';
            if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        },
        cpf_cnpj(value) {
            const numbers = onlyNumbers(value, 14);
            if (numbers.length <= 11) {
                if (numbers.length <= 3) return numbers;
                if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
                if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
                return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
            }
            if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
            return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
        },
        cep(value) {
            const numbers = onlyNumbers(value, 8);
            return numbers.length > 5 ? `${numbers.slice(0, 5)}-${numbers.slice(5)}` : numbers;
        }
    };

    function setFieldError(form, name, message) {
        const input = form.elements[name];
        if (!input) return;
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        const error = document.getElementById(`${name}-error`);
        if (error) error.textContent = message || '';
    }

    function validate(form) {
        const isRestaurante = form.elements.perfil.value === 'Restaurante';
        const value = (name) => (form.elements[name]?.value || '').trim();
        const errors = {
            nome: value('nome') ? '' : (isRestaurante ? 'Informe o nome do restaurante.' : 'Informe seu nome.'),
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email')) ? '' : 'Informe um e-mail válido com @.',
            telefone: /^\(\d{2}\) \d{5}-\d{4}$/.test(value('telefone')) ? '' : 'Use o formato (99) 99999-9999.',
            senha: value('senha').length >= 6 ? '' : 'A senha deve ter pelo menos 6 caracteres.',
            confirma_senha: value('confirma_senha') && value('confirma_senha') === value('senha') ? '' : 'As senhas não coincidem.',
            cpf_cnpj: !isRestaurante || /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/.test(value('cpf_cnpj')) ? '' : 'Use CPF no formato 123.456.789-00 ou CNPJ no formato 12.345.678/0001-90.',
            cep: !isRestaurante || /^\d{5}-\d{3}$/.test(value('cep')) ? '' : 'Use o formato 12345-678.'
        };
        Object.entries(errors).forEach(([name, message]) => setFieldError(form, name, message));
        const firstInvalid = Object.keys(errors).find((name) => errors[name]);
        if (firstInvalid) form.elements[firstInvalid].focus();
        return !firstInvalid;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const cadastroForm = document.getElementById('cadastro-form');
        if (!cadastroForm) return;

        const params = new URLSearchParams(window.location.search);
        const next = params.get('next') || '';
        cadastroForm.elements.next.value = next;
        if (next) {
            document.querySelectorAll('[data-keep-next]').forEach((link) => {
                link.href = `${link.getAttribute('href')}?next=${encodeURIComponent(next)}`;
            });
        }
        if (params.get('perfil') === 'Restaurante') {
            cadastroForm.querySelector('input[name="perfil"][value="Restaurante"]').checked = true;
        }

        // Mostra os campos do restaurante só quando "Sou um Restaurante" está marcado.
        const restauranteFields = document.getElementById('restaurante-fields');
        const nameLabel = cadastroForm.querySelector('[data-name-label]');
        function toggleRestauranteFields() {
            const isRestaurante = cadastroForm.elements.perfil.value === 'Restaurante';
            restauranteFields.hidden = !isRestaurante;
            nameLabel.textContent = isRestaurante ? 'Nome do restaurante' : 'Nome completo';
        }
        cadastroForm.querySelectorAll('input[name="perfil"]').forEach((radio) => radio.addEventListener('change', toggleRestauranteFields));
        toggleRestauranteFields();

        Object.entries(masks).forEach(([name, mask]) => {
            const input = cadastroForm.elements[name];
            input?.addEventListener('input', () => { input.value = mask(input.value); });
        });

        // Limpa o erro do campo assim que a pessoa corrige.
        cadastroForm.addEventListener('input', (event) => {
            if (event.target.getAttribute('aria-invalid') === 'true') setFieldError(cadastroForm, event.target.name, '');
        });

        cadastroForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validate(cadastroForm)) {
                toast('Revise os campos destacados antes de registrar.', 'error');
                return;
            }

            const button = cadastroForm.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = 'Registrando...';

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: new URLSearchParams(new FormData(cadastroForm))
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Não foi possível registrar.');
                window.location.href = result.redirectTo || '/';
            } catch (error) {
                toast(error.message === 'Failed to fetch' ? 'Falha de conexão ao tentar registrar.' : error.message, 'error');
                button.disabled = false;
                button.textContent = 'Registrar';
            }
        });
    });
})();
