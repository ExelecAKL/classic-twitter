import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.argv[2] || 4173);
const mime = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"]
]);

const server = createServer((request, response) => {
  try {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const fixtureRoutes = new Set(["/", "/home", "/home/"]);
    const pathname = url.pathname === "/i/jf/onboarding/web"
      ? "/tests/v13-auth-regression-fixture.html"
      : fixtureRoutes.has(url.pathname)
        ? "/tests/v13-regression-fixture.html"
        : decodeURIComponent(url.pathname);
    const candidate = normalize(resolve(root, `.${pathname}`));

    if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if (!statSync(candidate).isFile()) throw new Error("Not a file");

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mime.get(extname(candidate).toLowerCase()) || "application/octet-stream"
    });
    createReadStream(candidate).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Classic Twitter fixture: http://127.0.0.1:${port}/tests/v13-regression-fixture.html`);
});
