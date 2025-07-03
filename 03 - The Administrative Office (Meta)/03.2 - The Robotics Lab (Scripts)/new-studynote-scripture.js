module.exports = async (tp, args = {}) => {
  // Note tier selection
  const annotationType = await tp.system.suggester(
    ["verse", "chapter", "book", "volume"],
    ["verse", "chapter", "book", "volume"],
    "Is this note for verses, a chapter, a book, or a whole volume?"
  );

  // Get user input
  const input = {};

  // Get volume
  input.volume = args.volume ?? (await tp.user["prompt-from-dict"](tp, "volumes-and-books"));
  input.volumeShort = await tp.user["prompt-from-dict"](tp, "volumes-shortened", input.volume);

  // Get book
  if (["verse", "chapter", "book"].includes(annotationType)) {
    input.book = await tp.user["prompt-from-dict"](tp, "volumes-and-books", input.volume);
  }

  // Get chapter
  if (["verse", "chapter"].includes(annotationType)) {
    if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
      input.chapter = await tp.user["prompt-from-dict"](tp, "named-chapters", input.book);
    } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
      // Books with paragraphs have no chapters.
    } else {
      do {
        if (input.volumeShort === "D&C") {
          input.chapter = await tp.system.prompt("Section number");
        } else {
          input.chapter = await tp.system.prompt("Chapter number");
        }
      } while (!input.chapter || !/^\d+$/.test(input.chapter));
    }
  }

  // Get verse
  if (annotationType === "verse") {
    do {
      if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
        input.verse = await tp.system.prompt("Paragraph(s) (e.g. 2, 3-5, 1,3,7-9)");
      } else {
        input.verse = await tp.system.prompt("Verse(s) (e.g. 2, 3-5, 1,3,7-9)");
      }
    } while (!input.verse || !/^(\d+([--]\d+)?)(,\s*\d+([--]\d+)?)*$/.test(input.verse));
  }

  // Summary and tags
  input.summary = await tp.system.prompt("Enter a short summary for this annotation");

  input.tagsInput = await tp.system.prompt("Enter topic tags (e.g. faith, hope, charity)");
  let tags = input.tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Add hierarchy tag
  let hierarchyTag = ["scripture", input.volume];
  if (annotationType !== "volume") {
    if (input.book === "D&C") {
      hierarchyTag.push("DandC");
    } else {
      hierarchyTag.push(input.book);
    }
  }
  if (annotationType === "chapter" || annotationType === "verse") hierarchyTag.push(input.chapter);
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
    filename = input.volumeShort;
  }
  if (annotationType == "book") {
    if (input.book === "D&C") {
      filename = input.volumeShort + " - Sections";
    } else {
      filename = input.volumeShort + " - " + input.book;
    }
  }
  if (annotationType == "chapter") {
    if (input.book === "D&C") {
      filename = input.volumeShort + " - Section " + input.chapter;
    } else if (await tp.user["exists-in-datafile"](tp, "has-paragraphs", input.book)) {
      filename = input.volumeShort + " - " + input.book;
    } else if (await tp.user["exists-in-datafile"](tp, "named-chapters", input.book)) {
      filename = input.volumeShort + " - " + input.chapter;
    } else {
      filename = input.volumeShort + " - " + input.book + " " + input.chapter;
    }
  }
  if (annotationType == "verse") {
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
  }

  const now = tp.date.now("YYYY-MM-DD HH:mm");
  filename = filename + " [" + now.replace(":", "·") + "]";

  // Check for parent notes
  let volumeField, bookField, chapterField, parentNoteName;
  if (annotationType === "volume") {
    parentNoteName = input.volume;
    volumeField = `[[${parentNoteName}]]`;
  } else if (annotationType === "book") {
    parentNoteName = `${input.volumeShort} - ${input.book}`;
    volumeField = input.volume;
    bookField = `[[${parentNoteName}|${input.book}]]`;
  } else {
    volumeField = input.volume;
    if (/^\d+$/.test(input.chapter) || !input.chapter) {
      parentNoteName = `${input.volumeShort} - ${input.book}`;
      bookField = `[[${parentNoteName}|${input.book}]]`;
      chapterField = input.chapter;
    } else {
      parentNoteName = `${input.volumeShort} - ${input.chapter}`;
      bookField = input.book;
      chapterField = `[[${parentNoteName}|${input.chapter}]]`;
    }
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
  date_created: "${now}"
  note_type: studynote
  volume: "${volumeField}"
  ${input.book ? `book: "${bookField}"\n` : ""}
  ${input.chapter ? `chapter: "${chapterField}"\n` : ""}
  ${input.verse ? `verse: "${input.verse}"\n` : ""}
  ${input.summary ? `summary: "${input.summary}"\n` : ""}
  ${tags.length ? `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]\n` : ""}
---
  `;
  const body = "";

  await tp.user["create-note-with-frontmatter"]({ filename, frontmatter, body });
};
