---
parent: "[[City Map (Top-level-index)]]"
---
<%*
const noteType = await tp.system.suggester(
  ["Scripture Study Note", "Conference Talk", "Journal Entry"],
  ["scripture", "conference", "journal"]
);
const templateMap = {
  scripture: "template-studynote-scripture",
  conference: "template-studynote-conference",
  journal: "template-studynote-journal"
};
await tp.file.include(`[[${templateMap[noteType]}]]`);
%>