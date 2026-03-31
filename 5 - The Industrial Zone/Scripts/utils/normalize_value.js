/**
 * Normalize any input into trimmed text.
 * Nullish values become an empty string.
 */
function toText(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}

/**
 * Normalize any input into a floating-point number.
 * Empty or invalid values become 0.
 */
function toNumber(value) {
    const normalized = toText(value);
    if (normalized === "") {
        return 0;
    }

    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Normalize any input into an integer.
 * Empty or invalid values become 0.
 */
function toInteger(value) {
    const normalized = toText(value);
    if (normalized === "") {
        return 0;
    }

    const parsed = parseInt(normalized, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Normalize any input into a boolean.
 * Supports booleans and common string/number equivalents.
 * Invalid values become false.
 */
function toBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }

    const normalized = toText(value).toLowerCase();
    if (normalized === "true" || normalized === "1") {
        return true;
    }

    if (normalized === "false" || normalized === "0") {
        return false;
    }

    return false;
}

/**
 * Normalize a currency code into uppercase text.
 * Invalid or empty values become an empty string.
 */
function toCurrency(value) {
    return toText(value).toUpperCase();
}

/**
 * Normalize a date into YYYY-MM-DD form.
 * Invalid values become an empty string.
 */
function toIsoDate(value) {
    if (value && typeof value.toISODate === "function") {
        return value.toISODate() ?? "";
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    const normalized = toText(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

/**
 * Default export keeps the original simple text-normalization behavior.
 */
function normalize_value(value) {
    return toText(value);
}

normalize_value.toText = toText;
normalize_value.toNumber = toNumber;
normalize_value.toInteger = toInteger;
normalize_value.toBoolean = toBoolean;
normalize_value.toCurrency = toCurrency;
normalize_value.toIsoDate = toIsoDate;

module.exports = normalize_value;

