// --- Helper functions ---
async function collectInputs(tp, args) {
  const input = {};
  input.annotationType = await tp.system.suggester(
    ["verse", "chapter", "book", "volume"],
    ["verse", "chapter", "book", "volume"],
    "Is this note for verses, a chapter, a book, or a whole volume?"
  );

  switch (input.annotationType) {
    case "verse":
    case "chapter":
    case "book":
    case "volume":
      input.volume = args.volume ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books"));
      input.volumeShort = await tp.user["prompt-from-dict"](tp, "volumes-shortened", input.volume);
      if (input.annotationType === "volume") break;

      input.book = await tp.user["prompt-from-dict"](tp, "volumes-and-books", input.volume);
      if (input.annotationType === "book") break;

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
      if (input.annotationType === "chapter") break;

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
  let tags = [...input.tags];
  let hierarchyTag = ["scripture", input.volume];
  if (input.annotationType !== "volume") {
    if (input.book === "D&C") hierarchyTag.push("DandC");
    else hierarchyTag.push(input.book);
  }
  if (input.annotationType === "chapter" || input.annotationType === "verse") hierarchyTag.push(input.chapter);
  tags.push(
    hierarchyTag
      .filter(Boolean)
      .map((t) =>
        t
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^\w_]/g, "")
      )
      .join("/")
  );
  return tags;
}
async function buildFilename(tp, input, now) {
  let filename;
  switch (input.annotationType) {
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
async function resolveParentNote(tp, input) {
  const frontmatterFields = {};
  switch (input.annotationType) {
    case "volume":
      frontmatterFields.parentNoteName = input.volume;
      frontmatterFields.volumeField = `[[${frontmatterFields.parentNoteName}]]`;

      break;
    case "book": // TODO studybook linked to volume but should link to literaturebook
      frontmatterFields.parentNoteName = input.volume;
      frontmatterFields.volumeField = input.volume;
      frontmatterFields.bookField = `[[${frontmatterFields.parentNoteName}|${input.book}]]`;
      break;
    default:
      frontmatterFields.volumeField = input.volume;
      if (/^\d+$/.test(input.chapter) || !input.chapter) {
        frontmatterFields.parentNoteName = `${input.volumeShort} - ${input.book}`;
        frontmatterFields.bookField = `[[${frontmatterFields.parentNoteName}|${input.book}]]`;
        frontmatterFields.chapterField = input.chapter;
      } else {
        frontmatterFields.parentNoteName = `${input.volumeShort} - ${input.chapter}`;
        frontmatterFields.bookField = input.book;
        frontmatterFields.chapterField = `[[${frontmatterFields.parentNoteName}|${input.chapter}]]`;
      }
      break;
  }
  const parentNote = await tp.file.find_tfile(frontmatterFields.parentNoteName);

  if (parentNote) {
    console.log(`Parent note found: ${parentNote.path}`);
  } else {
    console.log(`Parent note not found.: ${frontmatterFields.parentNoteName}\nCreating parent note.`);
    await tp.user["new-literaturenote-scripture"](tp, { volume: input.volume, book: input.book });
  }
  return frontmatterFields;
}

function buildFrontmatter(now, input, tags, frontmatterFields) {
  return `---
  date_created: "${now}"
  note_type: studynote
  volume: "${frontmatterFields.volumeField}"
  ${input.book ? `book: "${frontmatterFields.bookField}"\n` : ""}
  ${input.chapter ? `chapter: "${frontmatterFields.chapterField}"\n` : ""}
  ${input.verse ? `verse: "${input.verse}"\n` : ""}
  ${input.summary ? `summary: "${input.summary}"\n` : ""}
  ${tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]\n` : ""}
---
  `;
}

module.exports = async (tp, args = {}) => {
  const input = await collectInputs(tp, args);
  const tags = addHierarchyTag(input);
  const now = tp.date.now("YYYY-MM-DD HH:mm");
  const filename = await buildFilename(tp, input, now);
  const frontmatterFields = await resolveParentNote(tp, input);
  const frontmatter = buildFrontmatter(now, input, tags, frontmatterFields);
  await tp.user["create-note-with-frontmatter"]({ filename, frontmatter });
};
