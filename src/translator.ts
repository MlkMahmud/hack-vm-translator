import fs from "fs";
import path from "path";
import readline from "readline";
import instructions from "./instructions";

export default class Translator {
  private labelCounter = 0;
  private scope = new Map<string, string>();
  private symbols = new Map<string, string | number>([
    ['constant', '@SP'],
    ['argument', '@ARG'],
    ['this', '@THIS'],
    ['that', '@THAT'],
    ['local', '@LCL'],
    ['temp', 5],
    ['add', '+'],
    ['sub', '-'],
    ['neg', '-'],
    ['not', '!'],
    ['or', '|'],
    ['and', '&'],
    ['lt', 'LT'],
    ['gt', 'GT'],
    ['eq', 'EQ'],
  ]);

  /**
   * 
   * Reads a line of VM code and returns the command type and its arguments.
   * 
   * @param {string} line A line of vm code 
   * @returns A token object containing the command type and its relevant arguments.
   */

  private parse(line: string) {
    const token: Token = { value: {} };
    if (line.match(instructions.arithmetic.pattern)) {
      const match = line.match(instructions.arithmetic.pattern);
      const { op } = match?.groups || {};
      token.type = instructions.arithmetic.type;
      token.value = { op };
    } else if (line.match(instructions.comment.pattern)) {
      token.type = instructions.comment.type;
    } else if  (line.match(instructions.call.pattern)) {
      const match = line.match(instructions.call.pattern);
      const { name, args } = match?.groups || {};
      token.type = instructions.call.type;
      token.value = { args, name };
    } else if (line.match(instructions.function.pattern)) {
      const match = line.match(instructions.function.pattern);
      const { name, vars } = match?.groups || {};
      token.type = instructions.function.type;
      token.value = { name, vars };
    } else if (line.match(instructions.return.pattern)) { 
      token.type = instructions.return.type;
    } else if (line.match(instructions.goto.pattern)) {
      const match = line.match(instructions.goto.pattern);
      const { cmd, label } = match?.groups || {};
      token.type = instructions.goto.type;
      token.value = { cmd, label };
    } else if (line.match(instructions.label.pattern)) {
      const match = line.match(instructions.label.pattern);
      const { label } = match?.groups || {};
      token.type = instructions.label.type;
      token.value = { label };
    } else if (line.match(instructions.pop.pattern)) {
      const match = line.match(instructions.pop.pattern);
      const { segment, pointer, index } = match?.groups || {};
      token.type = instructions.pop.type;
      token.value = { segment, pointer, index };
    } else if (line.match(instructions.push.pattern)) {
      const match = line.match(instructions.push.pattern);
      const { segment, pointer, index } = match?.groups || {};
      token.type = instructions.push.type;
      token.value = { segment, pointer, index };
    }
    return token;
  }


  /**
   * This function decodes the token object and generates the
   * appropriate ASM code based on the token's type property.
   * 
   * @param {object} token A token object containing a VM command type and its relevant arguments  
   * @param {string} fileName The name of the VM file being translated 
   * @returns {string} the generated ASM code
   */

