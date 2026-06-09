const cadastroForm = document.getElementById('cadastro-form');
const perfilSelect = document.getElementById('perfil');

function toggleRestauranteFields() {
    const restauranteFields = document.getElementById('restaurante-fields');
    const restauranteRequiredFields = restauranteFields.querySelectorAll('#cpf_cnpj, #cep');
    const isRestaurante = perfilSelect.value === 'Restaurante';

    restauranteFields.classList.toggle('hidden', !isRestaurante);
    restauranteRequiredFields.forEach((field) => {
        field.required = isRestaurante;
        validateField(field);
    });
}

function onlyNumbers(value, maxLength) {
    return value.replace(/\D/g, '').slice(0, maxLength);
}

function formatTelefone(value) {
    const numbers = onlyNumbers(value, 11);
    if (numbers.length <= 2) return numbers ? `(${numbers}` : '';
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function formatCpfCnpj(value) {
    const numbers = onlyNumbers(value, 14);
    if (numbers.length <= 11) {
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
        if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    }
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
}

function formatCep(value) {
    const numbers = onlyNumbers(value, 8);
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}

function setFieldError(input, message) {
    const describedBy = input.getAttribute('aria-describedby') || '';
    const errorId = describedBy.split(' ').find((id) => id.endsWith('error'));
    const errorElement = errorId ? document.getElementById(errorId) : null;

    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorElement) errorElement.textContent = message || '';
}

function getCustomError(input) {
    if (!input.required && !input.value) return '';
    if (input.validity.valueMissing) return 'Este campo é obrigatório.';
    if (input.validity.typeMismatch || input.validity.patternMismatch) return input.title || 'Formato inválido.';
    if (input.id === 'senha' && input.value.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (input.id === 'confirma_senha' && input.value !== document.getElementById('senha').value) return 'As senhas não coincidem.';
    return '';
}

function validateField(input) {
    if (input.closest('.hidden')) {
        setFieldError(input, '');
        return true;
    }

    const message = getCustomError(input);
    setFieldError(input, message);
    return !message;
}

function applyMask(inputId, formatter) {
    const input = document.getElementById(inputId);
    input.addEventListener('input', () => {
        input.value = formatter(input.value);
        validateField(input);
    });
}

cadastroForm.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('input', () => validateField(field));
    field.addEventListener('blur', () => validateField(field));
});

cadastroForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fields = Array.from(cadastroForm.querySelectorAll('input, select'));
    const isValid = fields.every(validateField);

    if (!isValid) {
        window.JustDoEatUI.showToast('Revise os campos destacados antes de registrar.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new URLSearchParams(new FormData(cadastroForm))
        });
        const result = await response.json();

        if (!response.ok) {
            window.JustDoEatUI.showToast(result.error || 'Não foi possível registrar.', 'error');
            return;
        }

        window.JustDoEatUI.showToast('Cadastro realizado com sucesso.', 'success');
        window.setTimeout(() => {
            window.location.href = result.redirectTo || '/dashboard.html';
        }, 700);
    } catch (error) {
        window.JustDoEatUI.showToast('Falha de conexão ao tentar registrar.', 'error');
    }
});

perfilSelect.addEventListener('change', toggleRestauranteFields);

toggleRestauranteFields();
applyMask('telefone', formatTelefone);
applyMask('cpf_cnpj', formatCpfCnpj);
applyMask('cep', formatCep);
