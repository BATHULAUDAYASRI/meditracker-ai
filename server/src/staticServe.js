import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Where built React files live (index.html + assets/).
 * Docker: /app/static. Local: ../../client/dist from server/src.
 */
export function resolveStaticDir() {
  const fromEnv = process.env.STATIC_DIR;
  if (fromEnv && fs.existsSync(path.join(fromEnv, "index.html"))) {
    return path.resolve(fromEnv);
  }
  const candidates = [
    path.join(process.cwd(), "static"),
    path.join(__dirname, "..", "static"),
    path.join(__dirname, "..", "..", "client", "dist"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, "index.html"))) return path.resolve(p);
  }
  return null;
}
