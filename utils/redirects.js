function getDashboardByPerfil(perfil) {
  const normalizedPerfil = String(perfil || "").toLowerCase();

  if (normalizedPerfil === "cliente") {
    return "/listasderestaurantes.html";
  }

  if (normalizedPerfil === "admin" || normalizedPerfil === "administrador") {
    return "/admin.html";
  }

  if (normalizedPerfil === "restaurante") {
    return "/dashboardv2.html";
  }

  return "/dashboard.html";
}

module.exports = {
  getDashboardByPerfil
};
