// Text assets imported with `with { type: 'text' }`.
declare module '*.ps1' {
  const content: string;
  export default content;
}
