
type Command = "arithmetic" | "comment" | "call" | "function" | "return" | "goto" | "label" | "pop" | "push";

type Instructions = Record<Command, {
  pattern: RegExp,
  type: Command,
}>

type Token = { type?: Command, value: { [key: string]: string } };