// the build scripts run under node; the one global they touch, typed here
// rather than pulling in @types/node for two scripts
declare const process: { argv: string[]; stdout: { write(s: string): void } };
declare module "node:fs" {
  export function writeFileSync(path: URL | string, data: Uint8Array): void;
}
