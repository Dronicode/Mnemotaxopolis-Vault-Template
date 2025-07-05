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

      if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        input.chapter = await tp.user["prompt-from-dict"](tp, "named-chapters", input.book);
      } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
        // Do nothing; Books with paragraphs have no chapters.
      } else {
        do {
          if (input.volumeShort === "D&C") input.chapter = await tp.system.prompt("Section number");
          else input.chapter = await tp.system.prompt("Chapter number");
        } while (!input.chapter || !/^\d+$/.test(input.chapter));
      }
      if (input.noteTier === "chapter") break;

      do {
        if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
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
  console.log("starting: addHierarchyTag");
  let tags = [...input.tags];
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
async function buildFilename(tp, input, now) {
  console.log("starting: buildFilename");
  let filename;
  switch (input.noteTier) {
    case "volume":
      filename = input.volumeShort;
      break;
    case "book":
      if (input.book === "D&C") filename = input.volumeShort + " - Sections";
      else filename = input.volumeShort + " - " + input.book;
      break;
    case "chapter":
      if (input.book === "D&C") {
        filename = input.volumeShort + " - Section " + input.chapter;
      } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
        filename = input.volumeShort + " - " + input.book;
      } else if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        filename = input.volumeShort + " - " + input.chapter;
      } else {
        filename = input.volumeShort + " - " + input.book + " " + input.chapter;
      }
      break;
    case "verse":
      if (input.book === "D&C") {
        filename = input.volumeShort + " - Section " + input.chapter + "." + input.verse;
      } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
        filename = input.volumeShort + " - " + input.book + " ¶" + input.verse;
      } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.chapter)) {
        filename = input.volumeShort + " - " + input.chapter + " ¶" + input.verse;
      } else if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
        filename = input.volumeShort + " - " + input.chapter + "." + input.verse;
      } else {
        filename = input.volumeShort + " - " + input.book + " " + input.chapter + "." + input.verse;
      }
      break;
  }

  return filename + " [" + now.replace(":", "·") + "]";
}
async function resolveParentNote(tp, input, noteType) {
  console.log("starting: resolveParentNote");
  if (input.noteTier === "volume") parentNoteName = input.volume;
  else {
    if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
      parentNoteName = `${input.volumeShort} - ${input.chapter}`;
    } else {
      parentNoteName = `${input.volumeShort} - ${input.book}`;
    }
  }
  const parentNoteExists = await tp.file.find_tfile(parentNoteName);

  if (parentNoteExists) console.log(`Parent note found: ${parentNoteExists.path}`);
  else {
    console.log(`Parent note not found.: ${parentNoteName}\nCreating parent note.`);
    // await tp.user["new-literaturenote-scripture"](tp, {
    //   childType: noteType,
    //   childTier: input.noteTier,
    //   volume: input.volume,
    //   book: input.book,
    //   chapter: input.chapter,
    // });
    console.log(`parent note created: ${parentNoteName}`);
  }
  return parentNoteName;
}

async function buildFrontmatter(tp, now, input, tags, noteType, parentNoteName) {
  console.log("starting: buildFrontmatter");
  if (input.noteTier === "volume") input.volume = `[[${parentNoteName}]]`;
  else if (input.noteTier === "book") input.book = `[[${parentNoteName}|${input.book}]]`;
  else {
    if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
      input.chapter = `[[${parentNoteName}|${input.chapter}]]`;
    } else {
      input.chapter = `[[${parentNoteName}|${input.book}]]`;
    }
  }

  return `---
  date_created: "${now}"
  note_type: "${noteType}"
  volume: "${input.volume}"
  ${input.book ? `book: "${input.book}"\n` : ""}
  ${input.chapter ? `chapter: "${input.chapter}"\n` : ""}
  ${input.verse ? `verse: "${input.verse}"\n` : ""}
  ${input.summary ? `summary: "${input.summary}"\n` : ""}
  ${tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]\n` : ""}
---
  `;
}

module.exports = async (tp, args = {}) => {
  console.log("starting: new-studynote-scripture");
  const noteType = "studynote";
  const input = await collectInputs(tp, args);
  const tags = addHierarchyTag(input);
  const now = tp.date.now("YYYY-MM-DD HH:mm");
  const filename = await buildFilename(tp, input, now);
  const parentNoteName = await resolveParentNote(tp, input, noteType);
  const frontmatter = await buildFrontmatter(tp, now, input, tags, noteType, parentNoteName);
  await tp.user["create-note-with-frontmatter"]({ filename, frontmatter });
};
