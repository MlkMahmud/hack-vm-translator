import fs from "fs";
import readline from "readline";

const instructions = {
  arithmetic: {
    pattern: /^(?<op>add|sub|neg|eq|or|not|and|lt|gt)(\s+\/\/.*)?$/,
    type: 'arithmetic',
  },
  comment: { pattern: /^\/\/.*$/, type: 'comment' },
  pop: {
    pattern: /^pop\s+((?<segment>argument|local|this|that|temp|static)\s+(?<index>\d+)|pointer\s+(?<pointer>[01]))(\s+\/\/.*)?$/,
    type: 'pop',
  },
  push: {
    pattern: /^push\s+((?<segment>constant|argument|local|this|that|temp|static)\s+(?<index>\d+)|pointer\s+(?<pointer>[01]))(\s+\/\/.*)?$/,
    type: 'push'
  },
};

export default class Translator {
  private labelCounter = 0;
  private symbols = new Map<string, string | number>([
    ['constant', '@SP'],
    ['argument', '@ARG'],
    ['this', '@THIS'],
    ['that', '@THAT'],
    ['local', '@LCL'],
    ['static', 16],
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


  private generateCode(token: Token) {
    switch (token.type) {
      case instructions.arithmetic.type: {
        let code = '';
        const { op } = token.value;
        const symbol = this.symbols.get(op) as string;
        // single operand operators
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

      case instructions.pop.type: {
        let code = "";
        const { index = 0, pointer, segment } = token.value;
        let symbol = this.symbols.get(segment);
        if (pointer) {
          symbol = pointer === '0' ? '@R3' : '@R4';
          code += `@SP\nM=M-1\nA=M\nD=M\n${symbol}\nM=D\n\n`;
        } else if (['static', 'temp'].includes(segment)) {
          const addr = `${Number(symbol) + Number(index)}`;
          code += `@${addr}\nD=A\n@R13\nM=D\n@SP\nM=M-1\nA=M\nD=M\n@R13\nA=M\nM=D\n\n`;
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
        } else if (['static', 'temp'].includes(segment)) {
          const addr = `${Number(symbol) + Number(index)}`;
          code += `@${addr}\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
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

  public translate(srcFile: string): Promise<void> {
    const outFile = srcFile.replace('.vm', '.asm');
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
            const code = this.generateCode(token);
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