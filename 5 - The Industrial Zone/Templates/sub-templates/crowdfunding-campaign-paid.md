<%*
const file = tp.config.target_file;
const today = tp.date.now("YYYY-MM-DD");
const status = String(tp.frontmatter.status ?? "").trim().toLowerCase();
const end_date = String(tp.frontmatter.end_date ?? "").trim();
const pledged = tp.frontmatter.pledged === true;
const paid = tp.frontmatter.paid === true;

if (!pledged || status !== "funded" || today <= end_date) {
    tR = "";
    return;
}

await tp.app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.paid = !paid;

    if (paid) {
        frontmatter.arrived = false;
    }
});

tR = "";
%>
