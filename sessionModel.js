const crypto = require("crypto");
const { appendCookie, parseCookies } = require("../utils/http");
const database = require("./database");
const { findUserById, sanitizeUser } = require("./userModel");
const { findFictitiousUserById } = require("./fictitiousUserModel");

const SESSION_MAX_AGE_SECONDS = 7 * 86400;

function getExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
}

function cookieFlags() {
  const secure = process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `HttpOnly; SameSite=Lax; Path=/${secure}`;
}

async function createSession(req, res, userId) {
  // Se já havia uma sessão neste navegador, ela é encerrada (novo id a cada login).
  const previous = parseCookies(req).sessionId;
  if (previous) await database.deleteSession(previous);

  const sessionId = crypto.randomBytes(32).toString("hex");
  await database.createSession({
    id: sessionId,
    userId: String(userId),
    createdAt: new Date().toISOString(),
    expiresAt: getExpiresAt()
  });

  appendCookie(res, `sessionId=${sessionId}; ${cookieFlags()}; Max-Age=${SESSION_MAX_AGE_SECONDS}`);
}

async function clearSession(req, res) {
  const cookies = parseCookies(req);
  if (cookies.sessionId) await database.deleteSession(cookies.sessionId);
  appendCookie(res, `sessionId=; ${cookieFlags()}; Max-Age=0`);
}

// Usuário logado nesta requisição (ou null). O resultado fica guardado em req para não ler duas vezes.
async function getCurrentUser(req) {
  if (req.currentUser !== undefined) return req.currentUser;

  const cookies = parseCookies(req);
  let user = null;
  if (cookies.sessionId) {
    const session = await database.findSession(cookies.sessionId);
    if (session) {
      user = sanitizeUser(findFictitiousUserById(session.userId) || await findUserById(session.userId));
    }
  }

  req.currentUser = user;
  return user;
}

module.exports = {
  clearSession,
  createSession,
  getCurrentUser
};
