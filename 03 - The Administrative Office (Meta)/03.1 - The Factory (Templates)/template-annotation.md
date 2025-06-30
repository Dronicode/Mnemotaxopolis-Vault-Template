---
parent: "[[City Map (Top-level-index)]]"
---
<%*
const noteType = await tp.system.suggester(
  ["Scripture Annotation", "Conference Talk", "Journal Entry"],
  ["scripture", "conference", "journal"]
);
const templateMap = {
  scripture: "template-annotation-scripture",
  conference: "template-annotation-conference",
  journal: "template-annotation-journal"
};
await tp.file.include(`[[${templateMap[noteType]}]]`);
%>