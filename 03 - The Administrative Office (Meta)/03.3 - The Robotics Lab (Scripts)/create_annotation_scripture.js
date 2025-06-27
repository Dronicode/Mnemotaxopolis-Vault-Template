module.exports = async (tp) => {
  // Get user input
  const canon = await tp.user.promptFromDict(tp, "canons");
  const canonShort = await tp.user.promptFromDict(tp, "canonsShort", canon);
  const book = await tp.user.promptFromDict(tp, "canons", canon);
  let chapter;
  if (book === "Introduction and Witnesses") {
    chapter = await tp.user.promptFromList(tp, "introAndWitnessesChapters");
  } else if (await tp.user.existsInDatafile(tp, "hasOneChapter", book)) {
    chapter = "1";
  } else {
    do {
      chapter = await tp.system.prompt("Chapter or Section number");
    } while (!chapter || !/^\d+$/.test(chapter));
  }

  let verse;
  do {
    verse = await tp.system.prompt("Verse(s) or paragraph(s) (e.g. 2, 3-5, 1,3,7-9)");
  } while (!verse || !/^(\d+([--]\d+)?)(,\s*\d+([--]\d+)?)*$/.test(verse));

  const summary = await tp.system.prompt("Enter a short summary for this annotation");

  const tagsInput = await tp.system.prompt("Enter topic tags (e.g. faith, hope, charity)");
  let tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (book === "Section" || book === "Introduction and Witnesses") {
    tags.push(`annotation/scripture/${canon}/${chapter}`);
  } else {
    tags.push(`annotation/scripture/${canon}/${book}`);
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
  const filename = (() => {
    const timestamp = now.replace(":", "·");
    if (book === "Introduction and Witnesses") {
      return `${canonShort} - ${chapter} ¶${verse} [${timestamp}]`;
    }
    if (book === "Section") {
      return `${canonShort} - ${chapter}.${verse} [${timestamp}]`;
    }
    return `${canonShort} - ${book} ${chapter}.${verse} [${timestamp}]`;
  })();

  await tp.file.rename(filename);

  // Check for parent notes
  let bookField, chapterField, parentNoteName;
  if (/^\d+$/.test(chapter)) {
    parentNoteName = `${canonShort} - ${book}`;
    bookField = `[[${parentNoteName}|${book}]]`;
    chapterField = `${chapter}`;
  } else {
    parentNoteName = `${canonShort} - ${chapter}`;
    bookField = `${book}`;
    chapterField = `[[${parentNoteName}|${chapter}]]`;
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

  // Frontmatter construction
  let frontmatter = `---
date_created: ${now}
canon: "${canon}"
book: "${bookField}"
chapter: "${chapterField}"
verse: "${verse}"
summary: "${summary}"
tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]
---

`;

  return frontmatter;
};
