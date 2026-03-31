const normalize = require("../utils/normalize_value.js");
const convertCurrencyToCzk = require("../utils/currency_convert_to_czk.js");

/**
 * Extract the YYYY-MM month key from a YYYY-MM-DD date string.
 */
function getMonthKey(dateString) {
    return dateString.slice(0, 7);
}

/**
 * Convert a YYYY-MM month key into a human-readable label.
 * Example: 2025-01 -> Jan 2025
 */
function formatMonthLabel(monthKey) {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);

    return date.toLocaleString("en", {
        month: "short",
        year: "numeric",
    });
}

/**
 * Shift a YYYY-MM month key forward by the given number of months.
 */
function addMonths(monthKey, count) {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1 + count, 1);

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
    ].join("-");
}

/**
 * Build an inclusive list of month keys between two YYYY-MM values.
 */
function getMonthsInRange(startMonthKey, endMonthKey) {
    const months = [];
    let current = startMonthKey;

    while (current <= endMonthKey) {
        months.push(current);
        current = addMonths(current, 1);
    }

    return months;
}

/**
 * Create an empty totals object for one month.
 * Every configured currency starts at 0.
 */
function initializeMonthTotals(currencies) {
    const totals = {};

    for (const currency of currencies) {
        totals[currency] = 0;
    }

    return totals;
}

/**
 * Build a readable page label for debugging.
 */
function getPageLabel(page) {
    return page?.file?.path ?? page?.file?.name ?? "(unknown page)";
}

/**
 * Convert a Dataview page into the minimal campaign data needed
 * for payment-schedule calculations.
 *
 * Invalid or non-pledged campaigns are excluded by returning null.
 */
function normalizeCampaign(page, currencies, debug = false) {
    const currency = normalize.toCurrency(page.currency);
    const pledged = normalize.toBoolean(page.pledged);
    const stretchPay = normalize.toBoolean(page.stretch_pay);
    const endDate = normalize.toIsoDate(page.end_date);
    const finalPaymentDate = normalize.toIsoDate(page.final_payment_date);

    if (!pledged || !endDate || !currency || !currencies.includes(currency)) {
        if (debug) {
            console.log("[crowdfunding schedule] excluded page", {
                page: getPageLabel(page),
                raw: {
                    pledged: page.pledged,
                    currency: page.currency,
                    stretch_pay: page.stretch_pay,
                    end_date: page.end_date,
                    final_payment_date: page.final_payment_date,
                    pledge_total: page.pledge_total,
                    installment_total: page.installment_total,
                },
                normalized: {
                    pledged,
                    currency,
                    stretchPay,
                    endDate,
                    finalPaymentDate,
                },
            });
        }

        return null;
    }

    const campaign = {
        currency,
        stretchPay,
        endDate,
        finalPaymentDate: finalPaymentDate || endDate,
        pledgeTotal: normalize.toNumber(page.pledge_total),
        installmentTotal: normalize.toNumber(page.installment_total),
    };

    if (debug) {
        console.log("[crowdfunding schedule] included campaign", {
            page: getPageLabel(page),
            campaign,
        });
    }

    return campaign;
}

/**
 * Expand one campaign into one or more monthly payment entries.
 *
 * - Standard pledge: one payment in the end-date month
 * - Stretch pay: one payment per month from end_date through final_payment_date
 */
function expandCampaignPayments(campaign) {
    if (!campaign.stretchPay) {
        return [
            {
                monthKey: getMonthKey(campaign.endDate),
                currency: campaign.currency,
                amount: campaign.pledgeTotal,
            },
        ];
    }

    const startMonthKey = getMonthKey(campaign.endDate);
    const endMonthKey = getMonthKey(campaign.finalPaymentDate);
    const monthKeys = getMonthsInRange(startMonthKey, endMonthKey);

    return monthKeys.map((monthKey) => ({
        monthKey,
        currency: campaign.currency,
        amount: campaign.installmentTotal,
    }));
}

/**
 * Sum all payment entries into monthly currency totals.
 */
function aggregatePaymentsByMonth(entries, currencies) {
    const months = new Map();

    for (const entry of entries) {
        if (!months.has(entry.monthKey)) {
            months.set(entry.monthKey, initializeMonthTotals(currencies));
        }

        const monthTotals = months.get(entry.monthKey);
        monthTotals[entry.currency] += entry.amount;
    }

    return months;
}

/**
 * Convert the internal month map into row objects ready for rendering.
 */
