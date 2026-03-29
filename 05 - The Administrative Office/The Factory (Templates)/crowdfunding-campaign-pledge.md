<%*
const file = tp.config.target_file;
const status = String(tp.frontmatter.status ?? "").trim().toLowerCase();

const pledged = status === "cancelled"
    ? false
    : ((await tp.system.suggester(["false", "true"], [false, true], false, "Pledged?")) ?? false);

await tp.app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.pledged = pledged;
});

await tp.user["crowdfunding_campaign_table"](tp, pledged);
await tp.user["crowdfunding_campaign_stretch_pay"](tp, pledged);

tR = "";
%>
