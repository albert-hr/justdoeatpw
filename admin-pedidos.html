const { login, logout, me, register } = require("../controllers/authController");
const { submitContact } = require("../controllers/contactController");
const { serveAsset, servePage } = require("../controllers/pageController");
const { send, sendJson } = require("../utils/http");

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);

    if (req.method === "POST" && pathname === "/api/register") {
      await register(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/login") {
      await login(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/contact") {
      await submitContact(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/logout") {
      logout(req, res);
      return;
    }

    if (req.method === "GET" && pathname === "/api/me") {
      me(req, res);
      return;
    }

    if (req.method === "GET" && (pathname.startsWith("/public/") || pathname.startsWith("/css/") || pathname.startsWith("/js/") || pathname.startsWith("/images/"))) {
      serveAsset(res, pathname);
      return;
    }

    if (req.method === "GET") {
      servePage(req, res, pathname);
      return;
    }

    send(res, 405, "Metodo nao permitido.", { "Content-Type": "text/plain; charset=utf-8" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Erro interno no servidor." });
  }
}

module.exports = {
  handleRequest
};
