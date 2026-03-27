function toText(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}

function toNumber(value) {
    const normalized = toText(value);
    if (normalized === "") {
        return 0;
    }

    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function toInteger(value) {
    const normalized = toText(value);
    if (normalized === "") {
        return 0;
    }

    const parsed = parseInt(normalized, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

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

function normalize_prompt_output(value) {
    return toText(value);
}

normalize_prompt_output.toText = toText;
normalize_prompt_output.toNumber = toNumber;
normalize_prompt_output.toInteger = toInteger;
normalize_prompt_output.toBoolean = toBoolean;

module.exports = normalize_prompt_output;
