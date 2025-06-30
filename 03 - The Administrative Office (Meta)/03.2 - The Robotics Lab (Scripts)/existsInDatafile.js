async function existsInDatafile(tp, datafileName, value) {
  const tfile = await tp.file.find_tfile(`data/${datafileName}.json`);
  if (!tfile) throw new Error(`Could not find data/${datafileName}.json`);
  const data = JSON.parse(await app.vault.read(tfile));
  if (Array.isArray(data)) {
    return data.includes(value);
  } else if (typeof data === "object" && data !== null) {
    return value in data;
  }
  throw new Error(`${datafileName}.json is not a list or dictionary`);
}

module.exports = existsInDatafile;
