const instructions: Instructions = {
  arithmetic: {
    pattern: /^(?<op>add|sub|neg|eq|or|not|and|lt|gt)(\s+\/\/.*)?$/,
    type: 'arithmetic',
  },
  comment: { pattern: /^\/\/.*$/, type: 'comment' },
  funcDeclaration: {
    pattern: /^function\s+(?<name>[a-zA-Z][\w$.]+)\s+(?<vars>\d+)\s*(\s+\/\/.*)?$/,
    type: 'funcDeclaration',
  },
  funcReturn: {
    pattern: /^return\s*(\s+\/\/.*)?$/,
    type: 'funcReturn',
  },
  goTo: {
    pattern: /^(?<cmd>goto|if-goto)\s+(?<label>\w+([.$]\w+)*)(\s+\/\/.*)?$/,
    type: 'goTo',
  },
  label: { pattern: /^label\s+(?<label>\w+([.$]\w+)*)(\s+\/\/.*)?$/, type: 'label' },
  pop: {
    pattern: /^pop\s+((?<segment>argument|local|this|that|temp|static)\s+(?<index>\d+)|pointer\s+(?<pointer>[01]))(\s+\/\/.*)?$/,
    type: 'pop',
  },
  push: {
    pattern: /^push\s+((?<segment>constant|argument|local|this|that|temp|static)\s+(?<index>\d+)|pointer\s+(?<pointer>[01]))(\s+\/\/.*)?$/,
    type: 'push'
  },
};

export default instructions;
