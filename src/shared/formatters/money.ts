/**
 * Formats monetary values through Decimal without performing arithmetic with
 * JavaScript floating-point numbers.
 *
 * Integer grouping uses BigInt so values larger than Number.MAX_SAFE_INTEGER
 * remain exact during localization.
 */
import Decimal from "decimal.js";

export type MoneyValue = Decimal.Value;

export interface MoneyFormatOptions {
  locale: string;
  currency: string;
  currencyDisplay?: "symbol" | "code" | "narrowSymbol";
  currencySign?: "standard" | "accounting";
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  rounding?: Decimal.Rounding;
  useGrouping?: boolean;
}

export function toMoneyDecimal(value: MoneyValue): Decimal {
  return new Decimal(value);
}

const localizedDecimalSeparator = (locale: string): string => {
  const decimalPart = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    useGrouping: false,
  })
    .formatToParts(1.1)
    .find(({ type }) => type === "decimal");

  return decimalPart?.value ?? ".";
};

export function formatMoney(
  value: MoneyValue,
  {
    locale,
    currency,
    currencyDisplay = "symbol",
    currencySign = "standard",
    minimumFractionDigits,
    maximumFractionDigits,
    rounding = Decimal.ROUND_HALF_UP,
    useGrouping = true,
  }: MoneyFormatOptions,
): string {
  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay,
    currencySign,
    useGrouping,
    ...(minimumFractionDigits === undefined
      ? {}
      : { minimumFractionDigits }),
    ...(maximumFractionDigits === undefined
      ? {}
      : { maximumFractionDigits }),
  });
  const resolvedOptions = currencyFormatter.resolvedOptions();
  const resolvedMaximumFractionDigits =
    resolvedOptions.maximumFractionDigits ?? 0;
  const resolvedMinimumFractionDigits =
    resolvedOptions.minimumFractionDigits ?? 0;
  const rawDecimalValue = toMoneyDecimal(value);
  if (!rawDecimalValue.isFinite()) {
    throw new RangeError("A finite decimal value is required for money.");
  }
  const decimalValue = rawDecimalValue.toDecimalPlaces(
    resolvedMaximumFractionDigits,
    rounding,
  );
  const isNegative = decimalValue.isNegative() && !decimalValue.isZero();
  const fixedValue = decimalValue
    .abs()
    .toFixed(resolvedMaximumFractionDigits);
  const [integerPart = "0", fixedFractionPart = ""] = fixedValue.split(".");
  let fractionPart = fixedFractionPart;

  while (
    fractionPart.length > resolvedMinimumFractionDigits &&
    fractionPart.endsWith("0")
  ) {
    fractionPart = fractionPart.slice(0, -1);
  }

  const localizedInteger = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    useGrouping,
  }).format(BigInt(integerPart));
  const localizedNumber =
    fractionPart.length > 0
      ? `${localizedInteger}${localizedDecimalSeparator(locale)}${fractionPart}`
      : localizedInteger;

  // A signed one-unit template supplies locale-specific currency placement,
  // spacing, sign and accounting parentheses without converting the real value
  // to Number.
  const templateParts = currencyFormatter.formatToParts(isNegative ? -1 : 1);
  const numericPartTypes = new Set([
    "compact",
    "decimal",
    "exponentInteger",
    "exponentMinusSign",
    "exponentSeparator",
    "fraction",
    "group",
    "infinity",
    "integer",
    "nan",
  ]);
  let hasInsertedNumber = false;

  return templateParts
    .map((part) => {
      if (!numericPartTypes.has(part.type)) {
        return part.value;
      }
      if (hasInsertedNumber) {
        return "";
      }
      hasInsertedNumber = true;
      return localizedNumber;
    })
    .join("");
}
