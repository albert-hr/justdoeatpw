const { normalizeEmail } = require("./userModel");

const fictitiousUsers = [
  {
    id: "fake-cliente-ana-silva",
    perfil: "Cliente",
    nome: "Ana Silva",
    email: "ana.silva@email.com",
    password: "senha123"
  },
  {
    id: "fake-restaurante-sabor-da-vila",
    perfil: "Restaurante",
    nome: "Sabor da Vila",
    email: "contato@sabordavila.com.br",
    password: "vila1234"
  },
  {
    id: "fake-admin-justdoeat",
    perfil: "Admin",
    nome: "Administrador Just Do Eat",
    email: "admin@justdoeat.com",
    password: "admin123"
  }
];

function sanitizeFictitiousUser(user) {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
}

function findFictitiousUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return fictitiousUsers.find((user) => user.email === normalizedEmail) || null;
}

function findFictitiousUserById(id) {
  return fictitiousUsers.find((user) => user.id === id) || null;
}

function validateFictitiousCredentials(email, password) {
  const user = findFictitiousUserByEmail(email);
  if (!user || user.password !== String(password || "")) {
    return null;
  }

  return user;
}

module.exports = {
  findFictitiousUserByEmail,
  findFictitiousUserById,
  sanitizeFictitiousUser,
  validateFictitiousCredentials
};
