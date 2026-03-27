module.exports = async function crowdfunding_campaign_table(tp, pledged) {
    const app = tp.app;
    const file = tp.config.target_file;
    let content = await app.vault.read(file);
    const normalize = tp.user["normalize_prompt_output"];
    const currency = String(tp.frontmatter.currency ?? "CZK").trim().toUpperCase();

    if (!pledged) {
        await app.fileManager.processFrontMatter(file, (frontmatter) => {
            frontmatter.pledge_total = 0;
            frontmatter.pledge_total_czk = 0;
        });

        content = await app.vault.read(file);
        content = content.replace(/\| Type\s*\|\s*Name\s*\|\s*Cost\s*\|\s*Cost \(CZK\)\s*\|\s*\r?\n\|[-\s|]+\|\s*\r?\n[\s\S]*?\|\s*\*\*total\*\*\s*\|.*\|/g, "");
        await app.vault.modify(file, content);
        return;
    }

    async function promptRecord(type, defaultName = "", defaultValue = 0, required = false) {
        let name = defaultName;
        if (type !== "VAT/Tax" && type !== "Shipping") {
            do {
                name = normalize.toText(await tp.system.prompt(`Enter name for ${type}:`, defaultName));
                if (!required && name === "") return null;
            } while (required && name === "");
        }

        const promptDefault = defaultValue === 0 ? "" : String(defaultValue);
        const cost = normalize.toNumber(await tp.system.prompt(`Enter cost for ${type}:`, promptDefault));
        const costCzk = normalize.toNumber(await tp.user["convert_currency_to_czk"](tp, currency, cost));

        return { type, name, cost, costCzk };
    }

    const tableRegex = /\| Type\s*\|\s*Name\s*\|\s*Cost\s*\|\s*Cost \(CZK\)\s*\|\s*\r?\n\|[-\s|]+\|\s*\r?\n[\s\S]*?\|\s*\*\*total\*\*\s*\|.*\|/;
    const existingTableMatch = content.match(tableRegex);

    function parseTableRows(tableString) {
        const lines = tableString.split(/\r?\n/);
        const totalLineIndex = lines.findIndex((line) => line.includes("**total**"));
        const bodyLines = totalLineIndex === -1 ? lines.slice(2) : lines.slice(2, totalLineIndex);

        return bodyLines
            .map((line) => line.trim())
            .filter((line) => line.startsWith("|"))
            .map((line) => {
                const cells = line.split("|").map((cell) => cell.trim());
                return {
                    type: cells[1] || "",
                    name: cells[2] || "",
                    cost: parseFloat(cells[3] || "0"),
                    costCzk: parseFloat(cells[4] || "0"),
                };
            });
    }

    const existingRows = existingTableMatch ? parseTableRows(existingTableMatch[0]) : [];

    const existingReward = existingRows.find((row) => row.type === "Reward Tier");
    const existingAddOns = existingRows.filter((row) => row.type.startsWith("Add-on"));
    const existingVAT = existingRows.find((row) => row.type === "VAT/Tax");
    const existingShipping = existingRows.find((row) => row.type === "Shipping");

    const reward = await promptRecord(
        "Reward Tier",
        existingReward ? existingReward.name : "",
        existingReward ? existingReward.cost : 0,
        true
    );

    const addOns = [];
    for (let i = 0; i < existingAddOns.length; i++) {
        const addOnRow = existingAddOns[i];
        const addOn = await promptRecord(`Add-on ${i + 1}`, addOnRow.name, addOnRow.cost);
        if (addOn) {
            addOns.push(addOn);
        }
    }

    let addOnIndex = addOns.length;
    while (true) {
        const addOn = await promptRecord(`Add-on ${addOnIndex + 1}`);
        if (!addOn) break;
        addOns.push(addOn);
        addOnIndex++;
    }

    const vat = await promptRecord("VAT/Tax", "-", existingVAT ? existingVAT.cost : 0, true);
    const shipping = await promptRecord("Shipping", "-", existingShipping ? existingShipping.cost : 0, true);

    const resultingRows = [reward, ...addOns, vat, shipping];

    const total = resultingRows.reduce((sum, row) => sum + row.cost, 0);
    const totalCzk = resultingRows.reduce((sum, row) => sum + row.costCzk, 0);

    await app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter.pledge_total = parseFloat(total.toFixed(2));
        frontmatter.pledge_total_czk = parseFloat(totalCzk.toFixed(2));
    });

    content = await app.vault.read(file);

    const tableMarkdown = `
| Type       | Name       | Cost | Cost (CZK) |
|------------|------------|------|------------|
${resultingRows.map((row) => `| ${row.type} | ${row.name} | ${row.cost.toFixed(2)} | ${row.costCzk.toFixed(2)} |`).join("\n")}
| **total**  |            | ${total.toFixed(2)} | ${totalCzk.toFixed(2)} |
`;

    let newContent;
    if (existingTableMatch) {
        newContent = content.replace(tableRegex, tableMarkdown.trim());
    } else {
        newContent = `${content.trimEnd()}\n\n${tableMarkdown.trim()}\n`;
    }

    await app.vault.modify(file, newContent);
};
