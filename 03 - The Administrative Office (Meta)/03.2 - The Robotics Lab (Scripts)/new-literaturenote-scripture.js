async function collectInputs(tp, args) {
  console.log("starting: collectInputs");
  const input = {};

  switch (args.childTier) {
    case "volume":
      input.noteTier = "volume";
      break;
    case "book":
      input.noteTier = args.childType === "studynote" ? "book" : "volume";
      break;
    case "chapter":
      input.noteTier = args.childType === "studynote" ? "chapter" : "book";
      break;
    default:
      input.noteTier = await tp.system.suggester(
        ["chapter", "book", "volume"],
        ["chapter", "book", "volume"],
        "Is this note for a specific chapter, book, or a whole volume?"
      );
      break;
  }

  input.volume = args.volume ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books"));
  input.volumeShort = await tp.user["prompt-from-dict"](tp, "volumes-shortened", input.volume);
  if (input.noteTier === "book") {
    input.book = args.book ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books", input.volume));
  }
  if (input.noteTier === "chapter") {
    input.chapter = args.chapter ?? (await tp.user["prompt-from-dict"](tp, "named-chapters", input.book));
  }
  if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
    input.chapter = args.chapter ?? (await tp.user["prompt-from-dict"](tp, "named-chapters", input.book));
  } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
    // Do nothing; Books with paragraphs have no chapters.
  } else {
    do {
      if (!/^\d+$/.test(args.chapter)) input.chapter = args.chapter;
      else if (input.volumeShort === "D&C") input.chapter = await tp.system.prompt("Section number");
      else input.chapter = await tp.system.prompt("Chapter number");
    } while (!input.chapter || !/^\d+$/.test(input.chapter));
  }
  return input;
}

function addHierarchyTag(input) {
  console.log("starting: addHierarchyTag");
  let hierarchyTag = ["scripture", input.volume];
  if (input.noteTier !== "volume") {
    if (input.book === "D&C") hierarchyTag.push("DandC");
    else hierarchyTag.push(input.book);
  }
  if (input.noteTier === "chapter" || input.noteTier === "verse") hierarchyTag.push(input.chapter);

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
  console.log("starting: buildFilename");
  if (input.noteTier == "volume") return input.volume;
  if (input.noteTier == "book") {
    if (input.book === "D&C") return input.volumeShort + " - Sections";
    else return input.volumeShort + " - " + input.book;
  }
  if (input.noteTier == "book") return `${input.volumeShort} - ${input.chapter}`;
}

// console.log("parents -> literature(volume) -> moc volume");
// console.log("parents -> literature(book) -> literature(volume) -> moc volume");
// console.log("parents -> literature(chapter) -> literature(book) -> literature(volume) -> moc volume");
// console.log("parents -> literature(book) -> literature(volume) -> moc volume");

async function resolveParentNote(tp, input) {
  console.log("starting: resolveParentNote");
  if (input.noteTier === "volume") {
    parentNoteName = `MoC ${input.volume}`;
    input.volume = `[[${parentNoteName}]]`;
  } else {
    parentNoteName = input.volume;
    input.volume = `[[${input.volume}]]`;
    input.book = input.book;
  }

  console.log(`Searching for: ${parentNoteName}`);
  parentNote = await tp.file.find_tfile(parentNoteName);
  if (parentNote) {
    console.log(`Parent note found: ${parentNote.path}`);
  } else {
    console.log(`Parent note not found.: ${parentNoteName}\nCreating parent note.`);

    await tp.user["new-literaturenote-scripture"](tp, { volume: input.volume });
  }
}

function buildFrontmatter(input, tags) {
  console.log("starting: buildFrontmatter");
  if (input.noteTier === "volume") {
    parentNoteName = `MoC ${input.volume}`;
    input.volume = `[[${frontmatterFields.parentNoteName}]]`;
  } else {
    parentNoteName = input.volume;
    input.volume = `[[${input.volume}]]`;
    input.book = input.book;
  }

  return `---
  note_type: "${noteType}"
  volume: "${input.volume}"
  ${input.book ? `book: "${input.book}"\n` : ""}
  ${tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]\n` : ""}
---
`;
}

module.exports = async (tp, args = {}) => {
  console.log("starting: new-literaturenote-scripture with args:", args);
  const noteType = "literaturenote";
  const input = await collectInputs(tp, args);
  const tags = addHierarchyTag(input);
  const filename = buildFilename(input);
  const frontmatterFields = await resolveParentNote(tp, input, noteType);
  const frontmatter = buildFrontmatter(input, tags, noteType, frontmatterFields);

  const body = args.body ?? "";

  await tp.user["create-note-with-frontmatter"]({ filename, frontmatter, body });
};
