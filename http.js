const querystring = require("querystring");

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function redirect(res, location, statusCode = 302) {
  send(res, statusCode, "", { Location: location });
}

function sendJson(res, statusCode, data) {
  send(res, statusCode, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8"
  });
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((cookies, item) => {
    const [name, ...rest] = item.trim().split("=");
    if (!name) return cookies;
    try {
      cookies[name] = decodeURIComponent(rest.join("="));
    } catch (error) {
      cookies[name] = rest.join("=");
    }
    return cookies;
  }, {});
}

// Adiciona um cookie sem apagar os que já foram definidos na mesma resposta.
function appendCookie(res, cookie) {
  const current = res.getHeader("Set-Cookie");
  const list = Array.isArray(current) ? current : current ? [current] : [];
  res.setHeader("Set-Cookie", [...list, cookie]);
}

// Mensagem rápida ("toast") que aparece na próxima tela carregada.
function setFlash(res, type, message) {
  const value = encodeURIComponent(JSON.stringify({ type, message }));
  appendCookie(res, `jde_flash=${value}; Path=/; Max-Age=60; SameSite=Lax`);
}

function takeFlash(req, res) {
  const raw = parseCookies(req).jde_flash;
  if (!raw) return null;
  appendCookie(res, "jde_flash=; Path=/; Max-Age=0; SameSite=Lax");
  try {
    const flash = JSON.parse(raw);
    return flash && flash.message ? flash : null;
  } catch (error) {
    return null;
  }
}

function wantsJson(req) {
  return (req.headers.accept || "").includes("application/json");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Corpo da requisicao muito grande."));
      }
    });

    req.on("end", () => {
      const contentType = req.headers["content-type"] || "";

      if (contentType.includes("application/json")) {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(new Error("JSON invalido."));
        }
        return;
      }

      resolve(querystring.parse(body));
    });

    req.on("error", reject);
  });
}

module.exports = {
  appendCookie,
  parseCookies,
  readBody,
  redirect,
  send,
  sendJson,
  setFlash,
  takeFlash,
  wantsJson
};
