const { createContact } = require("../models/contactModel");
const { readBody, redirect, sendJson, setFlash, wantsJson } = require("../utils/http");
const { isValidEmail } = require("../utils/validators");

async function submitContact(req, res) {
  const data = await readBody(req);
  const nome = String(data.nome || "").trim();
  const email = String(data.email || "").trim();
  const mensagem = String(data.mensagem || "").trim();

  const error = !nome || !mensagem
    ? "Preencha nome, e-mail e mensagem."
    : !isValidEmail(email) ? "Informe um e-mail válido para podermos responder." : "";

  if (error) {
    if (wantsJson(req)) {
      sendJson(res, 400, { error });
      return;
    }
    setFlash(res, "error", error);
    redirect(res, "/contato");
    return;
  }

  const contact = await createContact({ nome, email, mensagem });

  if (wantsJson(req)) {
    sendJson(res, 201, { contact });
    return;
  }

  setFlash(res, "success", "Mensagem enviada! Respondemos pelo e-mail informado.");
  redirect(res, "/contato");
}

module.exports = {
  submitContact
};
