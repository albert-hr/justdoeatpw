// Dados de usuários para a área do administrador.
const { sendJson } = require("../utils/http");
const { listUsers, normalizePerfil, slugify } = require("../models/userModel");
const { listFictitiousUsers, sanitizeFictitiousUser } = require("../models/fictitiousUserModel");
const { RESTAURANTS } = require("../models/restauranteModel");
const { listAllOrders } = require("../models/pedidoModel");
const { requireUser } = require("./authController");

async function allUsers() {
  const stored = (await listUsers()).map(({ passwordHash, ...user }) => user);
  const demos = listFictitiousUsers().map((user) => ({ ...sanitizeFictitiousUser(user), demo: true }));
  return [...demos, ...stored];
}

async function listarClientes(req, res) {
  if (!await requireUser(req, res, ["admin"])) return;

  const [usuarios, pedidos] = await Promise.all([allUsers(), listAllOrders()]);
  const clientes = usuarios
    .filter((user) => normalizePerfil(user.perfil) === "cliente")
    .map((user) => {
      const seus = pedidos.filter((pedido) => String(pedido.clienteId) === String(user.id));
      return {
        id: String(user.id),
        nome: user.nome,
        email: user.email,
        telefone: user.telefone || "",
        demo: Boolean(user.demo),
        pedidos: seus.length,
        gasto: seus.reduce((sum, pedido) => sum + pedido.total, 0)
      };
    });

  sendJson(res, 200, { clientes });
}

async function listarRestaurantes(req, res) {
  if (!await requireUser(req, res, ["admin"])) return;

  const [usuarios, pedidos] = await Promise.all([allUsers(), listAllOrders()]);
  const contas = usuarios.filter((user) => normalizePerfil(user.perfil) === "restaurante");

  const publicados = RESTAURANTS.map((restaurante) => ({
    nome: restaurante.nome,
    slug: restaurante.slug,
    tipo: restaurante.tipo,
    email: contas.find((user) => slugify(user.nome) === restaurante.slug)?.email || "",
    publicado: true,
    pedidos: pedidos.filter((pedido) => pedido.restauranteSlug === restaurante.slug).length
  }));

  const aguardando = contas
    .filter((user) => !RESTAURANTS.some((restaurante) => restaurante.slug === slugify(user.nome)))
    .map((user) => ({ nome: user.nome, slug: slugify(user.nome), tipo: "", email: user.email, publicado: false, pedidos: 0 }));

  sendJson(res, 200, { restaurantes: [...aguardando, ...publicados] });
}

module.exports = {
  listarClientes,
  listarRestaurantes
};
