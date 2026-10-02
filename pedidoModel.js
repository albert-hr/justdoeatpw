const crypto = require("crypto");
const database = require("./database");
const { findMenuItem } = require("./restauranteModel");

// Parcela Amiga: porcentagem do subtotal de cada pedido que vai para o fundo solidário.
const PARCELA_AMIGA_PERCENT = Number(process.env.PARCELA_AMIGA_PERCENT || 2);

const ORDER_STATUSES = ["Recebido", "Preparando", "Saiu para entrega", "Entregue", "Cancelado"];
const FINISHED_STATUSES = ["Entregue", "Cancelado"];

const PAYMENT_LABELS = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  dinheiro: "Dinheiro na entrega"
};

class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function isActive(order) {
  return !FINISHED_STATUSES.includes(order.status);
}

// Monta o pedido a partir do carrinho. Os preços SEMPRE vêm do catálogo do servidor, nunca do navegador.
async function createOrder(user, { itens, endereco, pagamento }) {
  if (!Array.isArray(itens) || !itens.length) throw new OrderError("Seu carrinho está vazio.");
  if (!PAYMENT_LABELS[pagamento]) throw new OrderError("Escolha uma forma de pagamento.");

  const address = {
    cep: String(endereco?.cep || "").trim(),
    endereco: String(endereco?.endereco || "").trim(),
    numero: String(endereco?.numero || "").trim(),
    complemento: String(endereco?.complemento || "").trim(),
    referencia: String(endereco?.referencia || "").trim()
  };
  if (!address.cep || !address.endereco || !address.numero) {
    throw new OrderError("Informe o endereço de entrega antes de pagar.");
  }

  let restaurant = null;
  const orderItems = itens.map((cartItem) => {
    const found = findMenuItem(String(cartItem.id));
    if (!found) throw new OrderError("Um dos itens do carrinho não está mais disponível. Revise o carrinho.");
    if (restaurant && restaurant.slug !== found.restaurant.slug) {
      throw new OrderError("O carrinho tem itens de restaurantes diferentes. Faça um pedido por restaurante.");
    }
    restaurant = found.restaurant;
    const quantidade = Math.max(1, Math.min(50, parseInt(cartItem.quantity ?? cartItem.quantidade, 10) || 1));
    return { id: found.item.id, nome: found.item.nome, preco: found.item.preco, quantidade };
  });

  const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0));
  const now = new Date().toISOString();

  return database.createOrder({
    id: crypto.randomUUID(),
    codigo: `JDE-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    clienteId: user.id,
    clienteNome: user.nome,
    restauranteSlug: restaurant.slug,
    restauranteNome: restaurant.nome,
    itens: orderItems,
    subtotal,
    taxaEntrega: restaurant.taxaEntrega,
    total: roundMoney(subtotal + restaurant.taxaEntrega),
    parcelaAmiga: roundMoney((subtotal * PARCELA_AMIGA_PERCENT) / 100),
    endereco: address,
    pagamento: PAYMENT_LABELS[pagamento],
    status: "Recebido",
    historico: [{ status: "Recebido", em: now }],
    criadoEm: now,
    atualizadoEm: now
  });
}

// Cada perfil enxerga só o que é dele.
async function listOrdersFor(user) {
  if (!user) return [];
  if (user.role === "admin") return database.listOrders();
  if (user.role === "restaurante") return database.listOrders({ restauranteSlug: user.restauranteSlug });
  return database.listOrders({ clienteId: user.id });
}

async function listAllOrders() {
  return database.listOrders();
}

function canView(user, order) {
  if (!user || !order) return false;
  if (user.role === "admin") return true;
  if (user.role === "restaurante") return order.restauranteSlug === user.restauranteSlug;
  return String(order.clienteId) === String(user.id);
}

async function findOrderFor(user, id) {
  const order = await database.findOrderById(String(id));
  return canView(user, order) ? order : null;
}

async function updateStatus(user, id, status) {
  if (!ORDER_STATUSES.includes(status)) throw new OrderError("Status inválido.");
  if (!["admin", "restaurante"].includes(user?.role)) throw new OrderError("Só o restaurante ou o admin mudam o status.", 403);

  const order = await findOrderFor(user, id);
  if (!order) throw new OrderError("Pedido não encontrado.", 404);
  if (order.status === status) return order;

  const now = new Date().toISOString();
  return database.updateOrder(order.id, {
    status,
    historico: [...(order.historico || []), { status, em: now }],
    atualizadoEm: now
  });
}

function dayKey(date) {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Números usados no painel do restaurante, no admin e na página inicial.
function summarize(orders) {
  const today = dayKey(Date.now());
  const valid = orders.filter((order) => order.status !== "Cancelado");
  const todayOrders = valid.filter((order) => dayKey(order.criadoEm) === today);

  const itemCount = new Map();
  valid.forEach((order) => order.itens.forEach((item) => {
    itemCount.set(item.nome, (itemCount.get(item.nome) || 0) + item.quantidade);
  }));

  return {
    totalPedidos: orders.length,
    ativos: orders.filter(isActive).length,
    vendasHoje: roundMoney(todayOrders.reduce((sum, order) => sum + order.subtotal, 0)),
    pedidosHoje: todayOrders.length,
    faturamento: roundMoney(valid.reduce((sum, order) => sum + order.subtotal, 0)),
    parcelaAmiga: roundMoney(valid.reduce((sum, order) => sum + (order.parcelaAmiga || 0), 0)),
    maisVendidos: [...itemCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([nome, quantidade]) => ({ nome, quantidade }))
  };
}

// Vendas dos últimos 7 dias (gráfico dos relatórios).
function lastSevenDays(orders) {
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(Date.now() - offset * 86400000);
    days.push({
      chave: dayKey(date),
      rotulo: date.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" }).replace(".", ""),
      total: 0,
      pedidos: 0
    });
  }

  orders.filter((order) => order.status !== "Cancelado").forEach((order) => {
    const day = days.find((candidate) => candidate.chave === dayKey(order.criadoEm));
    if (day) {
      day.total = roundMoney(day.total + order.subtotal);
      day.pedidos += 1;
    }
  });

  const max = Math.max(...days.map((day) => day.total), 0);
  return days.map((day) => ({ ...day, percentual: max ? Math.round((day.total / max) * 100) : 0 }));
}

module.exports = {
  createOrder,
  findOrderFor,
  isActive,
  lastSevenDays,
  listAllOrders,
  listOrdersFor,
  ORDER_STATUSES,
  OrderError,
  PARCELA_AMIGA_PERCENT,
  summarize,
  updateStatus
};
