import assert from "node:assert/strict";
import test from "node:test";

import { runAutonomousPaymentLoop } from "../src/agent.js";
import { createDemoPact } from "../src/pact.js";
import { createPaywalledServer } from "../src/server.js";

test("agent pays an x402-protected API only when the CAW pact allows it", async () => {
  const server = createPaywalledServer({
    resourcePath: "/api/inference",
    priceUsd: "0.001",
    network: "eip155:84532",
    token: "USDC",
    payTo: "0x1111111111111111111111111111111111111111",
    contract: "0x2222222222222222222222222222222222222222",
  });
  const pact = createDemoPact({
    maxUsd: "0.01",
    allowedNetworks: ["eip155:84532"],
    allowedContracts: ["0x2222222222222222222222222222222222222222"],
    validForSeconds: 600,
  });

  const result = await runAutonomousPaymentLoop({
    server,
    pact,
    path: "/api/inference",
    prompt: "summarize agent commerce in one sentence",
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.paid, true);
  assert.equal(result.body.result.includes("agent commerce"), true);
  assert.equal(result.settlement.status, "settled");
  assert.equal(result.audit.some((entry) => entry.action === "pact_check" && entry.result === "allowed"), true);
  assert.equal(result.audit.some((entry) => entry.action === "payment_settled" && entry.result === "success"), true);
});

test("agent refuses payment when the x402 requirement exceeds the CAW pact budget", async () => {
  const server = createPaywalledServer({
    resourcePath: "/api/inference",
    priceUsd: "0.05",
    network: "eip155:84532",
    token: "USDC",
    payTo: "0x1111111111111111111111111111111111111111",
    contract: "0x2222222222222222222222222222222222222222",
  });
  const pact = createDemoPact({
    maxUsd: "0.01",
    allowedNetworks: ["eip155:84532"],
    allowedContracts: ["0x2222222222222222222222222222222222222222"],
    validForSeconds: 600,
  });

  await assert.rejects(
    runAutonomousPaymentLoop({
      server,
      pact,
      path: "/api/inference",
      prompt: "summarize agent commerce in one sentence",
    }),
    /Pact denied payment: amount_exceeds_budget/,
  );

  assert.equal(server.audit.some((entry) => entry.result === "denied"), true);
  assert.equal(server.settlements.length, 0);
});
