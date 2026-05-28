import { authorizePaymentWithPact } from "./pact.js";

function encodeHeader(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeHeader(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

export async function runAutonomousHttpPaymentLoop({ baseUrl, pact, path, prompt }) {
  const url = new URL(path, baseUrl);
  const firstResponse = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (firstResponse.status !== 402) {
    return {
      status: firstResponse.status,
      body: await firstResponse.json(),
      settlement: null,
      audit: pact.audit,
    };
  }

  const paymentRequired = decodeHeader(firstResponse.headers.get("PAYMENT-REQUIRED"));
  const payment = authorizePaymentWithPact(pact, paymentRequired.accepts[0]);
  const paidResponse = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "PAYMENT-SIGNATURE": encodeHeader(payment),
    },
    body: JSON.stringify({ prompt }),
  });

  return {
    status: paidResponse.status,
    body: await paidResponse.json(),
    settlement: decodeHeader(paidResponse.headers.get("PAYMENT-RESPONSE")),
    audit: pact.audit,
  };
}
