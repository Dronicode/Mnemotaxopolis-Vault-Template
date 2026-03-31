const normalize = require("../utils/normalize_value.js");
const convertCurrencyToCzk = require("../utils/currency_convert_to_czk.js");

module.exports = async function crowdfunding_campaign_stretch_pay(tp, pledged) {
    const app = tp.app;
    const file = tp.config.target_file;
    const adapter = app.vault.adapter;

    let stretch_pay;
    if (pledged) {
        stretch_pay = (await tp.system.suggester(["false", "true"], [false, true], false, "Stretch pay?")) ?? false;
    } else {
        stretch_pay = false;
    }

    let installments;
    let installment_total;
    let installment_total_czk;
    let final_payment_date;
    const end_date = tp.frontmatter.end_date;
    const currency = String(tp.frontmatter.currency ?? "CZK").trim().toUpperCase();

    if (stretch_pay) {
        installments = normalize.toInteger(
            await tp.system.prompt("Enter number of installments (numeric value):", String(tp.frontmatter.installments ?? 1))
        );

        installment_total = normalize.toNumber(
            await tp.system.prompt(
                "Enter installment total:",
                (tp.frontmatter.installment_total ?? tp.frontmatter.pledge_total ?? 0) === 0
                    ? ""
                    : String(tp.frontmatter.installment_total ?? tp.frontmatter.pledge_total ?? 0)
            )
        );

        installment_total_czk = parseFloat(await convertCurrencyToCzk(adapter, currency, installment_total));

        const monthOffset = `P${installments - 1}M`;
        final_payment_date = tp.date.now("YYYY-MM-DD", monthOffset, end_date);
    } else {
        installments = 1;
        installment_total = 0;
        installment_total_czk = 0;
        final_payment_date = end_date;
    }

    await app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter.stretch_pay = stretch_pay;
        frontmatter.installments = installments;
        frontmatter.installment_total = parseFloat(installment_total.toFixed(2));
        frontmatter.installment_total_czk = parseFloat(installment_total_czk.toFixed(2));
        frontmatter.final_payment_date = final_payment_date;
    });
};
