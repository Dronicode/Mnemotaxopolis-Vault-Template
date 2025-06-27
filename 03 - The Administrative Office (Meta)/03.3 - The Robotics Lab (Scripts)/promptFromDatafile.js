async function promptFromDatafile(tp, datafileName, promptMsg = null) {
  console.log("looking for data/${datafileName}.json");
  const tfile = await tp.file.find_tfile("data/${datafileName}.json");
  if (!tfile) throw new Error(`Could not find data/${datafileName}.json`);
  const data = JSON.parse(await app.vault.read(tfile));
  let options, values;
  if (Array.isArray(data)) {
    options = values = data;
  } else if (typeof data === "object") {
    options = values = Object.keys(data);
  } else {
    throw new Error(`Unsupported data type in data/${datafileName}.json`);
  }
  return promptMsg ? await tp.system.suggester(options, values, promptMsg) : await tp.system.suggester(options, values);
}
module.exports = promptFromDatafile;
