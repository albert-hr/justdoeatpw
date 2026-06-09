const { readBody, redirect, sendJson, wantsJson } = require("../utils/http");
const { isValidCep, isValidCpfOrCnpj, isValidEmail, isValidPhone } = require("../utils/validators");
const { checkPassword, createUser, findUserByEmail, normalizeEmail, sanitizeUser } = require("../models/userModel");
const { sanitizeFictitiousUser, validateFictitiousCredentials } = require("../models/fictitiousUserModel");
const { clearSession, createSession, getCurrentUser } = require("../models/sessionModel");
const { getDashboardByPerfil } = require("../utils/redirects");

async function register(req, res) {
  const data = await readBody(req);

  const nome = String(data.nome || "").trim();
  const email = normalizeEmail(data.email);
  const senha = String(data.senha || "");
  const confirmaSenha = String(data.confirma_senha || data.confirmaSenha || "");
  const perfil = data.perfil === "Restaurante" ? "Restaurante" : "Cliente";
  const telefone = String(data.telefone || "").trim();
  const cpfCnpj = String(data.cpf_cnpj || "").trim();
  const cep = String(data.cep || "").trim();

  if (!nome || !email || !senha) {
    sendJson(res, 400, { error: "Preencha nome, e-mail e senha." });
    return;
  }

  if (!isValidEmail(email)) {
    sendJson(res, 400, { error: "Informe um e-mail valido com @." });
    return;
  }

  if (!telefone || !isValidPhone(telefone)) {
    sendJson(res, 400, { error: "O telefone deve estar no formato (99) 99999-9999." });
    return;
  }

  if (perfil === "Restaurante") {
    if (!cpfCnpj || !isValidCpfOrCnpj(cpfCnpj)) {
      sendJson(res, 400, { error: "Informe CPF no formato 123.456.789-00 ou CNPJ no formato 12.345.678/0001-90." });
      return;
    }

    if (!cep || !isValidCep(cep)) {
      sendJson(res, 400, { error: "O CEP deve estar no formato 12345-678." });
      return;
    }
  }

  if (senha.length < 6) {
    sendJson(res, 400, { error: "A senha deve ter pelo menos 6 caracteres." });
    return;
  }

  if (confirmaSenha && senha !== confirmaSenha) {
    sendJson(res, 400, { error: "As senhas nao coincidem." });
    return;
  }

  if (findUserByEmail(email)) {
    sendJson(res, 409, { error: "Ja existe uma conta com este e-mail." });
    return;
  }

  const user = createUser({
    perfil,
    nome,
    email,
    telefone,
    cpfCnpj,
    cep,
    endereco: String(data.endereco || "").trim(),
    numero: String(data.numero || "").trim(),
    cidade: String(data.cidade || "").trim(),
    horarioAbertura: String(data.horario_abertura || "").trim(),
    horarioFechamento: String(data.horario_fechamento || "").trim(),
    senha
  });

  createSession(res, user.id);

  if (wantsJson(req)) {
    sendJson(res, 201, {
      redirectTo: getDashboardByPerfil(user.perfil),
      user: sanitizeUser(user)
    });
    return;
  }

  redirect(res, getDashboardByPerfil(user.perfil));
}

async function login(req, res) {
  const data = await readBody(req);
  const user = findUserByEmail(data.email);
  const senha = String(data.senha || "");
  const fictitiousUser = validateFictitiousCredentials(data.email, senha);

  if (fictitiousUser) {
    createSession(res, fictitiousUser.id);

    if (wantsJson(req)) {
      sendJson(res, 200, {
        redirectTo: getDashboardByPerfil(fictitiousUser.perfil),
        user: sanitizeFictitiousUser(fictitiousUser)
      });
      return;
    }

    redirect(res, getDashboardByPerfil(fictitiousUser.perfil));
    return;
  }

  if (!user || !checkPassword(senha, user.passwordHash)) {
    if (wantsJson(req)) {
      sendJson(res, 401, { error: "E-mail ou senha invalidos." });
      return;
    }

    redirect(res, "/login.html?erro=credenciais");
    return;
  }

  createSession(res, user.id);

  if (wantsJson(req)) {
    sendJson(res, 200, {
      redirectTo: getDashboardByPerfil(user.perfil),
      user: sanitizeUser(user)
    });
    return;
  }

  redirect(res, getDashboardByPerfil(user.perfil));
}

function logout(req, res) {
  clearSession(req, res);
  redirect(res, "/index.html");
}

function me(req, res) {
  const user = getCurrentUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Usuario nao autenticado." });
    return;
  }

  sendJson(res, 200, { user: sanitizeUser(user) });
}

module.exports = {
  login,
  logout,
  me,
  register
};
