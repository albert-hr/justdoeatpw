// Entrada usada pela Vercel: ela chama esta função a cada requisição.
// As rotas são as mesmas do servidor local (routes/router.js).
const { handleRequest } = require("./routes/router");

module.exports = (req, res) => handleRequest(req, res);
