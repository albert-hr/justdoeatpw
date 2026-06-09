const crypto = require("crypto");
const { readDatabase, writeDatabase } = require("./database");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function checkPassword(password, passwordHash) {
  const [salt] = passwordHash.split(":");
  return hashPassword(password, salt) === passwordHash;
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function findUserByEmail(email) {
  const database = readDatabase();
  return database.users.find((user) => user.email === normalizeEmail(email)) || null;
}

function findUserById(id) {
  const database = readDatabase();
  return database.users.find((user) => user.id === id) || null;
}

function createUser(data) {
  const database = readDatabase();
  const user = {
    id: crypto.randomUUID(),
    perfil: data.perfil,
    nome: data.nome,
    email: data.email,
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
  };

  database.users.push(user);
  writeDatabase(database);
  return user;
}

module.exports = {
  checkPassword,
  createUser,
  findUserByEmail,
  findUserById,
  normalizeEmail,
  sanitizeUser
};
