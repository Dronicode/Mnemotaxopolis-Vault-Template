async function collectInputs(tp, args) {
  const input = {};
  if (Object.keys(args).length === 0) {
    input.annotationType = await tp.system.suggester(
      ["book", "volume"],
      ["book", "volume"],
      "Is this note for a book or a whole volume?"
    );
  } else if (args.book) input.annotationType = "book";
  else input.annotationType = "volume";

  // Get volume
  input.volume = args.volume ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books"));
  input.volumeShort = await tp.user["prompt-from-dict"](tp, "volumes-shortened", input.volume);

  // Get book
  if (input.annotationType === "book") {
    input.book = args.book ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books", input.volume));
  }
  return input;
}

function addHierarchyTag(input) {
  let hierarchyTag = ["scripture", input.volume];
  if (input.annotationType !== "volume") {
    if (input.book === "D&C") hierarchyTag.push("sections");
    else hierarchyTag.push(input.book);
  }

  return [
    hierarchyTag
      .filter(Boolean)
      .map((t) =>
        t
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^\w_]/g, "")
      )
      .join("/"),
  ];
}

function buildFilename(input) {
  if (input.annotationType == "volume") return input.volume;
  if (input.annotationType == "book") {
    if (input.book === "D&C") return input.volumeShort + " - Sections";
    else return input.volumeShort + " - " + input.book;
  }
}

async function resolveParentNote(tp, input) {
  const frontmatterFields = {};
  if (input.annotationType === "volume") {
    frontmatterFields.parentNoteName = `MoC ${input.volume}`;
    frontmatterFields.volumeField = `[[${frontmatterFields.parentNoteName}]]`;
  } else {
    frontmatterFields.parentNoteName = input.volume;
    frontmatterFields.volumeField = `[[${input.volume}]]`;
    frontmatterFields.bookField = input.book;
  }

  console.log(`Searching for: ${frontmatterFields.parentNoteName}`);
  parentNote = await tp.file.find_tfile(frontmatterFields.parentNoteName);
  if (parentNote) {
    console.log(`Parent note found: ${parentNote.path}`);
  } else {
    console.log(`Parent note not found.: ${frontmatterFields.parentNoteName}\nCreating parent note.`);

    await tp.user["new-literaturenote-scripture"](tp, { volume: input.volume });
  }
  return frontmatterFields;
}

function buildFrontmatter(input, tags, frontmatterFields) {
  return `---
  note_type: literature_note
  volume: "${frontmatterFields.volumeField}"
  ${input.book ? `book: "${frontmatterFields.bookField}"\n` : ""}
  ${tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]\n` : ""}
---
`;
}

module.exports = async (tp, args = {}) => {
  const input = await collectInputs(tp, args);
  const tags = addHierarchyTag(input);
  const filename = buildFilename(input);
  const frontmatterFields = await resolveParentNote(tp, input);
  const frontmatter = buildFrontmatter(input, tags, frontmatterFields);

  const body = args.body ?? "";

  await tp.user["create-note-with-frontmatter"]({ filename, frontmatter, body });
};
