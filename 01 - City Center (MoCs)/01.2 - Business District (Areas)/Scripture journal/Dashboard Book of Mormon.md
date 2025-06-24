---
selected_book: Enos
selected_chapter: 1
---

```dataviewjs
const canon = "Book of Mormon";
const bookOrder = [
  "Introduction and Witnesses",
  "1 Nephi",
  "2 Nephi",
  "Jacob",
  "Enos",
  "Jarom",
  "Omni",
  "Words of Mormon",
  "Mosiah",
  "Alma",
  "Helaman",
  "3 Nephi",
  "4 Nephi",
  "Mormon",
  "Ether",
  "Moroni"
];
const introAndWitnessesChapters = [
  "Title Page of the Book of Mormon",
  "Introduction",
  "Testimony of Three Witnesses",
  "Testimony of Eight Witnesses",
  "Testimony of the Prophet Joseph Smith",
  "Brief Explanation about the Book of Mormon"
];
const book = dv.current().selected_book;
const chapter = dv.current().selected_chapter;

// Book Picker
dv.header(3, "📘 Select a Book");
const books = dv.pages('"TESTS"')
  .where(p => p.canon === canon && p.book)
  .map(p => p.book);
const uniqueBooks = [...new Set(books)];
const sortedBooks = bookOrder.filter(b => uniqueBooks.includes(b));
const bookOptions = sortedBooks.map(b => `option(${b})`).join(", ");
const bookPicker = `INPUT[inlineSelect(${bookOptions}):selected_book]`;
dv.paragraph("```meta-bind\n" + bookPicker + "\n```");

// Chapter Picker
dv.header(3, "📄 Select a Chapter");
if (book === "Introduction and Witnesses") {
  const chapters = dv.pages('"TESTS"')
    .where(p => p.book === book && p.chapter)
    .map(p => p.chapter);
  const uniqueChapters = [...new Set(chapters)];
  const sortedChapters = introAndWitnessesChapters
  .filter(c => uniqueChapters.includes(c))
  .sort((a, b) => introAndWitnessesChapters.indexOf(a) - introAndWitnessesChapters.indexOf(b));
  const chapterOptions = sortedChapters.map(c => `option("${c}")`).join(", ");
  const chapterPicker = `INPUT[inlineSelect(${chapterOptions}):selected_chapter]`;
  dv.paragraph("```meta-bind\n" + chapterPicker + "\n```");
}
else if (book) {
  const chapters = dv.pages('"TESTS"')
    .where(p => p.book === book && p.chapter)
    .map(p => p.chapter);
  const uniqueChapters = [...new Set(chapters)].sort((a, b) => {
    const aNum = parseInt(a), bNum = parseInt(b);
    return isNaN(aNum) || isNaN(bNum) ? a.localeCompare(b) : aNum - bNum;
  });
  const chapterOptions = uniqueChapters.map(c => `option(${c})`).join(", ");
  const chapterPicker = `INPUT[inlineSelect(${chapterOptions}):selected_chapter]`;
  dv.paragraph("```meta-bind\n" + chapterPicker + "\n```");
}

// Annotation Table
dv.table(
  ["Reference", "Date", "Summary"],
  dv.pages('"TESTS"')
    .where(p => p.book === book && (!chapter || p.chapter == chapter))
    .map(p => ({
	  ...p,
	  sortKey: [
	    p.book ?? "",
	    isNaN(parseInt(p.chapter))
	      ? introAndWitnessesChapters.indexOf(p.chapter)
	      : parseInt(p.chapter),
	    parseInt((p.verse ?? "").match(/\d+/)?.[0] ?? 0),
	    -(p.date_created ?? p.file.ctime).valueOf()
	  ]
	}))
    .sort(p => p.sortKey)
    .map(p => {
      const isTextChapter = isNaN(parseInt(p.chapter));
      const ref = isTextChapter
        ? `${p.chapter} ¶${p.verse}`
        : `${p.book} ${p.chapter}.${p.verse}`;

      return [
        `[[${p.file.name}|${ref}]]`,
        p.date_created ?? p.file.ctime,
        p.summary ?? ""
      ];
    })
);
```
