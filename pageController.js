const fs = require("fs");
const path = require("path");
const { ROOT_DIR } = require("../models/database");
const { getCurrentUser } = require("../models/sessionModel");
const { listFictitiousUsers } = require("../models/fictitiousUserModel");
const { findRestaurant } = require("../models/restauranteModel");
const { PARCELA_AMIGA_PERCENT } = require("../models/pedidoModel");
const { redirect, send, setFlash, takeFlash } = require("../utils/http");
const { getAllowedRoles, getDashboardByPerfil } = require("../utils/redirects");

const VIEWS_DIR = path.join(ROOT_DIR, "views");
const PARTIALS_DIR = path.join(VIEWS_DIR, "partials");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

// Rota  ->  arquivo em views/
const pages = {
  "/": "index.html",
  "/restaurantes": "listasderestaurantes.html",
  "/carrinho": "carrinhodecompras.html",
  "/checkout/endereco": "checkout-endereco.html",
  "/checkout/pagamento": "checkout-pagamento.html",
  "/checkout/sucesso": "checkout-sucesso.html",
  "/login": "login.html",
  "/cadastro": "registro.html",
  "/minha-conta": "meu-perfil.html",
  "/painel": "dashboardv2.html",
  "/painel/pedidos": "pedidos-restaurante.html",
  "/painel/cardapio": "listar.html",
  "/painel/relatorios": "relatorios-restaurante.html",
  "/painel/configuracoes": "config-restaurante.html",
  "/admin": "admin.html",
  "/admin/pedidos": "admin-pedidos.html",
  "/admin/clientes": "admin-clientes.html",
  "/admin/restaurantes": "admin-restaurantes.html",
  "/quem-somos": "quemsomos.html",
  "/contato": "contato.html",
  "/carreiras": "carreiras.html",
  "/parceiros": "parceiros.html",
  "/entregador": "entregador.html",
  "/dashboard": "dashboard.html"
};

const AREA_LABELS = { cliente: "Minha conta", restaurante: "Painel", admin: "Admin" };
const ROLE_NAMES = { cliente: "clientes", restaurante: "restaurantes", admin: "administradores" };

const partialCache = new Map();

