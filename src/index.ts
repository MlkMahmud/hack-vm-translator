import fs from "fs";
import path from "path";
import Translator from "./translator";
import { concatFiles, init } from "./utils";

(async function main() {
  try {
    const args = process.argv;
    const src = args[2];
    const translator = new Translator();

    if (args.length !== 3) {
      console.error("Usage: npm run translate [path to src file or directory]");
      process.exit(1);
    } else if (fs.lstatSync(src).isFile() && !src.endsWith('.vm')) {
      console.error("Usage: npm run translate [src.vm]");
      process.exit(1);
    } else if (fs.lstatSync(src).isDirectory()) {
      const files = fs.readdirSync(src);
      const sysFile = files.find((file) => file.toLowerCase() === 'sys.vm');
      if (!sysFile) {
        console.error("src directory must contain a Sys.vm file");
        process.exit(1);
      }
      const translatedFiles = [];
      for (let file of files) {
        if (file.endsWith('.vm')) {
          await translator.translate(`${src}${file}`);
          translatedFiles.push(`${src}${file.replace(".vm", ".asm")}`);
        }
      }
      const outFile = `${src}${path.basename(src)}.asm`;
      await init(outFile);
      await concatFiles(translatedFiles, outFile);
    } else {
      await translator.translate(src);
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
})();