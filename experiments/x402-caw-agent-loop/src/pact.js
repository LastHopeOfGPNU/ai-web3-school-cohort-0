import { createHash, randomUUID } from "node:crypto";

import { recordAudit } from "./audit.js";
import { formatMicrousd, parseUsdToMicrousd } from "./money.js";

function normalizeAddress(address) {
  return String(address).toLowerCase();
}

export function createDemoPact({
  maxUsd,
  allowedNetworks,
  allowedContracts,
  validForSeconds,
  perPaymentUsd = maxUsd,
  now = new Date(),
}) {
  const audit = [];
  const pact = {
    id: `pact_${randomUUID()}`,
    intent: "Allow the agent to pay an x402-protected API within a scoped commerce task.",
    executionPlan: "Read HTTP 402 payment requirements, authorize only matching payments, submit payment, then fetch the paid result.",
    policy: {
      maxMicrousd: parseUsdToMicrousd(maxUsd),
      perPaymentMicrousd: parseUsdToMicrousd(perPaymentUsd),
      allowedNetworks: new Set(allowedNetworks),
      allowedContracts: new Set(allowedContracts.map(normalizeAddress)),
      validUntil: new Date(now.getTime() + validForSeconds * 1000),
    },
    spentMicrousd: 0n,
    audit,
  };

  recordAudit(audit, {
    actor: "caw",
    action: "pact_created",
    result: "success",
    pactId: pact.id,
    policy: serializePolicy(pact),
  });

  return pact;
}

export function authorizePaymentWithPact(pact, paymentRequirement, now = new Date()) {
  const amountMicrousd = parseUsdToMicrousd(paymentRequirement.priceUsd);
  const reason = firstDenialReason(pact, paymentRequirement, amountMicrousd, now);

  if (reason) {
    recordAudit(pact.audit, {
      actor: "caw",
      action: "pact_check",
      result: "denied",
      pactId: pact.id,
      reason,
      paymentRequirement,
    });
    throw new Error(`Pact denied payment: ${reason}`);
  }

  pact.spentMicrousd += amountMicrousd;
  const payment = {
    protocol: "x402",
    pactId: pact.id,
    scheme: paymentRequirement.scheme,
    network: paymentRequirement.network,
    token: paymentRequirement.token,
    payTo: paymentRequirement.payTo,
    contract: paymentRequirement.contract,
    amountUsd: formatMicrousd(amountMicrousd),
    requirementHash: paymentRequirement.requirementHash,
    requestId: paymentRequirement.requestId,
    signedAt: now.toISOString(),
  };
  payment.signature = createHash("sha256")
    .update(JSON.stringify(payment))
    .update("|demo-caw-signer")
    .digest("hex");

  recordAudit(pact.audit, {
    actor: "caw",
    action: "pact_check",
    result: "allowed",
    pactId: pact.id,
    paymentRequirement,
    remainingBudgetUsd: formatMicrousd(pact.policy.maxMicrousd - pact.spentMicrousd),
  });
  recordAudit(pact.audit, {
    actor: "caw",
    action: "payment_signed",
    result: "success",
    pactId: pact.id,
    payment,
  });

  return payment;
}

function firstDenialReason(pact, requirement, amountMicrousd, now) {
  if (now > pact.policy.validUntil) {
    return "pact_expired";
  }
  if (!pact.policy.allowedNetworks.has(requirement.network)) {
    return "network_not_allowed";
  }
  if (!pact.policy.allowedContracts.has(normalizeAddress(requirement.contract))) {
    return "contract_not_allowed";
  }
  if (pact.spentMicrousd + amountMicrousd > pact.policy.maxMicrousd) {
    return "amount_exceeds_budget";
  }
  if (amountMicrousd > pact.policy.perPaymentMicrousd) {
    return "amount_exceeds_per_payment_limit";
  }
  return null;
}

function serializePolicy(pact) {
  return {
    maxUsd: formatMicrousd(pact.policy.maxMicrousd),
    perPaymentUsd: formatMicrousd(pact.policy.perPaymentMicrousd),
    allowedNetworks: [...pact.policy.allowedNetworks],
    allowedContracts: [...pact.policy.allowedContracts],
    validUntil: pact.policy.validUntil.toISOString(),
  };
}
