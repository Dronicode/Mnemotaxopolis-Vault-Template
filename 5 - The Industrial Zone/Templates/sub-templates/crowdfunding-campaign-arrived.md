<%*
const file = tp.config.target_file;
const paid = tp.frontmatter.paid === true;
const arrived = tp.frontmatter.arrived === true;

if (!paid) {
    tR = "";
    return;
}

await tp.app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.arrived = !arrived;
});

tR = "";
%>
