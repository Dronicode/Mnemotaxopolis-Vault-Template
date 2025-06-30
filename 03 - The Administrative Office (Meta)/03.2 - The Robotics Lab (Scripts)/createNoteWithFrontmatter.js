module.exports = async (args) => {
  await app.vault.create(`${args.filename}.md`, `${args.frontmatter}\n${args.body ?? ""}`);
  return `Note created: [[${args.filename}]]`;
};
