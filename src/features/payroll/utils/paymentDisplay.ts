/** Never display a complete provider/account reference in payment tables. */
export function maskPaymentReference(value: string | null): string { return value ? value.length > 4 ? `••••${value.slice(-4)}` : "••••" : "—"; }