function buildRows(monthMap, currencies) {
    return Array.from(monthMap.entries())
        .sort(([leftMonthKey], [rightMonthKey]) => leftMonthKey.localeCompare(rightMonthKey))
        .map(([monthKey, totals]) => {
            const row = {
                monthKey,
                monthLabel: formatMonthLabel(monthKey),
            };

            for (const currency of currencies) {
                row[currency] = totals[currency] ?? 0;
            }

            return row;
        });
}

/**
 * Recalculate one month's grand total in CZK from the summed currency columns.
 *
 * This intentionally does not use stored *_czk note fields.
 * Instead it converts the already-aggregated monthly currency totals so the
 * result reflects the freshest cached exchange rates.
 */
async function calculateRowTotalCzk(adapter, row, currencies) {
    let totalCzk = 0;

    for (const currency of currencies) {
        const amount = normalize.toNumber(row[currency]);

        if (amount === 0) {
            continue;
        }

        if (currency === "CZK") {
            totalCzk += amount;
            continue;
        }

        totalCzk += normalize.toNumber(
            await convertCurrencyToCzk(adapter, currency, amount)
        );
    }

    return parseFloat(totalCzk.toFixed(2));
}

/**
 * Add a recalculated CZK grand total to every monthly row.
 */
async function appendRowTotalsInCzk(app, rows, currencies) {
    const adapter = app?.vault?.adapter;

    if (!adapter) {
        throw new Error("A vault adapter is required to calculate CZK totals.");
    }

    const rowsWithTotals = [];

    for (const row of rows) {
        rowsWithTotals.push({
            ...row,
            totalCzk: await calculateRowTotalCzk(adapter, row, currencies),
        });
    }

    return rowsWithTotals;
}

/**
 * Build the payment-schedule model for all crowdfunding campaigns.
 *
 * This stage:
 * - normalizes campaign data
 * - expands monthly payments
 * - aggregates totals by month and currency
 * - recalculates monthly CZK totals from summed currency amounts
 * - splits results into upcoming and history tables
 */
module.exports = async function crowdfunding_campaign_payment_schedule(app, pages, options = {}) {
    const debug = options.debug === true;
    const currencies = Array.isArray(options.currencies) && options.currencies.length > 0
        ? options.currencies.map((currency) => normalize.toCurrency(currency))
        : ["USD", "EUR", "GBP", "CZK"];

    const currentMonthKey = new Date().toISOString().slice(0, 7);

    if (debug) {
        console.log("[crowdfunding schedule] start", {
            pages: pages.length,
            currencies,
            currentMonthKey,
        });
    }

    // Normalize and filter the Dataview pages into usable campaign objects.
    const campaigns = pages
        .map((page) => normalizeCampaign(page, currencies, debug))
        .filter(Boolean);

    if (debug) {
        console.log("[crowdfunding schedule] campaigns", campaigns);
    }

    // Expand each campaign into its monthly payment entries.
    const paymentEntries = campaigns.flatMap(expandCampaignPayments);

    if (debug) {
        console.log("[crowdfunding schedule] paymentEntries", paymentEntries);
    }

    // Aggregate all entries into month-by-month currency totals.
    const aggregatedMonths = aggregatePaymentsByMonth(paymentEntries, currencies);

    if (debug) {
        console.log("[crowdfunding schedule] aggregatedMonths", Array.from(aggregatedMonths.entries()));
    }

    // Convert the month map into plain row objects for later rendering.
    const allRows = buildRows(aggregatedMonths, currencies);

    if (debug) {
        console.log("[crowdfunding schedule] allRows", allRows);
    }

    // Recalculate the monthly grand total in CZK from the summed currency columns.
    const rowsWithCzkTotals = await appendRowTotalsInCzk(app, allRows, currencies);

    if (debug) {
        console.log("[crowdfunding schedule] rowsWithCzkTotals", rowsWithCzkTotals);
    }

    // Upcoming rows start at the current month and move forward.
    const upcomingRows = rowsWithCzkTotals.filter((row) => row.monthKey >= currentMonthKey);

    // History rows include older months and are shown newest-first.
    const historyRows = rowsWithCzkTotals
        .filter((row) => row.monthKey < currentMonthKey)
        .sort((left, right) => right.monthKey.localeCompare(left.monthKey));

    if (debug) {
        console.log("[crowdfunding schedule] finalSplit", {
            upcomingRows,
            historyRows,
        });
    }

    return {
        upcomingRows,
        historyRows,
    };
};

