module.exports = async (args) => {
  let folder = "02 - Urban Districts (Content)/02.2 - The Transit Hub (Temporary)/";
  switch (args.noteType) {
    case "literature":
      folder =
        "02 - Urban Districts (Content)/02.1 - Neighborhoods (Permanent)/02.1.3 - The Agora (Collective Interior)/";
      break;
    case "studynote":
      folder =
        "02 - Urban Districts (Content)/02.1 - Neighborhoods (Permanent)/02.1.1 - The College Campus (Individual Interior)/";
      break;
  }

  if (folder) {
    try {
      await app.vault.createFolder(folder);
    } catch (e) {}
  }
  console.log(`creating ${folder}${args.filename}.md`);
  await app.vault.create(`${folder}${args.filename}.md`, `${args.frontmatter}\n${args.body ?? ""}`);
  return `${folder}${args.filename}.md`;
};
