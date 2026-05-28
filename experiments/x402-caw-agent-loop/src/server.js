import { createHash, randomUUID } from "node:crypto";

import { recordAudit } from "./audit.js";

function encodeHeader(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeHeader(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

export function createPaywalledServer({
  resourcePath,
  priceUsd,
  network,
  token,
  payTo,
  contract,
}) {
  const audit = [];
  const settlements = [];

  const paymentRequirement = {
    x402Version: 2,
    scheme: "exact",
    network,
    token,
    priceUsd,
    payTo,
    contract,
    description: "Paid AI inference demo endpoint",
    mimeType: "application/json",
  };
  paymentRequirement.requirementHash = createHash("sha256")
    .update(JSON.stringify(paymentRequirement))
    .digest("hex");

  return {
    audit,
    settlements,
    paymentRequirement,
    recordAudit: (event) => recordAudit(audit, event),
    async handleRequest(request) {
      if (request.path !== resourcePath) {
        return { status: 404, headers: {}, body: { error: "not_found" } };
      }

      const paymentHeader = request.headers?.["PAYMENT-SIGNATURE"];
      if (!paymentHeader) {
        const body = {
          error: "payment_required",
          accepts: [{ ...paymentRequirement, requestId: `req_${randomUUID()}` }],
        };
        recordAudit(audit, {
          actor: "server",
          action: "payment_required",
          result: "issued",
          requirementHash: paymentRequirement.requirementHash,
        });
        return {
          status: 402,
          headers: {
            "PAYMENT-REQUIRED": encodeHeader(body),
          },
          body,
        };
      }

      const payment = decodeHeader(paymentHeader);
      validatePayment(paymentRequirement, payment);

      const settlement = {
        id: `settlement_${String(settlements.length + 1).padStart(4, "0")}`,
        status: "settled",
        protocol: "x402",
        network: payment.network,
        amountUsd: payment.amountUsd,
        payTo: payment.payTo,
        pactId: payment.pactId,
        txHash: createHash("sha256")
          .update(JSON.stringify(payment))
          .update("|demo-settlement")
          .digest("hex"),
      };
      settlements.push(settlement);
      recordAudit(audit, {
        actor: "server",
        action: "payment_settled",
        result: "success",
        settlement,
      });

      return {
        status: 200,
        headers: {
          "PAYMENT-RESPONSE": encodeHeader(settlement),
        },
        body: {
          paid: true,
          result: `This paid response explains that agent commerce is automatic execution bounded by explicit authorization, budget, and auditability.`,
          input: request.body,
        },
      };
    },
  };
}

function validatePayment(requirement, payment) {
  const mismatches = [
    ["scheme", requirement.scheme, payment.scheme],
    ["network", requirement.network, payment.network],
    ["payTo", requirement.payTo, payment.payTo],
    ["contract", requirement.contract, payment.contract],
    ["priceUsd", requirement.priceUsd, payment.amountUsd],
    ["requirementHash", requirement.requirementHash, payment.requirementHash],
  ].filter(([, expected, actual]) => expected !== actual);

  if (mismatches.length > 0 || !payment.signature) {
    throw new Error("invalid_payment_signature");
  }
}
