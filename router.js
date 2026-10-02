const { login, logout, me, register } = require("../controllers/authController");
const { submitContact } = require("../controllers/contactController");
const { serveAsset, servePage } = require("../controllers/pageController");
const pedidoController = require("../controllers/pedidoController");
const restauranteController = require("../controllers/restauranteController");
const usuarioController = require("../controllers/usuarioController");
const { redirect, send, sendJson } = require("../utils/http");
const { LEGACY_PAGES } = require("../utils/redirects");

const ASSET_PREFIXES = ["/public/", "/css/", "/js/", "/images/", "/fonts/"];

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname).replace(/(.)\/+$/, "$1");
    const { method } = req;
    let match;

    /* ---------- API: autenticação ---------- */
    if (method === "POST" && pathname === "/api/register") return await register(req, res);
    if (method === "POST" && pathname === "/api/login") return await login(req, res);
    if (method === "POST" && pathname === "/api/logout") return await logout(req, res);
    if (method === "GET" && pathname === "/api/me") return await me(req, res);

    /* ---------- API: contato ---------- */
    if (method === "POST" && (pathname === "/api/contact" || pathname === "/api/contato")) return await submitContact(req, res);

    /* ---------- API: restaurantes ---------- */
    if (method === "GET" && pathname === "/api/restaurantes") return restauranteController.listar(req, res, url.searchParams);
    if (method === "GET" && (match = pathname.match(/^\/api\/restaurantes\/([\w-]+)$/))) return restauranteController.obter(req, res, match[1]);

    /* ---------- API: pedidos ---------- */
    if (method === "POST" && pathname === "/api/pedidos") return await pedidoController.criar(req, res);
    if (method === "GET" && pathname === "/api/pedidos") return await pedidoController.listar(req, res);
    if (method === "GET" && pathname === "/api/pedidos/resumo") return await pedidoController.resumo(req, res);
    if (method === "GET" && (match = pathname.match(/^\/api\/pedidos\/([\w-]+)$/))) return await pedidoController.obter(req, res, match[1]);
    if (method === "PATCH" && (match = pathname.match(/^\/api\/pedidos\/([\w-]+)\/status$/))) return await pedidoController.atualizarStatus(req, res, match[1]);

    /* ---------- API: usuários (admin) ---------- */
    if (method === "GET" && pathname === "/api/usuarios/clientes") return await usuarioController.listarClientes(req, res);
    if (method === "GET" && pathname === "/api/usuarios/restaurantes") return await usuarioController.listarRestaurantes(req, res);

    if (pathname.startsWith("/api/")) {
      sendJson(res, 404, { error: "Rota não encontrada." });
      return;
    }

    /* ---------- Arquivos estáticos (css, js, imagens, fontes) ---------- */
    if (method === "GET" && (ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || pathname.startsWith("/favicon"))) {
      serveAsset(res, pathname);
      return;
    }

    /* ---------- Endereços antigos (.html) ---------- */
    if (method === "GET" && LEGACY_PAGES[pathname]) {
      redirect(res, LEGACY_PAGES[pathname] + url.search, 301);
      return;
    }

    /* ---------- Telas ---------- */
    if (method === "GET") {
      await servePage(req, res, pathname, url.searchParams);
      return;
    }

    send(res, 405, "Metodo nao permitido.", { "Content-Type": "text/plain; charset=utf-8" });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) sendJson(res, 500, { error: "Algo deu errado no servidor. Tente de novo em instantes." });
  }
}

module.exports = {
  handleRequest
};
