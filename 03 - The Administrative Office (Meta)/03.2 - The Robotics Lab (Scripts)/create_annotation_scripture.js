module.exports = async (tp, args) => {
  // const annotationType = await tp.system.suggester(
  //   ["verse", "chapter", "book", "volume"],
  //   ["verse", "chapter", "book", "volume"],
  //   "Is this note for verses, a chapter, a book, or a whole volume?"
  // );
  // Get user input
  const annotationType = "verse";
  const input = {};

  // Get volume
  input.volume = args.volume ?? (await tp.user.promptFromDict(tp, "volumesAndBooks"));
  input.volumeShort = await tp.user.promptFromDict(tp, "volumesShort", input.volume);

  // Get book
  if (["verse", "chapter", "book"].includes(annotationType)) {
    input.book = await tp.user.promptFromDict(tp, "volumesAndBooks", input.volume);
  }

  // Get chapter
  if (["verse", "chapter"].includes(annotationType)) {
    if (await tp.user.existsInDatafile(tp, "namedChapters", input.book)) {
      input.chapter = await tp.user.promptFromDict(tp, "namedChapters", input.book);
    } else if (await tp.user.existsInDatafile(tp, "hasParagraphs", input.book)) {
      input.chapter = 1;
    } else {
      do {
        input.chapter = await tp.system.prompt("Chapter or Section number");
      } while (!input.chapter || !/^\d+$/.test(input.chapter));
    }
  }

  // Get verse
  if (annotationType === "verse") {
    do {
      input.verse = await tp.system.prompt("Verse(s) or paragraph(s) (e.g. 2, 3-5, 1,3,7-9)");
    } while (!input.verse || !/^(\d+([--]\d+)?)(,\s*\d+([--]\d+)?)*$/.test(input.verse));
  }

  // Summary and tags
  input.summary = await tp.system.prompt("Enter a short summary for this annotation");

  input.tagsInput = await tp.system.prompt("Enter topic tags (e.g. faith, hope, charity)");
  let tags = input.tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (input.book === "D&C" || (await tp.user.existsInDatafile(tp, "namedChapters", input.book))) {
    tags.push(`scripture/${input.volume}/${input.chapter}`);
  } else {
    tags.push(`scripture/${input.volume}/${input.book}`);
  }
  tags = tags.map((t) =>
    t
      .toLowerCase()
      .split("/")
      .map((part) => part.replace(/\s+/g, "_").replace(/[^\w_]/g, ""))
      .join("/")
  );

  // Construct title/ filename
  const now = tp.date.now("YYYY-MM-DD HH:mm");
  const timestamp = now.replace(":", "·");
  let filename;
  if (await tp.user.existsInDatafile(tp, "hasParagraphs", input.chapter)) {
    filename = `${input.volumeShort} - ${input.chapter} ¶${input.verse} [${timestamp}]`;
  } else if (await tp.user.existsInDatafile(tp, "hasParagraphs", input.book)) {
    filename = `${input.volumeShort} - ${input.book} ¶${input.verse} [${timestamp}]`;
  } else if (input.book === "D&C") {
    filename = `${input.volumeShort} - ${input.chapter}.${input.verse} [${timestamp}]`;
  } else {
    filename = `${input.volumeShort} - ${input.book} ${input.chapter}.${input.verse} [${timestamp}]`;
  }

  // Check for parent notes
  let bookField, chapterField, parentNoteName;
  if (/^\d+$/.test(input.chapter)) {
    parentNoteName = `${input.volumeShort} - ${input.book}`;
    bookField = `[[${parentNoteName}|${input.book}]]`;
    chapterField = `${input.chapter}`;
  } else {
    parentNoteName = `${input.volumeShort} - ${input.chapter}`;
    bookField = `${input.book}`;
    chapterField = `[[${parentNoteName}|${input.chapter}]]`;
  }

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
date_created: ${now}
volume: "${input.volume}"
book: "${bookField}"
chapter: "${chapterField}"
verse: "${input.verse}"
summary: "${input.summary}"
tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]
---

`;
  const body = "";

  await tp.user.createNoteWithFrontmatter({ filename, frontmatter, body });
};
