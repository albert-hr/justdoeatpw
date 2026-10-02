const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const database = require("./database");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePerfil(perfil) {
  const role = String(perfil || "").trim().toLowerCase();
  return role === "administrador" ? "admin" : role;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashPassword(password) {
  return bcrypt.hashSync(String(password), 10);
}

// Aceita bcrypt (formato novo e do Postgres) e o pbkdf2 "salt:hash" das contas antigas do database.json.
function checkPassword(password, passwordHash) {
  const hash = String(passwordHash || "");
  if (hash.startsWith("$2")) return bcrypt.compareSync(String(password || ""), hash);

  const [salt, stored] = hash.split(":");
  if (!salt || !stored) return false;
  const candidate = crypto.pbkdf2Sync(String(password || ""), salt, 120000, 64, "sha512").toString("hex");
  return candidate.length === stored.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(stored));
}

// O que pode ir para as telas (nunca a senha).
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, password, ...safeUser } = user;
  const role = normalizePerfil(user.perfil);
  return {
    ...safeUser,
    id: String(user.id),
    role,
    restauranteSlug: role === "restaurante" ? slugify(user.nome) : null
  };
}

async function findUserByEmail(email) {
  return database.findUserByEmail(normalizeEmail(email));
}

async function findUserById(id) {
  return database.findUserById(id);
}

async function createUser(data) {
  return database.createUser({
    ...(database.usePostgres ? {} : { id: crypto.randomUUID() }), // no Postgres o id é SERIAL
    perfil: data.perfil,
    nome: data.nome,
    email: normalizeEmail(data.email),
    telefone: data.telefone,
    cpfCnpj: data.cpfCnpj,
    cep: data.cep,
    endereco: data.endereco,
    numero: data.numero,
    cidade: data.cidade,
    horarioAbertura: data.horarioAbertura,
    horarioFechamento: data.horarioFechamento,
    passwordHash: hashPassword(data.senha),
    createdAt: new Date().toISOString()
  });
}

async function listUsers() {
  return database.listUsers();
}

module.exports = {
  checkPassword,
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  normalizeEmail,
  normalizePerfil,
  sanitizeUser,
  slugify
};
