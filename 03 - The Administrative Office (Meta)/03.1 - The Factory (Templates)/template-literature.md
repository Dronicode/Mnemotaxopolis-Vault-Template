---
parent: "[[City Map (Top-level-index)]]"
---
<%*
const noteType = await tp.system.suggester(
  ["Scripture Study Note", "Conference Talk"],
  ["scripture", "conference"]
);
const templateMap = {
  scripture: "template-literature-scripture",
  conference: "template-literature-conference"
};
await tp.file.include(`[[${templateMap[noteType]}]]`);
%>