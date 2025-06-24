```templatr
<%*
const canons = {
  "Old Testament": ["Epistle Dedicatory", "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"],
  "New Testament": ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"],
  "Book of Mormon": ["Introduction and Witnesses", "1 Nephi", "2 Nephi", "Jacob", "Enos", "Jarom", "Omni", "Words of Mormon", "Mosiah", "Alma", "Helaman", "3 Nephi", "4 Nephi", "Mormon", "Ether", "Moroni"],
  "Doctrine and Covenants": ["Introduction", "Chronological order of Contents", "Section"],
  "Pearl of Great Price": ["Introduction", "Moses", "Abraham", "Joseph Smith - Matthew", "Joseph Smith - History", "Articles of Faith"]
};
const canonShortcodes = {
  "Old Testament": "OT",
  "New Testament": "NT",
  "Book of Mormon": "BoM",
  "Doctrine and Covenants": "D&C",
  "Pearl of Great Price": "PGP"
};
const introAndWitnessesChapters = [
  "Title Page of the Book of Mormon", "Introduction", "Testimony of Three Witnesses", "Testimony of Eight Witnesses", "Testimony of the Prophet Joseph Smith", "Brief Explanation about the Book of Mormon"
];

const canon = await tp.system.suggester(Object.keys(canons), Object.keys(canons));
const canonShort = canonShortcodes[canon] ?? canon;

const book = await tp.system.suggester(canons[canon], canons[canon]);

let chapter;
if (book === "Introduction and Witnesses") {
  chapter = await tp.system.suggester(introAndWitnessesChapters, introAndWitnessesChapters);
} else if (["Epistle Dedicatory", "Introduction", "Chronological order of Contents", "Joseph Smith - Matthew", "Joseph Smith - History", "Articles of Faith"].includes(book)) {
  chapter = "1";
} else {
do {
	chapter = await tp.system.prompt("Chapter or Section number");
  } while (!chapter || !/^\d+$/.test(chapter));
}
let verse;
do {
  verse = await tp.system.prompt("Verse(s) or paragraph(s) (e.g. 2, 3–5, 1,3,7–9)");
} while (!verse || !/^(\d+([–-]\d+)?)(,\s*\d+([–-]\d+)?)*$/.test(verse));

const summary = await tp.system.prompt("Enter a short summary for this annotation");

const tagsInput = await tp.system.prompt("Enter topic tags (e.g. faith, hope, charity)");
let tags = tagsInput
  .split(",")
  .map(t => t.trim())
  .filter(Boolean);
tags.push(canonShort+"-"+book);
tags = tags.map(t =>
  t
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "")
);

const now = tp.date.now("YYYY-MM-DD HH:mm");
const filename = (() => {
  const timestamp = now.replace(":", "·");
  if (book === "Introduction and Witnesses") {
    return `${canonShort} - ${chapter} ¶${verse} [${timestamp}]`;
  }
  if (canon === "Doctrine and Covenants" && book === "Section") {
    return `${canonShort} - ${chapter}.${verse} [${timestamp}]`;
  }
  return `${canonShort} - ${book} ${chapter}.${verse} [${timestamp}]`;
})();

await tp.file.rename(filename);

tR = `---
date_created: ${now}
canon: ${canon}
book: ${book}
chapter: "${chapter}"
verse: "${verse}"
summary: "${summary}"
tags: [${tags.map(tag => `"${tag}"`).join(", ")}]
---
# ${book} ${chapter}:${verse}
## Note: 

## Related Scriptures:

`;
%>
```