const fs = require("fs");
const path = require("path");
const { ROOT_DIR } = require("../models/database");
const { getCurrentUser } = require("../models/sessionModel");
const { redirect, send } = require("../utils/http");

const VIEWS_DIR = path.join(ROOT_DIR, "views");
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
  ".ico": "image/x-icon"
};

const viewFiles = new Set([
  "/index.html",
  "/login.html",
  "/registro.html",
  "/dashboard.html",
  "/dashboardv2.html",
  "/admin.html",
  "/admin-clientes.html",
  "/admin-pedidos.html",
  "/admin-restaurantes.html",
  "/burgerking.html",
  "/contato.html",
  "/checkout-endereco.html",
  "/checkout-pagamento.html",
  "/checkout-sucesso.html",
  "/config-restaurante.html",
  "/listar.html",
  "/listasderestaurantes.html",
  "/carrinhodecompras.html",
  "/habibs.html",
  "/mcdonalds.html",
  "/meu-perfil.html",
  "/outback.html",
  "/parceiros.html",
  "/carreiras.html",
  "/entregador.html",
  "/pedidos-restaurante.html",
  "/relatorios-restaurante.html",
  "/starbucks.html",
  "/quemsomos.html"
]);

const roleHomePages = {
  cliente: "/meu-perfil.html",
  restaurante: "/dashboardv2.html",
  admin: "/admin.html",
  administrador: "/admin.html"
};

const protectedPages = {
  "/admin.html": ["admin", "administrador"],
  "/admin-clientes.html": ["admin", "administrador"],
  "/admin-pedidos.html": ["admin", "administrador"],
  "/admin-restaurantes.html": ["admin", "administrador"],
  "/carrinhodecompras.html": ["cliente"],
  "/checkout-endereco.html": ["cliente"],
  "/checkout-pagamento.html": ["cliente"],
  "/checkout-sucesso.html": ["cliente"],
  "/config-restaurante.html": ["restaurante"],
  "/dashboardv2.html": ["restaurante"],
  "/listar.html": ["restaurante"],
  "/meu-perfil.html": ["cliente"],
  "/pedidos-restaurante.html": ["restaurante"],
  "/relatorios-restaurante.html": ["restaurante"]
};

function normalizeRole(user) {
  return String(user?.perfil || "").toLowerCase();
}

function getHomeByRole(role) {
  return roleHomePages[role] || "/dashboard.html";
}

function serveFile(res, filePath, baseDir) {
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(baseDir)) {
    send(res, 403, "Acesso negado.", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  fs.readFile(normalizedPath, (error, content) => {
    if (error) {
      console.error(`Arquivo nao encontrado no servidor: ${normalizedPath}`);
      send(res, 404, "Arquivo nao encontrado.", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    send(res, 200, content, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
  });
}

function servePage(req, res, pathname) {
  let page = pathname === "/" ? "/index.html" : pathname;

  if (!viewFiles.has(page)) {
    send(res, 404, "Arquivo nao encontrado.", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const allowedRoles = protectedPages[page];
  const currentUser = getCurrentUser(req);

  if ((page === "/dashboard.html" || allowedRoles) && !currentUser) {
    redirect(res, "/login.html?erro=login-obrigatorio");
    return;
  }

  if (allowedRoles) {
    const role = normalizeRole(currentUser);
    if (!allowedRoles.includes(role)) {
      redirect(res, `${getHomeByRole(role)}?erro=acesso-negado`);
      return;
    }
  }

  if (page === "/dashboard.html" && currentUser) {
    redirect(res, getHomeByRole(normalizeRole(currentUser)));
    return;
  }

  serveFile(res, path.join(VIEWS_DIR, page), VIEWS_DIR);
}

function serveAsset(res, pathname) {
  if (pathname === "/favicon.png" || pathname === "/favicon.ico") {
    serveFile(res, path.join(PUBLIC_DIR, "images", "icons", "logo_justdoeat.png"), PUBLIC_DIR);
    return;
  }

  if (pathname.startsWith("/public/")) {
    serveFile(res, path.join(ROOT_DIR, pathname), PUBLIC_DIR);
    return;
  }

  const isPublicAsset = pathname.startsWith("/css/") || pathname.startsWith("/js/") || pathname.startsWith("/images/");

  if (!isPublicAsset) {
    send(res, 404, "Arquivo nao encontrado.", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  serveFile(res, path.join(PUBLIC_DIR, pathname), PUBLIC_DIR);
}

module.exports = {
  serveAsset,
  servePage
};
