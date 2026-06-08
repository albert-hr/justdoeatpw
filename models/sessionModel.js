const crypto = require("crypto");
const { parseCookies } = require("../utils/http");
const { findUserById } = require("./userModel");
const { findFictitiousUserById, sanitizeFictitiousUser } = require("./fictitiousUserModel");

const sessions = new Map();

function createSession(res, userId) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { userId, createdAt: new Date().toISOString() });

  res.setHeader(
    "Set-Cookie",
    `sessionId=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
  );
}

function clearSession(req, res) {
  const cookies = parseCookies(req);
  if (cookies.sessionId) {
    sessions.delete(cookies.sessionId);
  }

  res.setHeader("Set-Cookie", "sessionId=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}

function getCurrentUser(req) {
  const cookies = parseCookies(req);
  const session = sessions.get(cookies.sessionId);
  if (!session) return null;

  return findUserById(session.userId) || sanitizeFictitiousUser(findFictitiousUserById(session.userId));
}

module.exports = {
  clearSession,
  createSession,
  getCurrentUser
};
