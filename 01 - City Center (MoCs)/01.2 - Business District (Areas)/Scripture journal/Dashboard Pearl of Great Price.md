---
selected_book: 
selected_chapter: 
---

```dataviewjs
const canon = "Pearl of Great Price";
const book = dv.current().selected_book;
const chapter = dv.current().selected_chapter;

// Book Picker
const books = dv.pages('"TESTS"')
  .where(p => p.canon === canon && p.book)
  .map(p => p.book);

const uniqueBooks = [...new Set(books)].sort();
const bookOptions = uniqueBooks.map(b => `option(${b})`).join(", ");
const bookPicker = `INPUT[select(${bookOptions}):selected_book]`;

dv.paragraph("```meta-bind\n" + bookPicker + "\n```");

// Chapter Picker
if (book) {
  const chapters = dv.pages('"TESTS"')
    .where(p => p.book === book && p.chapter)
    .map(p => p.chapter);

  const uniqueChapters = [...new Set(chapters)].sort((a, b) => {
    const aNum = parseInt(a), bNum = parseInt(b);
    return isNaN(aNum) || isNaN(bNum) ? a.localeCompare(b) : aNum - bNum;
  });

  const chapterOptions = uniqueChapters.map(c => `option(${c})`).join(", ");
  const chapterPicker = `INPUT[select(${chapterOptions}):selected_chapter]`;

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
        parseInt(p.chapter) || 0,
        parseInt((p.verse ?? "").match(/\d+/)?.[0] ?? 0),
        -(p.date_created ?? p.file.ctime).valueOf()
      ]
    }))
    .sort(p => p.sortKey)
    .map(p => [
      `[[${p.file.name}|${p.book ?? ""} ${p.chapter ?? ""}:${p.verse ?? ""}]]`,
      p.date_created ?? p.file.ctime,
      p.summary ?? ""
    ])
);
```
