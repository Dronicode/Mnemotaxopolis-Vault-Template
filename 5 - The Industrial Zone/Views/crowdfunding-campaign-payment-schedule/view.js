const buildPaymentSchedule = require("5 - The Industrial Zone/Scripts/dataview/crowdfunding_campaign_payment_schedule.js");

/**
 * Format a numeric table cell.
 */
function formatAmount(value) {
    const amount = Number(value) || 0;
    return amount === 0 ? '<span class="crowdfunding-zero">0</span>' : amount.toFixed(2);
}

/**
 * Convert schedule row objects into Dataview table rows.
 */
function buildTableRows(rows, currencies) {
    return rows.map((row) => [
        row.monthLabel,
        ...currencies.map((currency) => formatAmount(row[currency])),
        formatAmount(row.totalCzk),
    ]);
}

/**
 * Render one payment-schedule table.
 */
function renderScheduleTable(dv, title, rows, currencies) {
    dv.header(3, title);

    if (rows.length === 0) {
        dv.paragraph("No payments.");
        return;
    }

    dv.table(
        ["Month", ...currencies, "Total CZK"],
        buildTableRows(rows, currencies)
    );
}

const options = input ?? {};
const currencies = Array.isArray(options.currencies) && options.currencies.length > 0
    ? options.currencies
    : ["USD", "EUR", "GBP", "CZK"];

dv.container.classList.add("crowdfunding-payment-schedule");

/*e
 * Load all tagged crowdfunding campaign pages through Dataview.
 */
const pages = dv.pages(options.tag ?? "#crowdfund-campaign").array();

/**
 * Build the shared schedule model.
 */
const schedule = await buildPaymentSchedule(app, pages, {
    currencies,
    debug: false,
});

/**
 * Render upcoming payments in chronological order.
 */
renderScheduleTable(
    dv,
    "Upcoming Payments",
    schedule.upcomingRows,
    currencies
);

/**
 * Render payment history in reverse chronological order,
 * starting from the month closest to the current month.
 */
renderScheduleTable(
    dv,
    "Payment History",
    schedule.historyRows,
    currencies
);
