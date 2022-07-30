import fs from "fs";

export function init(outFile: string) {
  const writeStream = fs.createWriteStream(outFile);
  writeStream.write("@256\nD=A\n@SP\nM=D\n")
  writeStream.write("@Sys.init\n0;JMP\n\n");
  writeStream.end();
  return new Promise((resolve) => {
    writeStream.on('finish', resolve);
  })
}

export async function concatFiles(files: string[], outFile: string) {
  for (let file of files) {
    await new Promise((resolve) => {
      const readStream = fs.createReadStream(file);
      const writeStream = fs.createWriteStream(outFile, { flags: "a" });
      readStream.pipe(writeStream);
      writeStream.on("finish", resolve);
    })
  }
}