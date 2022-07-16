
type Command = "arithmetic" | "comment" | "funcDeclaration" | "funcReturn" | "goTo" | "label" | "pop" | "push";

type Instructions = Record<Command, {
  pattern: RegExp,
  type: Command,
}>

type Token = { type: string, value: { [key: string]: string } };