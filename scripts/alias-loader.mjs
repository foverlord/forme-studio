import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = fileURLToPath(new URL(`../${specifier.slice(2)}`, import.meta.url));
    const file = [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`].find((candidate) => existsSync(candidate));
    if (!file) throw new Error(`Cannot resolve ${specifier}`);
    return nextResolve(pathToFileURL(file).href, context);
  }
  return nextResolve(specifier, context);
}
