export function recordAudit(audit, event) {
  const entry = {
    id: `audit_${String(audit.length + 1).padStart(4, "0")}`,
    at: new Date().toISOString(),
    ...event,
  };
  audit.push(entry);
  return entry;
}
