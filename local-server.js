const http = require("http");
const { handleRequest } = require("./routes/router");

const PORT = Number(process.env.PORT) || 3000;

http.createServer(handleRequest).listen(PORT, () => {
  console.log(`Just Do Eat rodando em http://localhost:${PORT}`);
});
