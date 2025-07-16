---
parent: "[[Scripture Journal]]"
note_type: MoC
selected_book: All
selected_chapter: Title Page of the Book of Mormon
selected_note_type: All
sort_mode: Date
---

# Add a new note

```meta-bind-button
label: Add a new Book of Mormon note
icon: ""
style: primary
class: ""
cssStyle: ""
backgroundImage: ""
tooltip: ""
id: ""
hidden: false
actions:
  - type: runTemplaterFile
    templateFile: 03 - The Administrative Office (Meta)/03.1 - The Factory (Templates)/template-studynote-scripture-bom.md

```

## View existing notes
### search options
```dataviewjs
function clean(v) {
  return String(v).replace(/['"]/g, "").trim();
}
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
  "Title Page",
  "Title Page of the Book of Mormon",
  "Introduction",
  "Testimony of Three Witnesses",
  "Testimony of Eight Witnesses",
  "Testimony of the Prophet Joseph Smith",
  "Brief Explanation about the Book of Mormon"
];
const volume = "Book of Mormon";
const book = dv.current().selected_book;
const chapter = dv.current().selected_chapter;
const noteFilter = dv.current().selected_note_type ?? "All";
const searchdir = "02 - Urban Districts (Content)"
const sortOptions = ["Reference", "Date"];
const sortModeOpts = sortOptions.map(s => `option(${s})`).join(",");

// 2) Pull all pages
const allPages = dv
  .pages(`"${searchdir}"`)
  .where(p => p.volume === volume)
  .array();
  
// -------------------- notetype dropdown
const types = Array.from(
  new Set(
    allPages
      .map(p => p.note_type)
      .filter(nt => nt != null)
  )
);

const noteTypes = ["All", ...types];
const noteOpts = noteTypes
  .map(nt => `option(${nt})`)
  .join(",");
  
dv.header(3, "🔖 Filter by Note Type");
dv.paragraph(
  "```meta-bind\n" +
    `INPUT[inlineSelect(${noteOpts}):selected_note_type]` +
  "\n```"
);

// ------------------- book dropdown
const books = Array.from(
  new Set(
    allPages
      .map(p => p.book)
      .filter(b => b != null)
  )
);
books.sort((a, b) => {
  return bookOrder.indexOf(a) - bookOrder.indexOf(b);
});
const bookOpts = ["All", "None", ...books]
  .map(b => `option(${b})`)
  .join(",");

dv.header(3, "📘 Filter by Book");
// Book dropdown
dv.paragraph(
  "```meta-bind\n" +
    `INPUT[inlineSelect(${bookOpts}):selected_book]\n` +
  "\n```"
);


// -------------------- chapter dropdown
if (book !== "All" && book !== "None") {
	const chapters = Array.from(
	  new Set(
	    allPages
	      .filter(p => book === "All" || book === "None" || clean(p.book) === clean(book))
	      .map(p => p.chapter)
	      .filter(c => c != null)
	  )
	);
if (clean(book) === "Introduction and Witnesses") {
  chapters.sort((a, b) => {
    return introAndWitnessesChapters.indexOf(a) - introAndWitnessesChapters.indexOf(b);
  });
} else {
  // Natural sort for numbered chapters
  chapters.sort((a, b) => {
    const aNum = parseFloat(a), bNum = parseFloat(b);
    return (isNaN(aNum) || isNaN(bNum))
      ? a.localeCompare(b)
      : aNum - bNum;
  });
}

	const chapterTypes = ["All", "None", ...chapters];
	const chapterOpts = chapterTypes
	  .map(c => `option(${c})`)
	  .join(",");
	
	dv.header(3, "📄 Filter by Chapter");
	dv.paragraph(
	  "```meta-bind\n" +
	    `INPUT[inlineSelect(${chapterOpts}):selected_chapter]` +
	  "\n```"
	);
} else {
  dv.paragraph("_📄 Select a book to enable chapter filtering._");
}

// -------------------- Annotation Table
const pages = allPages.filter(p =>
  (
	noteFilter === "All" || 
	clean(p.note_type) === clean(noteFilter)
  ) &&
  (
	book === "All" ||
    (book === "None" && !p.book) || 
    clean(p.book) === clean(book)
  ) &&
  (
    book === "All" || book === "None" || 
    chapter === "All" ||
    (chapter === "None" && !p.chapter) || 
    clean(p.chapter) === clean(chapter)
  )
);
if (dv.current().sort_mode === "Date") {
  pages.sort((a, b) => {
    const dateA = a.date_created ?? a.file.ctime;
    const dateB = b.date_created ?? b.file.ctime;
    return new Date(dateA) - new Date(dateB);
  });
} else {
  pages.sort((a, b) => a.file.name.localeCompare(b.file.name));
}


dv.table(
  ["Reference", "Date", "Summary"],
  pages.map(p => [
    dv.fileLink(p.file.path),
    p.date_created ?? p.file.ctime,
    p.summary ?? ""
  ])
);
dv.header(3, "🔀 Sort By");
dv.paragraph(
  "```meta-bind\n" +
    `INPUT[inlineSelect(${sortModeOpts}):sort_mode]\n` +
  "```"
);
```
