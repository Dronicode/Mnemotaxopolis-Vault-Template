<%*
async function promptFrontmatterValue(tp, property, label) {
    const suggestions = tp.app.metadataCache.getFrontmatterPropertyValuesForKey(property) ?? [];

    if (suggestions.length === 0) {
        return (await tp.system.prompt(`Enter ${label}`)) ?? "";
    }

    const choice = await tp.system.suggester(
        [...suggestions, "Custom..."],
        [...suggestions, "__custom__"],
        false,
        `Select ${label}`
    );

    if (choice === "__custom__") {
        return (await tp.system.prompt(`Enter ${label}`)) ?? "";
    }

    return choice ?? "";
}

const title = await tp.system.prompt("Enter title", tp.file.title) ?? tp.file.title;
const category = await promptFrontmatterValue(tp, "category", "category");
const publisher = await promptFrontmatterValue(tp, "publisher", "publisher");
const end_date = await tp.system.prompt("Enter end date (YYYY-MM-DD)", tp.date.now("YYYY-MM-DD"));
const platform = await tp.system.suggester(["Kickstarter", "Gamefound", "Backerkit", "Indiegogo"], ["Kickstarter", "Gamefound", "Backerkit", "Indiegogo"], false, "Select platform");
const currency = await tp.system.suggester(["USD", "EUR", "GBP", "CZK"], ["USD", "EUR", "GBP", "CZK"], false, "Select currency");
const pledged = (await tp.system.suggester(["false", "true"], [false, true], false, "Pledged?")) ?? false;

const pledge_total = 0;
const pledge_total_czk = 0;

const stretch_pay = false;
const installments = 1;
const installment_total = 0;
const installment_total_czk = 0;
const final_payment_date = end_date;

let paid = false;
if (pledged && tp.date.now("YYYY-MM-DD") >= final_payment_date) {
    paid = (await tp.system.suggester(["false", "true"], [false, true], false, "Paid?")) ?? false;
}
const arrival_date = await tp.system.prompt("Enter expected arrival date (YYYY-MM-DD)", tp.date.now("YYYY-MM-DD"));
const start_year = String(end_date).slice(0, 4);
const note_title = `${title} (${platform} - ${start_year})`;
_%>

---
tags:
  - crowdfund-campaign
title: "<% title %>"
category: "<% category %>"
publisher: "<% publisher %>"
end_date: "<% end_date %>"
platform: "<% platform %>"
currency: "<% currency %>"
pledged: <% pledged %>
pledge_total: <% pledge_total %>
pledge_total_czk: <% pledge_total_czk %>
stretch_pay: <% stretch_pay %>
installments: <% installments %>
installment_total: <% installment_total %>
installment_total_czk: <% installment_total_czk %>
final_payment_date: "<% final_payment_date %>"
paid: <% paid %>
arrival_date: <% arrival_date %>
arrived: false
---
# <% note_title %>

## Pledge Breakdown
```meta-bind-button
style: primary
label: Update Pledge
actions:
  - type: runTemplaterFile
    templateFile: "05 - The Administrative Office/The Factory (Templates)/crowdfunding-campaign-pledge.md"
```
<%*
tp.hooks.on_all_templates_executed(async () => {
    await tp.file.rename(note_title);
});
_%>
