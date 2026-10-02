const { readBody, redirect, sendJson, setFlash, wantsJson } = require("../utils/http");
const { isValidCep, isValidCpfOrCnpj, isValidEmail, isValidPhone } = require("../utils/validators");
const { checkPassword, createUser, findUserByEmail, normalizeEmail, sanitizeUser } = require("../models/userModel");
const { findFictitiousUserByEmail, sanitizeFictitiousUser, validateFictitiousCredentials } = require("../models/fictitiousUserModel");
const { clearSession, createSession, getCurrentUser } = require("../models/sessionModel");
const { redirectAfterLogin, safeNext } = require("../utils/redirects");

// Pessoas são chamadas pelo primeiro nome; restaurantes, pelo nome completo.
function greetingName(user) {
  return user.role === "restaurante" ? user.nome : String(user.nome || "").split(" ")[0];
}

function fail(req, res, status, message, backTo) {
  if (wantsJson(req)) {
    sendJson(res, status, { error: message });
    return;
  }
  setFlash(res, "error", message);
  redirect(res, backTo);
}

function finish(req, res, status, user, next) {
  const redirectTo = redirectAfterLogin(user.perfil, next);
  if (wantsJson(req)) {
    sendJson(res, status, { redirectTo, user });
    return;
  }
  redirect(res, redirectTo);
}

async function register(req, res) {
  const data = await readBody(req);
  const next = safeNext(data.next);
  const perfil = data.perfil === "Restaurante" ? "Restaurante" : "Cliente";
  const backTo = `/cadastro?perfil=${perfil}${next ? `&next=${encodeURIComponent(next)}` : ""}`;

  const nome = String(data.nome || "").trim();
  const email = normalizeEmail(data.email);
  const senha = String(data.senha || "");
  const confirmaSenha = String(data.confirma_senha || data.confirmaSenha || "");
  const telefone = String(data.telefone || "").trim();
  const cpfCnpj = String(data.cpf_cnpj || "").trim();
  const cep = String(data.cep || "").trim();

  if (!nome || !email || !senha) return fail(req, res, 400, "Preencha nome, e-mail e senha.", backTo);
  if (!isValidEmail(email)) return fail(req, res, 400, "Informe um e-mail válido, como nome@email.com.", backTo);
  if (!telefone || !isValidPhone(telefone)) return fail(req, res, 400, "O telefone deve estar no formato (99) 99999-9999.", backTo);

  if (perfil === "Restaurante") {
    if (!cpfCnpj || !isValidCpfOrCnpj(cpfCnpj)) {
      return fail(req, res, 400, "Informe CPF no formato 123.456.789-00 ou CNPJ no formato 12.345.678/0001-90.", backTo);
    }
    if (!cep || !isValidCep(cep)) return fail(req, res, 400, "O CEP deve estar no formato 12345-678.", backTo);
  }

  if (senha.length < 6) return fail(req, res, 400, "A senha deve ter pelo menos 6 caracteres.", backTo);
  if (senha !== confirmaSenha) return fail(req, res, 400, "As senhas não coincidem.", backTo);
  if (findFictitiousUserByEmail(email) || await findUserByEmail(email)) {
    return fail(req, res, 409, "Já existe uma conta com este e-mail. Entre com ela ou use outro e-mail.", backTo);
  }

  const created = await createUser({
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

  await createSession(req, res, created.id);
  const user = sanitizeUser(created);
  setFlash(res, "success", `Conta criada! Boas-vindas, ${greetingName(user)}.`);
  finish(req, res, 201, user, next);
}

async function login(req, res) {
  const data = await readBody(req);
  const next = safeNext(data.next);
  const backTo = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const senha = String(data.senha || "");

  if (!data.email || !senha) return fail(req, res, 400, "Preencha e-mail e senha para entrar.", backTo);

  let found = validateFictitiousCredentials(data.email, senha);
  if (found) {
    found = sanitizeFictitiousUser(found);
  } else {
    const stored = await findUserByEmail(data.email);
    found = stored && checkPassword(senha, stored.passwordHash) ? stored : null;
  }

  if (!found) return fail(req, res, 401, "E-mail ou senha inválidos.", backTo);

  await createSession(req, res, found.id);
  const user = sanitizeUser(found);
  setFlash(res, "success", `Olá, ${greetingName(user)}! Você entrou na sua conta.`);
  finish(req, res, 200, user, next);
}

async function logout(req, res) {
  await clearSession(req, res);
  setFlash(res, "info", "Você saiu da sua conta.");
  if (wantsJson(req)) {
    sendJson(res, 200, { ok: true, redirectTo: "/" });
    return;
  }
  redirect(res, "/");
}

// Garante que há alguém logado (e, se informado, com um dos perfis aceitos).
async function requireUser(req, res, roles = []) {
  const user = await getCurrentUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Entre com sua conta para continuar." });
    return null;
  }
  if (roles.length && !roles.includes(user.role)) {
    sendJson(res, 403, { error: "Seu perfil não tem acesso a isso." });
    return null;
  }
  return user;
}

async function me(req, res) {
  // Visitante recebe { user: null } (não é erro: só não entrou ainda).
  sendJson(res, 200, { user: await getCurrentUser(req) });
}

module.exports = {
  login,
  logout,
  me,
  register,
  requireUser
};
