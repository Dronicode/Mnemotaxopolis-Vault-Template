async function collectInputs(tp, args) {
  const input = {};

  switch (args.childTier) {
    case "volume":
      input.noteTier = "volume";
      break;
    case "book":
      input.noteTier = args.childType === "studynote" ? "book" : "volume";
      break;
    case "chapter":
    case "verse":
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
  switch (input.noteTier) {
    case "chapter":
    case "book":
    case "volume":
      input.volume = args.volume ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books"));
      input.volumeShort = await tp.user["prompt-from-dict"](tp, "volumes-shortened", input.volume);
      if (input.noteTier === "volume") break;

      input.book = args.book ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books", input.volume));
      if (input.noteTier === "book") break;

      if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book))
        if (input.noteTier === "chapter") {
          input.noteTier = "book";
          break;
        } else input.chapter = 1;
      else if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        input.chapter = args.chapter ?? (await tp.user["prompt-from-dict"](tp, "named-chapters", input.book));
      } else {
        do {
          if (/^\d+$/.test(args.chapter)) input.chapter = args.chapter;
          else if (input.volumeShort === "D&C") input.chapter = await tp.system.prompt("Section number");
          else input.chapter = await tp.system.prompt("Chapter number");
        } while (!input.chapter || !/^\d+$/.test(input.chapter));
      }
  }
  return input;
}

function addHierarchyTag(input) {
  let hierarchyTag = ["scripture", input.volume];
  if (input.noteTier !== "volume") {
    if (input.book === "D&C") hierarchyTag.push("DandC");
    else hierarchyTag.push(input.book);
    if (input.noteTier === "chapter") hierarchyTag.push(input.chapter);
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

async function buildFilename(tp, input) {
  switch (input.noteTier) {
    case "volume":
      return input.volume;
    case "book":
      if (input.book === "D&C") return `${input.volumeShort} - Sections`;
      else {
        return `${input.volumeShort} - ${input.book}`;
      }
    case "chapter":
      if (input.book === "D&C") return `${input.volumeShort} - Section ${input.chapter}`;
      if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        return `${input.volumeShort} - ${input.chapter}`;
      } else return `${input.volumeShort} - ${input.book} ${input.chapter}`;
  }
}

function getParentNoteName(input) {
  if (input.noteTier === "volume") return `MoC ${input.volume}`;
  else if (input.noteTier === "book") return input.volume;
  else if (input.book === "D&C") return `${input.volumeShort} - Sections`;
  else if (input.noteTier === "chapter") return `${input.volumeShort} - ${input.book}`;
}

function buildFrontmatter(input, tags, noteType, parentNoteName) {
  let volume = input.volume ?? "";
  let book = input.book ?? "";
  const chapter = input.chapter ?? "";

  if (input.noteTier === "chapter") book = `[[${parentNoteName}|${input.book}]]`;
  else volume = `[[${parentNoteName}]]`;

  const frontmatterLines = [
    "---",
    `note_type: "${noteType}"`,
    `volume: "${volume}"`,
    book ? `book: "${book}"` : null,
    chapter ? `chapter: "${chapter}"` : null,
    tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]` : null,
    "---",
  ];

  return frontmatterLines.filter(Boolean).join("\n");
}

async function createParentNote(tp, parentNoteName, input, noteType) {
  const parentNoteExists = await tp.file.find_tfile(parentNoteName);
  if (parentNoteExists) console.log(`Parent note found: ${parentNoteExists.path}`);
  else {
    await tp.user["new-literaturenote-scripture"](tp, {
      childType: noteType,
      childTier: input.noteTier,
      volume: input.volume,
      book: input.book,
      chapter: input.chapter,
    });
  }
}

module.exports = async (tp, args = {}) => {
  const noteType = "literature";
  const input = await collectInputs(tp, args);
  const tags = addHierarchyTag(input);
  const filename = await buildFilename(tp, input);
  const parentNoteName = getParentNoteName(input);
  const frontmatter = buildFrontmatter(input, tags, noteType, parentNoteName);
  const body = args.body ?? "";
  await tp.user["create-note-with-frontmatter"]({ noteType, filename, frontmatter, body });
  await createParentNote(tp, parentNoteName, input, noteType);
};
