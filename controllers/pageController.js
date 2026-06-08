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
  "/contato.html",
  "/listar.html",
  "/listasderestaurantes.html",
  "/carrinhodecompras.html",
  "/mcdonalds.html",
  "/quemsomos.html"
]);

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

  if (page === "/dashboard.html" && !getCurrentUser(req)) {
    redirect(res, "/login.html?erro=login-obrigatorio");
    return;
  }

  serveFile(res, path.join(VIEWS_DIR, page), VIEWS_DIR);
}

function serveAsset(res, pathname) {
  if (pathname === "/favicon.png" || pathname === "/favicon.ico") {
    serveFile(res, path.join(PUBLIC_DIR, "images", "icons", "logo_justdoeat.png"), PUBLIC_DIR);
    return;
  }

  const isPublicAsset = pathname.startsWith("/public/") || pathname.startsWith("/css/") || pathname.startsWith("/js/") || pathname.startsWith("/images/");

  if (!isPublicAsset) {
    send(res, 404, "Arquivo nao encontrado.", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const publicPath = pathname.startsWith("/public/") ? pathname.slice("/public/".length) : pathname;
  serveFile(res, path.join(PUBLIC_DIR, publicPath), PUBLIC_DIR);
}

module.exports = {
  serveAsset,
  servePage
};
