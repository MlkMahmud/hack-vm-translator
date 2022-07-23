import fs from "fs";
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

  private generateToken(line: string, lineNum: number) {
    const token: Token = { type: "", value: {} };
    if (line.match(instructions.arithmetic.pattern)) {
      const match = line.match(instructions.arithmetic.pattern);
      const { op } = match?.groups || {};
      token.type = instructions.arithmetic.type;
      token.value = { op };
    } else if (line.match(instructions.comment.pattern)) {
      token.type = instructions.comment.type;
    } else if  (line.match(instructions.funcCall.pattern)) {
      const match = line.match(instructions.funcCall.pattern);
      const { name, args } = match?.groups || {};
      token.type = instructions.funcCall.type;
      token.value = { args, name };
    } else if (line.match(instructions.funcDeclaration.pattern)) {
      const match = line.match(instructions.funcDeclaration.pattern);
      const { name, vars } = match?.groups || {};
      token.type = instructions.funcDeclaration.type;
      token.value = { name, vars };
    } else if (line.match(instructions.funcReturn.pattern)) { 
      token.type = instructions.funcReturn.type;
    } else if (line.match(instructions.goTo.pattern)) {
      const match = line.match(instructions.goTo.pattern);
      const { cmd, label } = match?.groups || {};
      token.type = instructions.goTo.type;
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
    } else {
      throw new SyntaxError(`Invalid expression "${line}" at line ${lineNum}`);
    }
    return token;
  }


  private generateCode(token: Token, fileName: string) {
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

      case instructions.funcCall.type: {
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

      case instructions.funcDeclaration.type: {
        const { name } = token.value;
        return `(${name})\n`;
      }

      case instructions.funcReturn.type: {
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

      case instructions.goTo.type: {
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
          code += `@SP\nM=M-1\nA=M\nD=M\n@${fileName}.${index}\nM=D\n\n`;
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
          code += `@${fileName}.${index}\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
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

  private populateScope(srcFile: string): Promise<void> {
    const reader = readline.createInterface({
      input: fs.createReadStream(srcFile),
    });

    return new Promise((resolve) => {
      let lineNum = 0;
      reader.on('line', (data) => {
        const line = data.trim();
        if (line) {
          const token = this.generateToken(line, lineNum);
          if (token.type === instructions.funcDeclaration.type) {
            const { name, vars} = token.value;
            this.scope.set(name, vars);
          }
          if (token.type !== instructions.comment.type) lineNum++;
        }
      });
      reader.on('close', resolve);
    });
  }

  public async translate(srcFile: string): Promise<void> {
    await this.populateScope(srcFile);
    const fileName = srcFile.replace('.vm', '');
    const outFile = `${fileName}.asm`;
    const writeStream = fs.createWriteStream(outFile, { flags: 'w' });
    const reader = readline.createInterface({
      input: fs.createReadStream(srcFile),
    });

    return new Promise((resolve, reject) => {
      let lineNum = 0;
      reader.on('line', (data) => {
        const line = data.trim();
        if (line) {
          const token = this.generateToken(line, lineNum);
          if (token.type !== instructions.comment.type) {
            lineNum++;
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