function readPartial(name) {
  if (!partialCache.has(name) || process.env.NODE_ENV !== "production") {
    partialCache.set(name, fs.readFileSync(path.join(PARTIALS_DIR, `${name}.html`), "utf8"));
  }
  return partialCache.get(name);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function authActions(user, pathname) {
  if (user) {
    return `<a href="${getDashboardByPerfil(user.perfil)}" class="btn btn-primary btn-sm">${AREA_LABELS[user.role] || "Minha conta"}</a>
                    <form action="/api/logout" method="post" class="inline-form"><button type="submit" class="btn btn-secondary btn-sm">Sair</button></form>`;
  }
  const next = ["/", "/login", "/cadastro"].includes(pathname) ? "" : `?next=${encodeURIComponent(pathname)}`;
  return `<a href="/login${next}" class="btn btn-secondary btn-sm">Entrar</a>
                    <a href="/cadastro" class="btn btn-primary btn-sm">Cadastre-se</a>`;
}

function cartLink(user, pathname) {
  if (user && user.role !== "cliente") return "";
  return `<a href="/carrinho" class="cart-link${pathname === "/carrinho" ? " is-current" : ""}" aria-label="Carrinho">
                    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-1 2h13M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span class="cart-count" data-cart-count hidden>0</span>
                </a>`;
}

function demoAccounts() {
  const users = listFictitiousUsers();
  if (!users.length) return "";
  const items = users.map((user) => `<li><button type="button" data-demo-email="${user.email}" data-demo-senha="${user.password}">${user.perfil}: ${escapeHtml(user.nome)}<small>${user.email} / ${user.password}</small></button></li>`).join("");
  return `<details class="demo-accounts"><summary>Contas de demonstração</summary><ul>${items}</ul></details>`;
}

// Link do menu que fica marcado como "página atual".
function activeNavHref(pathname, searchParams) {
  if (pathname === "/restaurantes" && ["comidas", "bebidas"].includes(searchParams.get("categoria"))) {
    return `/restaurantes?categoria=${searchParams.get("categoria")}`;
  }
  if (pathname.startsWith("/restaurantes/")) return "/restaurantes";
  return pathname;
}

// Monta a view: inclui os pedaços repetidos (cabeçalho, rodapé, menus) e marca o menu ativo.
function renderView(html, { user, pathname, searchParams, flash }) {
  // {{> nome}} é trocado pelo conteúdo de views/partials/nome.html (um partial pode incluir outro)
  let output = html;
  for (let depth = 0; depth < 3 && output.includes("{{> "); depth += 1) {
    output = output.replace(/\{\{> ([\w-]+)\}\}/g, (match, name) => readPartial(name));
  }

  output = output
    .replace(/\{\{authActions\}\}/g, authActions(user, pathname))
    .replace(/\{\{cartLink\}\}/g, cartLink(user, pathname))
    .replace(/\{\{demoAccounts\}\}/g, demoAccounts())
    .replace(/\{\{parcelaPercent\}\}/g, String(PARCELA_AMIGA_PERCENT));

  [activeNavHref(pathname, searchParams), pathname].forEach((href) => {
    output = output.split(`data-nav href="${href}"`).join(`data-nav aria-current="page" href="${href}"`);
  });

  if (flash) {
    output = output.replace("<body", `<body data-flash-type="${escapeHtml(flash.type)}" data-flash-message="${escapeHtml(flash.message)}"`);
  }

  return output;
}

function serveFile(res, filePath, baseDir) {
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(baseDir)) {
    send(res, 403, "Acesso negado.", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  fs.readFile(normalizedPath, (error, content) => {
    if (error) {
      send(res, 404, "Arquivo nao encontrado.", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    send(res, 200, content, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
  });
}

function serveView(req, res, view, context, statusCode = 200) {
  fs.readFile(path.join(VIEWS_DIR, view), "utf8", (error, html) => {
    if (error) {
      send(res, 500, "Erro ao carregar a página.", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    send(res, statusCode, renderView(html, context), { "Content-Type": mimeTypes[".html"] });
  });
}

async function servePage(req, res, pathname, searchParams) {
  const user = await getCurrentUser(req);
  const context = { user, pathname, searchParams, flash: takeFlash(req, res) };

  // /dashboard leva cada perfil para a sua área (visitante vê a escolha de área)
  if (pathname === "/dashboard" && user) {
    redirect(res, getDashboardByPerfil(user.perfil));
    return;
  }

  // Quem já entrou não precisa ver login/cadastro de novo
  if (user && (pathname === "/login" || pathname === "/cadastro")) {
    redirect(res, getDashboardByPerfil(user.perfil));
    return;
  }

  let view = pages[pathname];
  const restaurantMatch = pathname.match(/^\/restaurantes\/([\w-]+)$/);
  if (restaurantMatch) view = findRestaurant(restaurantMatch[1])?.view;

  if (!view) {
    serveView(req, res, "404.html", context, 404);
    return;
  }

  const allowedRoles = getAllowedRoles(pathname);
  if (allowedRoles && !user) {
    const target = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    setFlash(res, "info", "Entre com sua conta para continuar.");
    redirect(res, `/login?next=${encodeURIComponent(target)}`);
    return;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const message = `Essa área é só para ${allowedRoles.map((role) => ROLE_NAMES[role]).join(" e ")}.`;
    setFlash(res, "error", message);
    redirect(res, getDashboardByPerfil(user.perfil));
    return;
  }

  serveView(req, res, view, context);
}

function serveAsset(res, pathname) {
  if (pathname === "/favicon.png" || pathname === "/favicon.ico") {
    serveFile(res, path.join(PUBLIC_DIR, "images", "icons", "logo-justdoeat-recortado.png"), PUBLIC_DIR);
    return;
  }

  if (pathname.startsWith("/public/")) {
    serveFile(res, path.join(ROOT_DIR, pathname), PUBLIC_DIR);
    return;
  }

  serveFile(res, path.join(PUBLIC_DIR, pathname), PUBLIC_DIR);
}

module.exports = {
  serveAsset,
  servePage
};
