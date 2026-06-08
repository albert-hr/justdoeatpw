const querystring = require("querystring");

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function redirect(res, location) {
  send(res, 302, "", { Location: location });
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
    cookies[name] = decodeURIComponent(rest.join("="));
    return cookies;
  }, {});
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
  parseCookies,
  readBody,
  redirect,
  send,
  sendJson,
  wantsJson
};
