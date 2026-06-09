const crypto = require("crypto");
const { parseCookies } = require("../utils/http");
const { readDatabase, writeDatabase } = require("./database");
const { findUserById } = require("./userModel");
const { findFictitiousUserById, sanitizeFictitiousUser } = require("./fictitiousUserModel");

const SESSION_MAX_AGE_SECONDS = 86400;

function getExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
}

function cleanupExpiredSessions(database) {
  const now = Date.now();
  const originalLength = database.sessions.length;
  database.sessions = database.sessions.filter((session) => {
    return new Date(session.expiresAt).getTime() > now;
  });
  return database.sessions.length !== originalLength;
}

function createSession(res, userId) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const database = readDatabase();

  cleanupExpiredSessions(database);
  database.sessions.push({
    id: sessionId,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: getExpiresAt()
  });
  writeDatabase(database);

  res.setHeader(
    "Set-Cookie",
    `sessionId=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`
  );
}

function clearSession(req, res) {
  const cookies = parseCookies(req);
  if (cookies.sessionId) {
    const database = readDatabase();
    database.sessions = database.sessions.filter((session) => session.id !== cookies.sessionId);
    writeDatabase(database);
  }

  res.setHeader("Set-Cookie", "sessionId=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}

function getCurrentUser(req) {
  const cookies = parseCookies(req);
  if (!cookies.sessionId) return null;

  const database = readDatabase();
  const hasExpiredSessions = cleanupExpiredSessions(database);
  const session = database.sessions.find((storedSession) => storedSession.id === cookies.sessionId);

  if (hasExpiredSessions) {
    writeDatabase(database);
  }

  if (!session) return null;

  return findUserById(session.userId) || sanitizeFictitiousUser(findFictitiousUserById(session.userId));
}

module.exports = {
  clearSession,
  createSession,
  getCurrentUser
};
