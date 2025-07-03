module.exports = async (tp, args = {}) => {
  console.log("it works this much..");
  // Note tier selection
  const annotationType = await tp.system.suggester(
    ["book", "volume"],
    ["book", "volume"],
    "Is this note for a book or a whole volume?"
  );

  // Get user input
  const input = {};

  // Get volume
  input.volume = args.volume ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books"));
  input.volumeShort = await tp.user["prompt-from-dict"](tp, "volumes-shortened", input.volume);

  // Get book
  if (annotationType === "book") {
    input.book = args.book ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books", input.volume));
  }

  let tags = [];

  // Add hierarchy tag
  let hierarchyTag = ["scripture", input.volume];
  if (annotationType !== "volume") {
    if (input.book === "D&C") {
      hierarchyTag.push("sections");
    } else {
      hierarchyTag.push(input.book);
    }
  }
  tags.push(hierarchyTag.filter(Boolean).join("/"));

  tags = tags.map((t) =>
    t
      .toLowerCase()
      .split("/")
      .map((part) => part.replace(/\s+/g, "_").replace(/[^\w_]/g, ""))
      .join("/")
  );

  // build filename
  let filename;
  if (annotationType == "volume") {
    filename = input.volume;
  }
  if (annotationType == "book") {
    if (input.book === "D&C") {
      filename = input.volumeShort + " - Sections";
    } else {
      filename = input.volumeShort + " - " + input.book;
    }
  }

  // Check for parent notes
  let volumeField, bookField, parentNoteName;
  if (annotationType === "volume") {
    parentNoteName = `MoC ${input.volume}`;
    volumeField = `[[${parentNoteName}]]`;
  } else {
    parentNoteName = `${input.volumeShort} - ${input.book}`;
    volumeField = `[[${input.volume}]]`;
    bookField = input.book;
  }

  // TODO add creation of parent notes
  parentNote = await tp.file.find_tfile(parentNoteName);

  if (parentNote) {
    // Parent note exists, you can use parentNote.path, etc.
    // For example:
    console.log(`Parent note found: ${parentNote.path}`);
  } else {
    // Parent note does not exist
    console.log("Parent note not found.");
  }

  // Build frontmatter and body
  const frontmatter = `---
    note_type: literature_note
    volume: "${volumeField}"
    ${input.book ? `book: "${bookField}"\n` : ""}
    ${tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]\n` : ""}
---
    `;
  const body = "";

  await tp.user["create-note-with-frontmatter"]({ filename, frontmatter, body });
};
