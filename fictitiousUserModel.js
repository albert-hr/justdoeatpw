const { normalizeEmail } = require("./userModel");

// Contas fixas para apresentação do projeto.
// Ficam ligadas quando não há Postgres (ambiente local). Em produção, só com DEMO_USERS=true.
const fictitiousUsers = [
  {
    id: "fake-cliente-ana-silva",
    perfil: "Cliente",
    nome: "Ana Silva",
    email: "ana.silva@email.com",
    password: "senha123",
    telefone: "(11) 98765-4321",
    cep: "08500-000",
    endereco: "Rua das Flores",
    numero: "120",
    cidade: "Ferraz de Vasconcelos"
  },
  {
    id: "fake-restaurante-sabor-da-vila",
    perfil: "Restaurante",
    nome: "Sabor da Vila",
    email: "contato@sabordavila.com.br",
    password: "vila1234",
    telefone: "(11) 4678-1234",
    cidade: "Ferraz de Vasconcelos"
  },
  {
    id: "fake-admin-justdoeat",
    perfil: "Admin",
    nome: "Administrador Just Do Eat",
    email: "admin@justdoeat.com",
    password: "admin123"
  }
];

function isEnabled() {
  if (process.env.DEMO_USERS === "true") return true;
  if (process.env.DEMO_USERS === "false") return false;
  return !process.env.DATABASE_URL;
}

function listFictitiousUsers() {
  return isEnabled() ? fictitiousUsers : [];
}

function sanitizeFictitiousUser(user) {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
}

function findFictitiousUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return listFictitiousUsers().find((user) => user.email === normalizedEmail) || null;
}

function findFictitiousUserById(id) {
  return listFictitiousUsers().find((user) => user.id === id) || null;
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
  listFictitiousUsers,
  sanitizeFictitiousUser,
  validateFictitiousCredentials
};
