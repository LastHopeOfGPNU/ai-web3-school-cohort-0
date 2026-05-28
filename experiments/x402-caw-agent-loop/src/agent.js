import { authorizePaymentWithPact } from "./pact.js";

function encodeHeader(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeHeader(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

export async function runAutonomousPaymentLoop({ server, pact, path, prompt }) {
  const firstResponse = await server.handleRequest({
    method: "GET",
    path,
    headers: {},
    body: { prompt },
  });

  if (firstResponse.status !== 402) {
    return {
      status: firstResponse.status,
      body: firstResponse.body,
      audit: [...server.audit, ...pact.audit],
    };
  }

  const requiredFromHeader = decodeHeader(firstResponse.headers["PAYMENT-REQUIRED"]);
  const paymentRequirement = requiredFromHeader.accepts[0];
  let payment;

  try {
    payment = authorizePaymentWithPact(pact, paymentRequirement);
  } catch (error) {
    server.recordAudit({
      actor: "agent",
      action: "payment_aborted",
      result: "denied",
      reason: error.message,
      paymentRequirement,
    });
    throw error;
  }

  const paidResponse = await server.handleRequest({
    method: "GET",
    path,
    headers: {
      "PAYMENT-SIGNATURE": encodeHeader(payment),
    },
    body: { prompt },
  });

  const settlementHeader = paidResponse.headers["PAYMENT-RESPONSE"];
  return {
    status: paidResponse.status,
    body: paidResponse.body,
    settlement: settlementHeader ? decodeHeader(settlementHeader) : null,
    audit: [...server.audit, ...pact.audit],
  };
}
