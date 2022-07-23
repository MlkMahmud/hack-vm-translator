
type Command = "arithmetic" | "comment" | "funcCall" | "funcDeclaration" | "funcReturn" | "goTo" | "label" | "pop" | "push";

type Instructions = Record<Command, {
  pattern: RegExp,
  type: Command,
}>

type Token = { type?: Command, value: { [key: string]: string } };