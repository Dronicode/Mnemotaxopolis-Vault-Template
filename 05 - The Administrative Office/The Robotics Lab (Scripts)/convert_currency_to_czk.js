const rateCache = new Map();

module.exports = async function convert_currency_to_czk(tp, currency, value) {
    const normalizedCurrency = String(currency ?? "").trim().toUpperCase();
    const numericValue = parseFloat(String(value ?? "0").trim());

    if (Number.isNaN(numericValue)) {
        throw new Error(`Invalid numeric value for conversion: ${value}`);
    }

    if (normalizedCurrency === "CZK") {
        return numericValue;
    }

    if (!normalizedCurrency) {
        throw new Error("Currency is required for conversion.");
    }

    let rate = rateCache.get(normalizedCurrency);

    if (typeof rate !== "number") {
        const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(normalizedCurrency)}&to=CZK`;

        let response;
        try {
            response = await requestUrl({
                url,
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });
        } catch (error) {
            throw new Error(`Currency conversion request failed: ${error.message}`);
        }

        rate = response?.json?.rates?.CZK;

        if (typeof rate !== "number") {
            throw new Error(`No CZK exchange rate returned for currency: ${normalizedCurrency}`);
        }

        rateCache.set(normalizedCurrency, rate);
    }

    return (numericValue * rate);
};
