export function parseUsdToMicrousd(value) {
  const text = String(value).trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{1,6})?$/.test(text)) {
    throw new Error(`Invalid USD amount: ${value}`);
  }

  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}

export function formatMicrousd(value) {
  const amount = BigInt(value);
  const whole = amount / 1_000_000n;
  const fraction = String(amount % 1_000_000n).padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}
