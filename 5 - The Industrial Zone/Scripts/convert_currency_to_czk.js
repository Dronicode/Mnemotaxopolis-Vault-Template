const CACHE_FILE = "05 - The Industrial Zone/Scripts/cache/currency_rates_to_czk.json";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

let memoryCache = null;

function normalizeCurrency(currency) {
    return String(currency ?? "").trim().toUpperCase();
}

function normalizeValue(value) {
    const numericValue = parseFloat(String(value ?? "0").trim());

    if (Number.isNaN(numericValue)) {
        throw new Error(`Invalid numeric value for conversion: ${value}`);
    }

    return numericValue;
}

async function createCacheFile(adapter) {
    const directory = CACHE_FILE.slice(0, CACHE_FILE.lastIndexOf("/"));
    const cache = { rates: {} };

    if (directory && !(await adapter.exists(directory))) {
        await adapter.mkdir(directory);
    }

    await adapter.write(CACHE_FILE, JSON.stringify(cache, null, 2));
    memoryCache = cache;

    return cache;
}

function isFresh(entry) {
    if (!entry || typeof entry.rate !== "number" || typeof entry.fetchedAt !== "string") {
        return false;
    }

    const fetchedAtMs = Date.parse(entry.fetchedAt);
    if (Number.isNaN(fetchedAtMs)) {
        return false;
    }

    return Date.now() - fetchedAtMs < CACHE_TTL_MS;
}

async function loadCache(adapter) {
    if (memoryCache) {
        return memoryCache;
    }

    if (!(await adapter.exists(CACHE_FILE))) {
        return await createCacheFile(adapter);
    }

    try {
        const raw = await adapter.read(CACHE_FILE);
        const parsed = JSON.parse(raw);

        if (!parsed || typeof parsed !== "object" || typeof parsed.rates !== "object") {
            return await createCacheFile(adapter);
        }

        memoryCache = parsed;
        return memoryCache;
    } catch (_) {
        return await createCacheFile(adapter);
    }
}

async function saveCache(adapter, cache) {
    memoryCache = cache;
    await adapter.write(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function fetchRateFromApi(currency) {
    const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(currency)}&to=CZK`;

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

    const rate = response?.json?.rates?.CZK;

    if (typeof rate !== "number") {
        throw new Error(`No CZK exchange rate returned for currency: ${currency}`);
    }

    return rate;
}

async function getRate(adapter, currency) {
    const cache = await loadCache(adapter);
    const cachedEntry = cache.rates[currency];

    if (isFresh(cachedEntry)) {
        return cachedEntry.rate;
    }

    const rate = await fetchRateFromApi(currency);

    cache.rates[currency] = {
        rate,
        fetchedAt: new Date().toISOString(),
    };

    await saveCache(adapter, cache);

    return rate;
}

module.exports = async function convert_currency_to_czk(tp, currency, value) {
    const normalizedCurrency = normalizeCurrency(currency);
    const numericValue = normalizeValue(value);

    if (!normalizedCurrency) {
        throw new Error("Currency is required for conversion.");
    }

    if (normalizedCurrency === "CZK") {
        return numericValue.toFixed(2);
    }

    const adapter = tp.app.vault.adapter;
    const rate = await getRate(adapter, normalizedCurrency);

    return (numericValue * rate).toFixed(2);
};

