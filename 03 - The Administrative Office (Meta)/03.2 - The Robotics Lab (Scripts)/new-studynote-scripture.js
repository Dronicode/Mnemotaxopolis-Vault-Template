// --- Helper functions ---
async function collectInputs(tp, args) {
  console.log("starting: collectInputs");
  const input = {};
  input.noteTier = await tp.system.suggester(
    ["verse", "chapter", "book", "volume"],
    ["verse", "chapter", "book", "volume"],
    "Is this note for verses, a chapter, a book, or a whole volume?"
  );

  switch (input.noteTier) {
    case "verse":
    case "chapter":
    case "book":
    case "volume":
      input.volume = args.volume ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books"));
      input.volumeShort = await tp.user["prompt-from-dict"](tp, "volumes-shortened", input.volume);
      if (input.noteTier === "volume") break;

      input.book = await tp.user["prompt-from-dict"](tp, "volumes-and-books", input.volume);
      if (input.noteTier === "book") break;

      // Books with paragraphs have no chapters. If the note was for a chapter, set it to book instead.
      if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book))
        if (input.noteTier === "chapter") {
          input.noteTier = "book";
          break;
        } else input.chapter = "1";
      else if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        input.chapter = await tp.user["prompt-from-dict"](tp, "named-chapters", input.book);
      } else {
        do {
          if (input.volumeShort === "D&C") input.chapter = await tp.system.prompt("Section number");
          else input.chapter = await tp.system.prompt("Chapter number");
        } while (!input.chapter || !/^\d+$/.test(input.chapter));
      }
      if (input.noteTier === "chapter") break;

      do {
        if (
          (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) ||
          (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.chapter))
        ) {
          input.verse = await tp.system.prompt("Paragraph(s) (e.g. 2, 3-5, 1,3,7-9)");
        } else {
          input.verse = await tp.system.prompt("Verse(s) (e.g. 2, 3-5, 1,3,7-9)");
        }
      } while (!input.verse || !/^(\d+([--]\d+)?)(,\s*\d+([--]\d+)?)*$/.test(input.verse));
  }

  input.summary = await tp.system.prompt("Enter a short summary for this annotation");

  const tagsInput = await tp.system.prompt("Enter topic tags (e.g. faith, hope, charity)");
  input.tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return input;
}
function addHierarchyTag(input) {
  console.log("starting: addHierarchyTag with input ", input);
  let hierarchyTag = ["scripture", input.volume];
  console.log("hierarchyTag ", hierarchyTag);
  if (input.noteTier !== "volume") {
    if (input.book === "D&C") hierarchyTag.push("DandC");
    else hierarchyTag.push(input.book);
    if (input.noteTier === "chapter" || input.noteTier === "verse") hierarchyTag.push(input.chapter);
  }
  console.log("hierarchyTag ", hierarchyTag);
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
async function buildFilename(tp, input, now) {
  console.log("starting: buildFilename");
  let filename;
  switch (input.noteTier) {
    case "volume":
      filename = input.volumeShort;
      break;
    case "book":
      if (input.book === "D&C") filename = `${input.volumeShort} - Sections`;
      else filename = `${input.volumeShort} - ${input.book}`;
      break;
    case "chapter":
      if (input.book === "D&C") {
        filename = `${input.volumeShort} - Section ${input.chapter}`;
      } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
        filename = `${input.volumeShort} - ${input.book}`;
      } else if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        filename = `${input.volumeShort} - ${input.chapter}`;
      } else {
        filename = `${input.volumeShort} - ${input.book} ${input.chapter}`;
      }
      break;
    case "verse":
      if (input.book === "D&C") {
        filename = `${input.volumeShort} - Section ${input.chapter}.${input.verse}`;
      } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
        filename = `${input.volumeShort} - ${input.book} ¶${input.verse}`;
      } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.chapter)) {
        filename = `${input.volumeShort} - ${input.chapter} ¶${input.verse}`;
      } else if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        filename = `${input.volumeShort} - ${input.chapter}.${input.verse}`;
      } else {
        filename = `${input.volumeShort} - ${input.book} ${input.chapter}.${input.verse}`;
      }
      break;
  }

  return filename + " [" + now.replace(":", "·") + "]";
}
function getParentNoteName(input) {
  //TEST
  console.log("starting: getParentNoteName with tier ", input.noteTier);
  if (input.noteTier === "volume") return input.volume;
  else if (input.noteTier === "book") return `${input.volumeShort} - ${input.book}`;
  else if (/^\d+$/.test(input.chapter)) return `${input.volumeShort} - ${input.book} ${input.chapter}`;
  else return `${input.volumeShort} - ${input.chapter}`;
}
// async function getParentNoteName(tp, input) {
//   console.log("starting: getParentNoteName with tier ", input.noteTier);
//   if (input.noteTier === "volume") return input.volume;
//   else if (input.noteTier != "book" && (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)))
//     return `${input.volumeShort} - ${input.chapter}`;
//   else return `${input.volumeShort} - ${input.book}`;
// }

