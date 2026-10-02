// Para onde cada perfil vai depois do login, quem pode abrir cada área
// e os endereços antigos (.html) que agora apontam para as rotas novas.

function normalizePerfil(perfil) {
  const normalized = String(perfil || "").trim().toLowerCase();
  return normalized === "administrador" ? "admin" : normalized;
}

function getDashboardByPerfil(perfil) {
  const normalizedPerfil = normalizePerfil(perfil);

  if (normalizedPerfil === "cliente") return "/minha-conta";
  if (normalizedPerfil === "admin") return "/admin";
  if (normalizedPerfil === "restaurante") return "/painel";

  return "/";
}

// Áreas restritas: prefixo da rota -> perfis que podem entrar.
const PROTECTED_AREAS = [
  ["/painel", ["restaurante"]],
  ["/admin", ["admin"]],
  ["/checkout", ["cliente"]],
  ["/minha-conta", ["cliente"]]
];

function getAllowedRoles(pathname) {
  const area = PROTECTED_AREAS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return area ? area[1] : null;
}

// Só aceita "next" interno (evita mandar a pessoa para outro site).
function safeNext(next) {
  const value = String(next || "");
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/api/")) return "";
  return value;
}

function redirectAfterLogin(perfil, next) {
  const target = safeNext(next);
  const path = target.split("?")[0];
  const allowed = getAllowedRoles(path);
  if (target && !["/login", "/cadastro"].includes(path) && (!allowed || allowed.includes(normalizePerfil(perfil)))) {
    return target;
  }
  return getDashboardByPerfil(perfil);
}

const LEGACY_PAGES = {
  "/index.html": "/",
  "/listasderestaurantes.html": "/restaurantes",
  "/mcdonalds.html": "/restaurantes/mcdonalds",
  "/burgerking.html": "/restaurantes/burgerking",
  "/starbucks.html": "/restaurantes/starbucks",
  "/outback.html": "/restaurantes/outback",
  "/habibs.html": "/restaurantes/habibs",
  "/sabordavila.html": "/restaurantes/sabor-da-vila",
  "/carrinhodecompras.html": "/carrinho",
  "/checkout-endereco.html": "/checkout/endereco",
  "/checkout-pagamento.html": "/checkout/pagamento",
  "/checkout-sucesso.html": "/minha-conta",
  "/login.html": "/login",
  "/registro.html": "/cadastro",
  "/meu-perfil.html": "/minha-conta",
  "/dashboard.html": "/dashboard",
  "/dashboardv2.html": "/painel",
  "/pedidos-restaurante.html": "/painel/pedidos",
  "/listar.html": "/painel/cardapio",
  "/relatorios-restaurante.html": "/painel/relatorios",
  "/config-restaurante.html": "/painel/configuracoes",
  "/admin.html": "/admin",
  "/admin-pedidos.html": "/admin/pedidos",
  "/admin-clientes.html": "/admin/clientes",
  "/admin-restaurantes.html": "/admin/restaurantes",
  "/quemsomos.html": "/quem-somos",
  "/contato.html": "/contato",
  "/carreiras.html": "/carreiras",
  "/parceiros.html": "/parceiros",
  "/entregador.html": "/entregador"
};

module.exports = {
  getAllowedRoles,
  getDashboardByPerfil,
  LEGACY_PAGES,
  normalizePerfil,
  redirectAfterLogin,
  safeNext
};
