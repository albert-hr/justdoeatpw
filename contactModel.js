const crypto = require("crypto");
const database = require("./database");
const { normalizeEmail } = require("./userModel");

async function createContact(data) {
  return database.createContact({
    id: crypto.randomUUID(),
    nome: String(data.nome || "").trim(),
    email: normalizeEmail(data.email),
    mensagem: String(data.mensagem || "").trim(),
    createdAt: new Date().toISOString()
  });
}

module.exports = {
  createContact
};
