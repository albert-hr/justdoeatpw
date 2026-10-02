// Tela de login: envia sem recarregar e volta para onde a pessoa estava (?next=).
(function () {
    'use strict';
    const { toast } = window.JDE;

    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        const next = new URLSearchParams(window.location.search).get('next') || '';
        loginForm.elements.next.value = next;
        if (next.startsWith('/checkout')) {
            document.querySelector('[data-login-intro]').textContent = 'Falta pouco: entre para finalizar seu pedido.';
        }
        // "Criar conta" mantém o destino.
        if (next) {
            document.querySelectorAll('[data-keep-next]').forEach((link) => {
                link.href = `${link.getAttribute('href')}?next=${encodeURIComponent(next)}`;
            });
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!loginForm.elements.email.value || !loginForm.elements.senha.value) {
                toast('Preencha e-mail e senha para entrar.', 'error');
                (loginForm.elements.email.value ? loginForm.elements.senha : loginForm.elements.email).focus();
                return;
            }

            const button = loginForm.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = 'Entrando...';

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: new URLSearchParams(new FormData(loginForm))
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Não foi possível entrar.');
                window.location.href = result.redirectTo || '/';
            } catch (error) {
                toast(error.message === 'Failed to fetch' ? 'Falha de conexão ao tentar entrar.' : error.message, 'error');
                button.disabled = false;
                button.textContent = 'Entrar';
            }
        });

        // Contas de demonstração: um clique preenche e entra.
        loginForm.querySelectorAll('[data-demo-email]').forEach((button) => {
            button.addEventListener('click', () => {
                loginForm.elements.email.value = button.dataset.demoEmail;
                loginForm.elements.senha.value = button.dataset.demoSenha;
                loginForm.requestSubmit();
            });
        });
    });
})();
