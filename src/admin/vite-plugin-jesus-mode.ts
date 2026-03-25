import type { Plugin, Connect } from "vite";
import type { ServerResponse } from "node:http";
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  unlinkSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { slugify } from "./slugify";

const ITEMS_DIR = resolve("src/data/menu/items");
const CATEGORIES_FILE = resolve("src/data/menu/categories.json");
const IMAGES_DIR = resolve("src/assets/carta");

function jsonResponse(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function errorResponse(res: ServerResponse, message: string, status = 400) {
  jsonResponse(res, { error: message }, status);
}

function readBody(req: Connect.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function git(cmd: string): string {
  return execSync(`git ${cmd}`, {
    cwd: resolve("."),
    encoding: "utf-8",
    timeout: 30000,
  }).trim();
}

export default function jesusMode(): Plugin {
  return {
    name: "jesus-mode",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/_dev/api/")) return next();

        const path = url.replace("/_dev/api/", "");
        const method = req.method || "GET";

        try {
          // --- Items ---
          if (path === "items" && method === "GET") {
            const files = readdirSync(ITEMS_DIR).filter((f) =>
              f.endsWith(".json"),
            );
            const items = files.map((f) => ({
              filename: f,
              data: JSON.parse(readFileSync(join(ITEMS_DIR, f), "utf-8")),
            }));
            return jsonResponse(res, items);
          }

          if (path === "items" && method === "POST") {
            const body = JSON.parse((await readBody(req)).toString("utf-8"));
            const nombre = body.nombre;
            if (!nombre) return errorResponse(res, "nombre is required");

            let slug = slugify(nombre);
            let filename = `${slug}.json`;
            let counter = 2;
            while (existsSync(join(ITEMS_DIR, filename))) {
              filename = `${slug}-${counter}.json`;
              counter++;
            }

            writeFileSync(
              join(ITEMS_DIR, filename),
              JSON.stringify(body, null, 2) + "\n",
            );
            server.ws.send({ type: "full-reload" });
            return jsonResponse(res, { filename, data: body }, 201);
          }

          const itemMatch = path.match(/^items\/(.+\.json)$/);
          if (itemMatch) {
            const filename = itemMatch[1];
            const filePath = join(ITEMS_DIR, filename);

            if (method === "PUT") {
              const body = JSON.parse((await readBody(req)).toString("utf-8"));
              writeFileSync(filePath, JSON.stringify(body, null, 2) + "\n");
              return jsonResponse(res, { filename, data: body });
            }

            if (method === "DELETE") {
              if (!existsSync(filePath))
                return errorResponse(res, "Not found", 404);
              unlinkSync(filePath);
              server.ws.send({ type: "full-reload" });
              return jsonResponse(res, { deleted: filename });
            }
          }

          // --- Categories ---
          if (path === "categories" && method === "GET") {
            const data = JSON.parse(readFileSync(CATEGORIES_FILE, "utf-8"));
            return jsonResponse(res, data);
          }

          if (path === "categories" && method === "PUT") {
            const body = JSON.parse((await readBody(req)).toString("utf-8"));
            writeFileSync(
              CATEGORIES_FILE,
              JSON.stringify(body, null, 2) + "\n",
            );
            return jsonResponse(res, body);
          }

          // --- Images ---
          if (path === "images" && method === "GET") {
            const files = readdirSync(IMAGES_DIR).filter((f) =>
              /\.(jpg|jpeg|png)$/i.test(f),
            );
            return jsonResponse(res, files);
          }

          if (path === "images" && method === "POST") {
            const contentType = req.headers["content-type"] || "";

            if (!contentType.includes("multipart/form-data")) {
              return errorResponse(res, "Expected multipart/form-data");
            }

            // Parse multipart manually (simple single-file upload)
            const rawBody = await readBody(req);
            const boundary = contentType.split("boundary=")[1];
            if (!boundary)
              return errorResponse(res, "No boundary in content-type");

            const boundaryBuffer = Buffer.from(`--${boundary}`);
            const parts = splitBuffer(rawBody, boundaryBuffer).filter(
              (p) => p.length > 4,
            );

            for (const part of parts) {
              const headerEnd = bufferIndexOf(part, Buffer.from("\r\n\r\n"));
              if (headerEnd === -1) continue;

              const headers = part.subarray(0, headerEnd).toString("utf-8");
              const filenameMatch = headers.match(/filename="([^"]+)"/);
              if (!filenameMatch) continue;

              let filename = filenameMatch[1];
              // Ensure unique filename
              if (existsSync(join(IMAGES_DIR, filename))) {
                const ext = filename.substring(filename.lastIndexOf("."));
                const base = filename.substring(0, filename.lastIndexOf("."));
                let counter = 2;
                while (
                  existsSync(join(IMAGES_DIR, `${base}-${counter}${ext}`))
                ) {
                  counter++;
                }
                filename = `${base}-${counter}${ext}`;
              }

              // Skip \r\n\r\n header separator, trim trailing \r\n
              let fileData = part.subarray(headerEnd + 4);
              if (
                fileData[fileData.length - 2] === 0x0d &&
                fileData[fileData.length - 1] === 0x0a
              ) {
                fileData = fileData.subarray(0, fileData.length - 2);
              }

              if (!existsSync(IMAGES_DIR))
                mkdirSync(IMAGES_DIR, { recursive: true });
              writeFileSync(join(IMAGES_DIR, filename), fileData);
              return jsonResponse(res, { filename }, 201);
            }

            return errorResponse(res, "No file found in upload");
          }

          // --- Git ---
          if (path === "git/status" && method === "POST") {
            const porcelain = execSync("git status --porcelain", {
              cwd: resolve("."),
              encoding: "utf-8",
              timeout: 30000,
            });
            const branch = git("rev-parse --abbrev-ref HEAD");

            const changes: { action: string; file: string; label: string }[] =
              [];
            for (const line of porcelain.split("\n").filter(Boolean)) {
              const match = line.match(/^(.{2})\s(.+)$/);
              if (!match) continue;
              const code = match[1].trim();
              const filePath = match[2];
              const fileName = filePath.split("/").pop() || filePath;

              let action = "modificado";
              if (code === "??") action = "nuevo";
              else if (code === "A") action = "añadido";
              else if (code === "D") action = "eliminado";
              else if (code === "R") action = "renombrado";

              let label = fileName;
              // Try to read item name from JSON
              if (
                filePath.includes("menu/items/") &&
                fileName.endsWith(".json")
              ) {
                try {
                  const data = JSON.parse(
                    readFileSync(join(resolve("."), filePath), "utf-8"),
                  );
                  label = data.nombre || fileName;
                } catch {
                  label = fileName.replace(".json", "");
                }
              } else if (fileName === "categories.json") {
                label = "Categorías";
              } else if (filePath.includes("assets/carta/")) {
                label = `Imagen: ${fileName}`;
              }

              changes.push({ action, file: filePath, label });
            }

            return jsonResponse(res, { branch, changes });
          }

          if (path === "git/check-remote" && method === "POST") {
            git("fetch origin");
            const behind = git("rev-list HEAD..origin/master --count");
            return jsonResponse(res, { behind: parseInt(behind, 10) || 0 });
          }

          if (path === "git/pull" && method === "POST") {
            // Stash any local changes so pull doesn't fail
            const dirty =
              execSync("git status --porcelain", {
                cwd: resolve("."),
                encoding: "utf-8",
                timeout: 10000,
              }).trim().length > 0;
            if (dirty) git("stash --include-untracked");
            try {
              const result = git("pull --ff-only origin master");
              return jsonResponse(res, { result });
            } finally {
              if (dirty) git("stash pop");
            }
          }

          if (path === "git/push" && method === "POST") {
            git("add .");
            git('commit -m "Actualización del menú"');
            git("push origin master");
            return jsonResponse(res, { result: "ok" });
          }

          if (path === "git/reset" && method === "POST") {
            git("fetch origin");
            git("reset --hard origin/master");
            return jsonResponse(res, { result: "ok" });
          }

          // Not found
          errorResponse(res, "Not found", 404);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[jesus-mode]", message);
          errorResponse(res, message, 500);
        }
      });
    },
  };
}

// --- Multipart helpers ---

function bufferIndexOf(buf: Buffer, search: Buffer, start = 0): number {
  for (let i = start; i <= buf.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  while (true) {
    const idx = bufferIndexOf(buf, delimiter, start);
    if (idx === -1) {
      parts.push(buf.subarray(start));
      break;
    }
    parts.push(buf.subarray(start, idx));
    start = idx + delimiter.length;
  }
  return parts;
}
