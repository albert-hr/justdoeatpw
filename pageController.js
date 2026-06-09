const { createContact } = require("../models/contactModel");
const { readBody, redirect, sendJson, wantsJson } = require("../utils/http");

async function submitContact(req, res) {
  const data = await readBody(req);
  const nome = String(data.nome || "").trim();
  const email = String(data.email || "").trim();
  const mensagem = String(data.mensagem || "").trim();

  if (!nome || !email || !mensagem) {
    sendJson(res, 400, { error: "Preencha nome, e-mail e mensagem." });
    return;
  }

  const contact = createContact({ nome, email, mensagem });

  if (wantsJson(req)) {
    sendJson(res, 201, { contact });
    return;
  }

  redirect(res, "/contato.html?enviado=1");
}

module.exports = {
  submitContact
};
