async function promptFromDict(tp, datafileName, key = null, promptMsg = null) {
  const tfile = await tp.file.find_tfile(`data/${datafileName}.json`);
  if (!tfile) throw new Error(`Could not find data/${datafileName}.json`);
  const data = JSON.parse(await app.vault.read(tfile));
  if (typeof data !== "object" || Array.isArray(data)) throw new Error(`${datafileName}.json is not a dictionary`);
  if (!key) {
    const keys = Object.keys(data);
    return promptMsg ? await tp.system.suggester(keys, keys, promptMsg) : await tp.system.suggester(keys, keys);
  }
  const value = data[key];
  if (!Array.isArray(value)) return value;
  return promptMsg ? await tp.system.suggester(value, value, promptMsg) : await tp.system.suggester(value, value);
}
module.exports = promptFromDict;
