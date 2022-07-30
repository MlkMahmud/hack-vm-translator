const instructions: Instructions = {
  arithmetic: {
    pattern: /^(?<op>add|sub|neg|eq|or|not|and|lt|gt)(\s+\/\/.*)?$/,
    type: 'arithmetic',
  },
  comment: { pattern: /^\/\/.*$/, type: 'comment' },
  call: {
    pattern: /^call\s+(?<name>[a-zA-z][\w$.]+)\s+(?<args>\d+)\s*(\s+\/\/.*)?$/,
    type: 'call',
  },
  function: {
    pattern: /^function\s+(?<name>[a-zA-Z][\w$.]+)\s+(?<vars>\d+)\s*(\s+\/\/.*)?$/,
    type: 'function',
  },
  return: {
    pattern: /^return\s*(\s+\/\/.*)?$/,
    type: 'return',
  },
  goto: {
    pattern: /^(?<cmd>goto|if-goto)\s+(?<label>\w+([.$]\w+)*)(\s+\/\/.*)?$/,
    type: 'goto',
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