function buildFrontmatter(now, input, tags, noteType, parentNoteName) {
  //TEST
  // async function buildFrontmatter(tp, now, input, tags, noteType, parentNoteName) {
  // TODO handle cases with no chapters, like "[[BoM - Reference Guide to the Book of Mormon 1|1]]"
  console.log("starting: buildFrontmatter with inputs: ", input);
  let volume = input.volume ?? "";
  let book = input.book ?? "";
  let chapter = input.chapter ?? "";
  let verse = input.verse ?? "";

  // if (input.noteTier === "volume") volume = `[[${parentNoteName}]]`;
  // else if (input.noteTier != "book" && (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book))) {
  //   console.log("input.noteTier - ", input.noteTier);
  //   chapter = `[[${parentNoteName}|${input.chapter}]]`;
  // } else book = `[[${parentNoteName}|${input.book}]]`;
  //TEST
  if (input.noteTier === "volume") volume = `[[${parentNoteName}]]`;
  else if (input.noteTier === "book") book = `[[${parentNoteName}|${input.book}]]`;
  else chapter = `[[${parentNoteName}|${input.chapter}]]`;

  const frontmatterLines = [
    "---",
    `date_created: "${now}"`,
    `note_type: "${noteType}"`,
    `volume: "${volume}"`,
    book ? `book: "${book}"` : null,
    chapter ? `chapter: "${chapter}"` : null,
    verse ? `verse: "${verse}"` : null,
    input.summary ? `summary: "${input.summary}"` : null,
    tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]` : null,
    "---",
  ];

  return frontmatterLines.filter(Boolean).join("\n");

  // TEST
  //   return `---
  //   date_created: "${now}"
  //   note_type: "${noteType}"
  //   volume: "${volume}"
  //   ${book ? `book: "${book}"` : ""}
  //   ${chapter ? `chapter: "${chapter}"` : ""}
  //   ${verse ? `verse: "${verse}"` : ""}
  //   ${input.summary ? `summary: "${input.summary}"` : ""}
  //   ${tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]` : ""}
  // ---
  //   `;
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
    console.log(`parent note created: ${parentNoteName}`);
  }
  return parentNoteName;
}

module.exports = async (tp, args = {}) => {
  console.log("starting: new-studynote-scripture");
  const noteType = "studynote";
  const input = await collectInputs(tp, args);
  console.log("inputs collected - ", input);
  const tags = addHierarchyTag(input);
  const now = tp.date.now("YYYY-MM-DD HH:mm");
  const filename = await buildFilename(tp, input, now);
  // const parentNoteName = await getParentNoteName(tp, input);
  const parentNoteName = getParentNoteName(input); //TEST
  const frontmatter = buildFrontmatter(now, input, tags, noteType, parentNoteName); //TEST
  // const frontmatter = await buildFrontmatter(tp, now, input, tags, noteType, parentNoteName);
  console.log("frontmatter - ", frontmatter);
  await tp.user["create-note-with-frontmatter"]({ filename, frontmatter });
  await createParentNote(tp, parentNoteName, input, noteType);
};
