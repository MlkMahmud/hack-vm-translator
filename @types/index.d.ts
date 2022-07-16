
type Command = "arithmetic" | "comment" | "funcCall" | "funcDeclaration" | "funcReturn" | "goTo" | "label" | "pop" | "push";

type Instructions = Record<Command, {
  pattern: RegExp,
  type: Command,
}>

type Token = { type: string, value: { [key: string]: string } };