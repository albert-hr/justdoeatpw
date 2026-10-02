const { sendJson } = require("../utils/http");
const { findRestaurant, listRestaurants, topRestaurants } = require("../models/restauranteModel");

function listar(req, res, searchParams) {
  if (searchParams.get("destaques")) {
    sendJson(res, 200, { restaurantes: topRestaurants(Number(searchParams.get("destaques")) || 4) });
    return;
  }

  sendJson(res, 200, {
    restaurantes: listRestaurants({
      categoria: searchParams.get("categoria") || "",
      q: searchParams.get("q") || ""
    })
  });
}

function obter(req, res, slug) {
  const restaurante = findRestaurant(slug);
  if (!restaurante) {
    sendJson(res, 404, { error: "Restaurante não encontrado." });
    return;
  }
  sendJson(res, 200, { restaurante });
}

module.exports = {
  listar,
  obter
};
