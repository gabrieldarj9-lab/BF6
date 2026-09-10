import { createBf6HttpServer } from "../src/http/server";

const host = process.env.HOST ?? "127.0.0.1";
const parsedPort = Number(process.env.PORT ?? "3000");
const port = Number.isInteger(parsedPort) && parsedPort >= 0 && parsedPort <= 65535
  ? parsedPort
  : 3000;

const server = createBf6HttpServer();

server.listen(port, host, () => {
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  console.log(`BF6 V1 Engine HTTP API listening on http://${host}:${actualPort}`);
});

function shutdown() {
  server.close(() => {
    process.exitCode = 0;
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
