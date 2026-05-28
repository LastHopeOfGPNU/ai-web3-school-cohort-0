import { runAutonomousPaymentLoop } from "./agent.js";
import { createDemoPact } from "./pact.js";
import { createPaywalledServer } from "./server.js";

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

console.log(JSON.stringify(result, null, 2));
