async function collectInputs(tp, args) {
  console.log("starting: collectInputs");
  const input = {};

  switch (args.childTier) {
    case "volume":
      input.noteTier = "volume";
      console.log("child tier: ", args.childTier, " --- note tier: ", input.noteTier);
      break;
    case "book":
      input.noteTier = args.childType === "studynote" ? "book" : "volume";
      console.log("child tier: ", args.childTier, " --- note tier: ", input.noteTier);
      break;
    case "chapter":
      input.noteTier = args.childType === "studynote" ? "chapter" : "book";
      console.log("child tier: ", args.childTier, " --- note tier: ", input.noteTier);
      break;
    default:
      input.noteTier = await tp.system.suggester(
        ["chapter", "book", "volume"],
        ["chapter", "book", "volume"],
        "Is this note for a specific chapter, book, or a whole volume?"
      );
      console.log("child tier: ", args.childTier, " --- note tier: ", input.noteTier);
      break;
  }
  switch (input.noteTier) {
    case "chapter":
    case "book":
    case "volume":
      input.volume = args.volume ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books"));
      input.volumeShort = await tp.user["prompt-from-dict"](tp, "volumes-shortened", input.volume);
      console.log("setting volume: ", input.volume);
      if (input.noteTier === "volume") break;

      input.book = args.book ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books", input.volume));
      console.log("setting book: ", input.book);
      if (input.noteTier === "chapter" && (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book))) {
        // Books with paragraphs have no chapters. If the note was for a chapter, set it to book instead.
        input.noteTier = "book";
      }
      if (input.noteTier === "book") break;

      if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        input.chapter = args.chapter ?? (await tp.user["prompt-from-dict"](tp, "named-chapters", input.book));
      } else {
        do {
          if (/^\d+$/.test(args.chapter)) input.chapter = args.chapter;
          else if (input.volumeShort === "D&C") input.chapter = await tp.system.prompt("Section number");
          else input.chapter = await tp.system.prompt("Chapter number");
        } while (!input.chapter || !/^\d+$/.test(input.chapter));
      }
      console.log("setting chapter: ", input.chapter);
  }
  return input;
}

function addHierarchyTag(input) {
  console.log("starting: addHierarchyTag");
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
  console.log("starting: buildFilename");
  switch (input.noteTier) {
    case "volume":
      return input.volume;
    case "book":
      if (input.book === "D&C") return `${input.volumeShort} - Sections`;
      else return `${input.volumeShort} - ${input.book}`;
    case "chapter":
      if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        return `${input.volumeShort} - ${input.chapter}`;
      } else return `${input.volumeShort} - ${input.book} ${input.chapter}`;
  }
}

function getParentNoteName(input) {
  console.log("starting: getParentNoteName with tier ", input.noteTier);
  if (input.noteTier === "volume") return `MoC ${input.volume}`;
  else if (input.noteTier === "book") return input.volume;
  else if (input.noteTier === "chapter") return `${input.volumeShort} - ${input.book}`;
  console.log("ERROR: getParentNoteName failed");
}

function buildFrontmatter(input, tags, noteType, parentNoteName) {
  console.log("starting: buildFrontmatter with input ", input, " and type ", noteType, " and parent ", parentNoteName);
  let volume;
  let book;
  const chapter = input.chapter ?? "";

  if (input.noteTier === "chapter") {
    volume = input.volume ?? "";
    book = `[[${parentNoteName}|${input.book}]]`;
  } else {
    volume = `[[${parentNoteName}]]`;
    book = input.book ?? "";
  }

  return `---
  note_type: "${noteType}"
  volume: "${volume}"
  ${book ? `book: "${book}"\n` : ""}
  ${chapter ? `chapter : "${chapter}"\n` : ""}
  ${tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]\n` : ""}
---
`;
}

async function createParentNote(tp, parentNoteName, input, noteType) {
  console.log(`Searching for: ${parentNoteName}`);
  const parentNoteExists = await tp.file.find_tfile(parentNoteName);
  if (parentNoteExists) console.log(`Parent note found: ${parentNoteExists.path}`);
  else {
    console.log(`Parent note not found.: ${parentNoteName}\nCreating parent note.`);
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
  console.log("starting: new-literaturenote-scripture with args:", args);
  const noteType = "literaturenote";
  const input = await collectInputs(tp, args);
  const tags = addHierarchyTag(input);
  const filename = await buildFilename(tp, input);
  const parentNoteName = getParentNoteName(input);
  const frontmatter = buildFrontmatter(input, tags, noteType, parentNoteName);
  console.log("frontmatter - ", frontmatter);

  const body = args.body ?? "";
  await tp.user["create-note-with-frontmatter"]({ filename, frontmatter, body });
  await createParentNote(tp, parentNoteName, input, noteType);
};
