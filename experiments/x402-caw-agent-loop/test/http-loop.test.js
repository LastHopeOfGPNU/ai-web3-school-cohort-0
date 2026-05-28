import assert from "node:assert/strict";
import test from "node:test";

import { runAutonomousHttpPaymentLoop } from "../src/http-agent.js";
import { startPaywalledHttpServer } from "../src/http-server.js";
import { createDemoPact } from "../src/pact.js";
import { createPaywalledServer } from "../src/server.js";

test("HTTP agent receives 402, pays under Pact, and gets the protected result", async () => {
  const server = createPaywalledServer({
    resourcePath: "/api/inference",
    priceUsd: "0.001",
    network: "eip155:84532",
    token: "USDC",
    payTo: "0x1111111111111111111111111111111111111111",
    contract: "0x2222222222222222222222222222222222222222",
  });
  const httpServer = await startPaywalledHttpServer({ server, port: 0 });
  const pact = createDemoPact({
    maxUsd: "0.01",
    allowedNetworks: ["eip155:84532"],
    allowedContracts: ["0x2222222222222222222222222222222222222222"],
    validForSeconds: 600,
  });

  try {
    const result = await runAutonomousHttpPaymentLoop({
      baseUrl: httpServer.url,
      pact,
      path: "/api/inference",
      prompt: "summarize agent commerce in one sentence",
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.paid, true);
    assert.equal(result.settlement.status, "settled");
    assert.equal(server.settlements.length, 1);
  } finally {
    await httpServer.close();
  }
});
