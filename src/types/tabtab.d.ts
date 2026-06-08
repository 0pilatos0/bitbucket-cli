declare module 'tabtab' {
  interface TabtabEnv {
    complete: boolean;
    words: number;
    point: number;
    line: string;
    partial: string;
    last: string;
    lastPartial: string;
    prev: string;
  }

  interface InstallOptions {
    name: string;
    completer: string;
  }

  interface UninstallOptions {
    name: string;
  }

  interface CompletionItem {
    name: string;
    description?: string;
  }

  function install(options: InstallOptions): Promise<void>;
  function uninstall(options: UninstallOptions): Promise<void>;
  function parseEnv(env: NodeJS.ProcessEnv): TabtabEnv;
  function log(completions: Array<string | CompletionItem>): void;

  export { install, uninstall, parseEnv, log };
  export default { install, uninstall, parseEnv, log };
}
