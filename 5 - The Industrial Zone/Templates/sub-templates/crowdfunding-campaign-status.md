<%*
const file = tp.config.target_file;
const end_date = String(tp.frontmatter.end_date ?? "").trim();
const today = tp.date.now("YYYY-MM-DD");

const statusOptions = today > end_date
    ? ["funded", "cancelled"]
    : ["ongoing", "funded", "cancelled"];

const status = (await tp.system.suggester(
    statusOptions,
    statusOptions,
    false,
    "Select campaign status"
)) ?? (tp.frontmatter.status ?? statusOptions[0]);

await tp.app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.status = status;
    if (status === "cancelled") {
        frontmatter.pledged = false;
        frontmatter.paid = false;
        frontmatter.arrived = false;
    }
});

if (status === "cancelled") {
    await tp.user["crowdfunding_campaign_table"](tp, false);
    await tp.user["crowdfunding_campaign_stretch_pay"](tp, false);
}

tR = "";
%>
