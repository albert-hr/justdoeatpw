const { readBody, sendJson } = require("../utils/http");
const { requireUser } = require("./authController");
const {
  createOrder,
  findOrderFor,
  lastSevenDays,
  listOrdersFor,
  ORDER_STATUSES,
  OrderError,
  summarize,
  updateStatus
} = require("../models/pedidoModel");

function handleError(res, error) {
  if (error instanceof OrderError) {
    sendJson(res, error.status, { error: error.message });
    return;
  }
  throw error;
}

async function criar(req, res) {
  const user = await requireUser(req, res, ["cliente"]);
  if (!user) return;

  try {
    const pedido = await createOrder(user, await readBody(req));
    sendJson(res, 201, { pedido, redirectTo: `/checkout/sucesso?pedido=${encodeURIComponent(pedido.id)}` });
  } catch (error) {
    handleError(res, error);
  }
}

async function listar(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  sendJson(res, 200, { pedidos: await listOrdersFor(user), statuses: ORDER_STATUSES });
}

async function obter(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;

  const pedido = await findOrderFor(user, id);
  if (!pedido) {
    sendJson(res, 404, { error: "Pedido não encontrado." });
    return;
  }
  sendJson(res, 200, { pedido });
}

async function atualizarStatus(req, res, id) {
  const user = await requireUser(req, res, ["restaurante", "admin"]);
  if (!user) return;

  try {
    const data = await readBody(req);
    sendJson(res, 200, { pedido: await updateStatus(user, id, String(data.status || "")) });
  } catch (error) {
    handleError(res, error);
  }
}

// Números do painel (restaurante: só os dele; admin: todos).
async function resumo(req, res) {
  const user = await requireUser(req, res, ["restaurante", "admin"]);
  if (!user) return;

  const pedidos = await listOrdersFor(user);
  sendJson(res, 200, { resumo: summarize(pedidos), semana: lastSevenDays(pedidos) });
}

module.exports = {
  atualizarStatus,
  criar,
  listar,
  obter,
  resumo
};
