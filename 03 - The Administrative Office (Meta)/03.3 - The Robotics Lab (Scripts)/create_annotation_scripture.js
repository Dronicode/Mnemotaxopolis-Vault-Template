module.exports = async (tp) => {
  // prompts v2
  const canon = await tp.user.promptFromDict(tp, "canons");
  console.log("canon =" + canon);

  const canonShort = await tp.user.promptFromDict(tp, "canonsShort", canon);
  console.log("canonShort =" + canonShort);

  const book = await tp.user.promptFromDict(tp, "canons", canon);
  console.log("book =" + book);
  // Import data

  // const canonAbbreviationsFile = await tp.file.find_tfile("data/canonAbbreviations.json");
  // const CANON_ABBREVIATIONS = JSON.parse(await app.vault.read(canonAbbreviationsFile));
  // const canonShort = CANON_ABBREVIATIONS[canon] ?? canon;

  const introAndWitnessesChaptersFile = await tp.file.find_tfile("data/introAndWitnessesChapters.json");
  const INTRO_AND_WITNESSES_CHAPTERS = JSON.parse(await app.vault.read(introAndWitnessesChaptersFile));

  const hasOneChapterFile = await tp.file.find_tfile("data/hasOneChapter.json");
  const HAS_ONE_CHAPTER = JSON.parse(await app.vault.read(hasOneChapterFile));

  // Prompt user input
  // const canon = await tp.system.suggester(Object.keys(CANONS), Object.keys(CANONS));

  // const book = await tp.system.suggester(CANONS[canon], CANONS[canon]);

  let chapter;
  if (book === "Introduction and Witnesses") {
    chapter = await tp.system.suggester(INTRO_AND_WITNESSES_CHAPTERS, INTRO_AND_WITNESSES_CHAPTERS);
  } else if (HAS_ONE_CHAPTER.includes(book)) {
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

  // Return frontmatter string
  return `---
  date_created: ${now}
  canon: ${canon}
  book: "[[${book}]]"
  chapter: "${chapter}"
  verse: "${verse}"
  summary: "${summary}"
  tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]
---

`;
};
