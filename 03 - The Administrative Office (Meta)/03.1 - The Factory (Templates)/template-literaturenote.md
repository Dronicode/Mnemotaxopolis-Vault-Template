---
parent: "[[City Map (Top-level-index)]]"
---
<%*
const noteType = await tp.system.suggester(
  ["Scripture Study Note", "Conference Talk", "Journal Entry"],
  ["scripture", "conference", "journal"]
);
const templateMap = {
  scripture: "template-literaturenote-scripture",
  conference: "template-literaturenote-conference",
  journal: "template-literaturenote-journal"
};
await tp.file.include(`[[${templateMap[noteType]}]]`);
%>