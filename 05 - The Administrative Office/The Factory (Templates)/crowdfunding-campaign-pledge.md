<%*
const app = tp.app;
const file = tp.config.target_file;

const pledged = (await tp.system.suggester(["false", "true"], [false, true], false, "Pledged?")) ?? false;
await app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.pledged = pledged;
});

await tp.user["crowdfunding_campaign_table"](tp, pledged);
await tp.user["crowdfunding_campaign_stretch_pay"](tp, pledged);

tR = "";
%>
