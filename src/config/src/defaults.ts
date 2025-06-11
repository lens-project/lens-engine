// src/config/defaults.ts
import { join } from "@std/path";

/**
 * Get the default data directory based on the operating system
 */
export function defaultDataDir(): string {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || ".";

  if (Deno.build.os === "darwin") {
    return join(homeDir, "Library", "Application Support", "lens");
  } else if (Deno.build.os === "windows") {
    return join(homeDir, "AppData", "Roaming", "lens");
  } else {
    return join(homeDir, ".config", "lens");
  }
}