  private generateCode(token: Token, fileName: string): string {
    switch (token.type) {
      case instructions.arithmetic.type: {
        let code = '';
        const { op } = token.value;
        const symbol = this.symbols.get(op) as string;
        if (['neg', 'not'].includes(op)) {
          code += `@SP\nA=M-1\nM=${symbol}M\n\n`;
        } else if (['LT', 'EQ', 'GT'].includes(symbol)) {
          const label = `${symbol}_${this.labelCounter}`;
          code += `@SP\nM=M-1\nA=M\nD=M\nA=A-1\nD=M-D\n@${label}\nD;J${symbol}\n`;
          code += `@N${label}\n0;JMP\n(${label})\n@SP\nA=M-1\nM=-1\n@CONT_${this.labelCounter}\n0;JMP\n`;
          code += `(N${label})\n@SP\nA=M-1\nM=0\n(CONT_${this.labelCounter})\n\n`;
          this.labelCounter++;
        } else {
          code += `@SP\nM=M-1\nA=M\nD=M\nA=A-1\nD=M${symbol}D\nM=D\n\n`;
        }
        return code;
      }

      case instructions.call.type: {
        const { name, args } = token.value;
        const vars = this.scope.get(name);
        if (vars) {
          const arg = 5 + Number(args) + Number(vars);
          const returnAddr = `${name}$.${this.labelCounter++}`;
          let code = '';
          code += `@${returnAddr}\nD=A\n@SP\nM=M+1\nA=M-1\nM=D\n`;
          code += `@LCL\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n`;
          code += `@ARG\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n`;
          code += `@THIS\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n`;
          code += `@THAT\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n`;
          code += `@SP\nD=M\n@LCL\nM=D\n`;
          code += `@SP\nM=M+1\nA=M-1\nM=0\n`.repeat(+vars);
          code += `@SP\nD=M\n@${arg}\nD=D-A\n@ARG\nM=D\n`;
          code += `@${name}\n0;JMP\n`;
          code += `(${returnAddr})\n\n`;
          return code;
        }
        throw new ReferenceError(`function ${name} is not defined`);
      }

      case instructions.function.type: {
        const { name } = token.value;
        return `(${name})\n`;
      }

      case instructions.return.type: {
        let code = '';
        code += `@ARG\nD=M\n@R13\nM=D\n`;
        code += `@LCL\nD=M\n@5\nD=D-A\n@R14\nM=D\n`;
        code += `@R14\nA=M\nD=M\n@R15\nM=D\n@R14\nM=M+1\n`;
        code += `@R14\nA=M\nD=M\n@LCL\nM=D\n@R14\nM=M+1\n`;
        code += `@R14\nA=M\nD=M\n@ARG\nM=D\n@R14\nM=M+1\n`;
        code += `@R14\nA=M\nD=M\n@THIS\nM=D\n@R14\nM=M+1\n`;
        code += `@R14\nA=M\nD=M\n@THAT\nM=D\n`;
        code += `@SP\nA=M-1\nD=M\n@R13\nA=M\nM=D\n`;
        code += `@R13\nD=M\n@SP\nM=D+1\n`;
        code += `@R15\nA=M\n0;JMP\n`;
        return code;
      }

      case instructions.goto.type: {
        const { cmd, label } = token.value;
        if (cmd === 'goto') {
          return `@${label}\n0;JMP\n\n`;
        }
        return `@SP\nM=M-1\nA=M\nD=M\n@${label}\nD;JNE\n\n`;
      }

      case instructions.label.type: {
        const { label } = token.value;
        return `(${label})\n`;
      }

      case instructions.pop.type: {
        let code = "";
        const { index = 0, pointer, segment } = token.value;
        let symbol = this.symbols.get(segment);
        if (pointer) {
          symbol = pointer === '0' ? '@R3' : '@R4';
          code += `@SP\nM=M-1\nA=M\nD=M\n${symbol}\nM=D\n\n`;
        } else if (segment == "temp") {
          const addr = `${Number(symbol) + Number(index)}`;
          code += `@${addr}\nD=A\n@R13\nM=D\n@SP\nM=M-1\nA=M\nD=M\n@R13\nA=M\nM=D\n\n`;
        } else if(segment === "static") {
          code += `@SP\nM=M-1\nA=M\nD=M\n@${fileName.replaceAll("/", ".")}.${index}\nM=D\n\n`;
        } else {
          code += `${symbol}\nD=M\n@${index}\nD=D+A\n@R13\nM=D\n@SP\nM=M-1\nA=M\nD=M\n@R13\nA=M\nM=D\n\n`;
        }
        return code;
      }

      case instructions.push.type: {
        let code = '';
        const { index = 0, segment, pointer } = token.value;
        let symbol = this.symbols.get(segment);

        if (pointer) {
          symbol = pointer === '0' ? '@R3' : '@R4';
          code += `${symbol}\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
        } else if (segment === 'constant') {
          code += `@${index}\nD=A\n${symbol}\nM=M+1\nA=M-1\nM=D\n\n`;
        } else if (segment === "temp") {
          const addr = `${Number(symbol) + Number(index)}`;
          code += `@${addr}\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
        } else if (segment === "static") {
          code += `@${fileName.replaceAll("/", ".")}.${index}\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
        } else {
          code += `${symbol}\nD=M\n@${index}\nA=D+A\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
        }
        return code;
      }

      default: {
        throw new TypeError(`Invalid token type ${token.type}`);
      }
    }
  }


  /**
   * Scans the VM source file for syntax errors and saves all function identifiers to a global scope.
   * 
   * @param {string} srcFile Path to .vm source file 
   * @returns {Promise<void>} 
   * 
   */

  private scan(srcFile: string): Promise<void> {
    const reader = readline.createInterface({
      input: fs.createReadStream(srcFile),
    });

    return new Promise((resolve) => {
      let lineNum = 1;
      reader.on('line', (data) => {
        const line = data.trim();
        if (line) {
          const token = this.parse(line);
          if (!token.type) {
            throw new SyntaxError(`Invalid expression "${line}" at line ${lineNum} in file: ${srcFile}`);
          }

          if (token.type === instructions.function.type) {
            const { name, vars} = token.value;
            this.scope.set(name, vars);
          }
        }
        lineNum++;
      });
      reader.on('close', resolve);
    });
  }

  public async translate(srcFile: string): Promise<void> {
    await this.scan(srcFile);
    const fileName = path.basename(srcFile).replace(".vm", "");
    const outFile = srcFile.replace('.vm', '.asm');
    const writeStream = fs.createWriteStream(outFile, { flags: 'w' });
    const reader = readline.createInterface({
      input: fs.createReadStream(srcFile),
    });

    return new Promise((resolve, reject) => {
      reader.on('line', (data) => {
        const line = data.trim();
        if (line) {
          const token = this.parse(line);
          if (token.type !== instructions.comment.type) {
            const code = this.generateCode(token, fileName);
            writeStream.write(code, (err) => {
              if (err) reject(err);
            });
          }
        }
      });

      writeStream.on('finish', () => resolve());
      reader.on('close', () => {
        writeStream.end();
      });
    });
  }
}