module.exports = async (tp) => {
  const canonsFile = await tp.file.find_tfile('lib/canons.json');
  const canons = JSON.parse(await app.vault.read(canonsFile));

  const canonAbbreviationsFile = await tp.file.find_tfile(
    'lib/canonAbbreviations.json',
  );
  const canonAbbreviations = JSON.parse(
    await app.vault.read(canonAbbreviationsFile),
  );

  const introAndWitnessesChaptersFile = await tp.file.find_tfile(
    'lib/introAndWitnessesChapters.json',
  );
  const introAndWitnessesChapters = JSON.parse(
    await app.vault.read(introAndWitnessesChaptersFile),
  );

  const hasOneChapterFile = await tp.file.find_tfile('lib/hasOneChapter.json');
  const hasOneChapter = JSON.parse(await app.vault.read(hasOneChapterFile));

  const canon = await tp.system.suggester(
    Object.keys(canons),
    Object.keys(canons),
  );
  const canonShort = canonAbbreviations[canon] ?? canon;

  const book = await tp.system.suggester(canons[canon], canons[canon]);
  let chapter;
  if (book === 'Introduction and Witnesses') {
    chapter = await tp.system.suggester(
      introAndWitnessesChapters,
      introAndWitnessesChapters,
    );
  } else if (hasOneChapter.includes(book)) {
    chapter = '1';
  } else {
    do {
      chapter = await tp.system.prompt('Chapter or Section number');
    } while (!chapter || !/^\d+$/.test(chapter));
  }

  let verse;
  do {
    verse = await tp.system.prompt(
      'Verse(s) or paragraph(s) (e.g. 2, 3–5, 1,3,7–9)',
    );
  } while (!verse || !/^(\d+([–-]\d+)?)(,\s*\d+([–-]\d+)?)*$/.test(verse));

  const summary = await tp.system.prompt(
    'Enter a short summary for this annotation',
  );

  const tagsInput = await tp.system.prompt(
    'Enter topic tags (e.g. faith, hope, charity)',
  );
  let tags = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (book === 'Section' || book === 'Introduction and Witnesses') {
    tags.push(`annotation/scripture/${canon}/${chapter}`);
  } else {
    tags.push(`annotation/scripture/${canon}/${book}`);
  }
  tags = tags.map((t) =>
    t
      .toLowerCase()
      .split('/')
      .map((part) => part.replace(/\s+/g, '_').replace(/[^\w_]/g, ''))
      .join('/'),
  );

  // Construct title/ filename
  const now = tp.date.now('YYYY-MM-DD HH:mm');
  const filename = (() => {
    const timestamp = now.replace(':', '·');
    if (book === 'Introduction and Witnesses') {
      return `${canonShort} - ${chapter} ¶${verse} [${timestamp}]`;
    }
    if (book === 'Section') {
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
  tags: [${tags.map((tag) => `"${tag}"`).join(', ')}]
---

`;
};
