async function promptFromList(tp, datafileName, promptMsg = null) {
  const tfile = await tp.file.find_tfile(`data/${datafileName}.json`);
  if (!tfile) throw new Error(`Could not find data/${datafileName}.json`);
  const data = JSON.parse(await app.vault.read(tfile));
  if (!Array.isArray(data)) throw new Error(`${datafileName}.json is not a list`);
  return promptMsg ? await tp.system.suggester(data, data, promptMsg) : await tp.system.suggester(data, data);
}
module.exports = promptFromList;
