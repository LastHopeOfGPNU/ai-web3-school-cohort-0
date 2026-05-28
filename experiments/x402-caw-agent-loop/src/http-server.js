import http from "node:http";

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("error", reject);
    request.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      resolve(text ? JSON.parse(text) : {});
    });
  });
}

function writeJson(response, result) {
  for (const [key, value] of Object.entries(result.headers)) {
    response.setHeader(key, value);
  }
  response.setHeader("content-type", "application/json");
  response.writeHead(result.status);
  response.end(JSON.stringify(result.body));
}

export function startPaywalledHttpServer({ server, port = 4021 }) {
  const httpServer = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      const paymentSignature = request.headers["payment-signature"];
      const result = await server.handleRequest({
        method: request.method,
        path: url.pathname,
        headers: paymentSignature ? { "PAYMENT-SIGNATURE": paymentSignature } : {},
        body: await readBody(request),
      });
      writeJson(response, result);
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: error.message }));
    }
  });

  return new Promise((resolve, reject) => {
    httpServer.on("error", reject);
    httpServer.listen(port, "127.0.0.1", () => {
      const address = httpServer.address();
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((closeResolve) => httpServer.close(closeResolve)),
      });
    });
  });
}
