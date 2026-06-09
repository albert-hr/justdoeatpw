const crypto = require("crypto");
const { readDatabase, writeDatabase } = require("./database");
const { normalizeEmail } = require("./userModel");

function createContact(data) {
  const database = readDatabase();
  const contact = {
    id: crypto.randomUUID(),
    nome: String(data.nome || "").trim(),
    email: normalizeEmail(data.email),
    mensagem: String(data.mensagem || "").trim(),
    createdAt: new Date().toISOString()
  };

  database.contacts.push(contact);
  writeDatabase(database);
  return contact;
}

module.exports = {
  createContact
};
