const http = require("http");
const { handleRequest } = require("./routes/router");
const { storageName } = require("./models/database");
const { listFictitiousUsers } = require("./models/fictitiousUserModel");

const PORT = Number(process.env.PORT) || 3000;

http.createServer(handleRequest).listen(PORT, () => {
  console.log(`Just Do Eat rodando em http://localhost:${PORT}`);
  console.log(`Dados salvos em: ${storageName}`);
  if (listFictitiousUsers().length) console.log("Contas de demonstração ativas (ana.silva@email.com / senha123, contato@sabordavila.com.br / vila1234, admin@justdoeat.com / admin123).");
});
