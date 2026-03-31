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
const platform = await tp.system.suggester(["Kickstarter", "Gamefound", "Backerkit", "Indiegogo"], ["Kickstarter", "Gamefound", "Backerkit", "Indiegogo"], false, "Select platform");
const end_date = await tp.system.prompt("Enter end date (YYYY-MM-DD)", tp.date.now("YYYY-MM-DD"));

const statusOptions = tp.date.now("YYYY-MM-DD") > end_date
    ? ["funded", "cancelled"]
    : ["ongoing", "funded", "cancelled"];

const status = (await tp.system.suggester(
    statusOptions,
    statusOptions,
    false,
    "Select campaign status"
)) ?? statusOptions[0];

const pledged = status === "cancelled"
    ? false
    : ((await tp.system.suggester(["false", "true"], [false, true], false, "Pledged?")) ?? false);
const currency = await tp.system.suggester(["USD", "EUR", "GBP", "CZK"], ["USD", "EUR", "GBP", "CZK"], false, "Select currency");
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
const delivery_date = await tp.system.prompt("Enter expected delivery date (YYYY-MM-DD)", end_date);
const year = String(end_date).slice(0, 4);
const note_title = `${title} (${platform} - ${year})`;
_%>

---
tags:
  - crowdfund-campaign
title: "<% title %>"
category: "<% category %>"
publisher: "<% publisher %>"
platform: "<% platform %>"
end_date: "<% end_date %>"
status: "<% status %>"
pledged: <% pledged %>
currency: "<% currency %>"
pledge_total: <% pledge_total %>
pledge_total_czk: <% pledge_total_czk %>
stretch_pay: <% stretch_pay %>
installments: <% installments %>
installment_total: <% installment_total %>
installment_total_czk: <% installment_total_czk %>
final_payment_date: "<% final_payment_date %>"
paid: <% paid %>
delivery_date: <% delivery_date %>
arrived: false
---
# <% note_title %>

## Campaign Status
```meta-bind-button
style: primary
label: Update Status
actions:
  - type: runTemplaterFile
    templateFile: "5 - The Industrial Zone/Templates/sub-templates/crowdfunding-campaign-status.md"
```

## Pledge Breakdown
```meta-bind-button
style: primary
label: Update Pledge
actions:
  - type: runTemplaterFile
    templateFile: "5 - The Industrial Zone/Templates/sub-templates/crowdfunding-campaign-pledge.md"
```
<%*
tp.hooks.on_all_templates_executed(async () => {
    await tp.file.rename(note_title);

    window.setTimeout(async () => {
        const file = tp.file.find_tfile(note_title);
        const leaf = tp.app.workspace.getMostRecentLeaf();

        if (file && leaf) {
            await leaf.openFile(file, { state: { mode: "preview" } });
        }
    }, 100);
});
_%>
