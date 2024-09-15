#!/usr/bin/env bun
//@ts-check
/**
 * @file Hot reloading web socket server for prototyping.
 */
import { serve, file } from "bun";
import { join, extname } from "path";
import { parseArgs } from "util";
import { watch } from "fs";
import { generate } from "./favicon.js";
import { serveFolder } from "./serve-folder.js";

const parsed = parseArgs({
  args: Bun.argv,
  options: {
    port: {
      type: "string",
      short: "p",
    },
  },
  strict: false,
  allowPositionals: true,
});

/**
 * @param {{ port: string | boolean | undefined }} parsedArgs
 */
function getPort ({ port }) {
  if (typeof port !== "string") {
    return 3000;
  }
  return isNaN(parseInt(port)) ? 3000 : parseInt(port);
}

const PORT = getPort(parsed.values);

const ROOT_DIR = process.cwd();

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

// Ignore watcher events triggered by these files/dirs.
const IGNORE = [
  ".git",
  "node_modules",
];

const websocketScript = await Bun.file(join(import.meta.dir, "inject.html")).text();

const favicon = generate();

/**
 * @param {string} filePath
 * @return {Promise<Response>}
 */
async function responseFromFile (filePath) {
  const ext = extname(filePath);
  const content = file(filePath);

  // Handle web-socket injection.
  if (ext === ".html") {
    const text = await content.text();
    const injected = text.replace("</body>", websocketScript + "\n" + "</body>");
    return new Response(injected, {
      headers: {
        "Content-Type": MIME_TYPES[".html"],  
      }
    });
  }

  // Serve a default favicon if none found.
  if (filePath.includes("favicon.ico")) {
    if (!await content.exists()) {
      return new Response(favicon, {
        headers: {
          "Content-Type": MIME_TYPES[".svg"],
        }
      });
    }
  }

  return new Response(content, {
    headers: {
      "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
    }
  });
}

// Connected clients
const clients = new Set();

// File watcher
const watcher = watch(ROOT_DIR, { recursive: true });

watcher.on('change', (eventType, filename) => {
  if (IGNORE.some(x => filename.includes(x))) {
    return;
  }

  console.log(`∟ ${eventType} : ${filename}`);

  if (filename.includes(".css")) {
    for (let client of clients) {
      client.send("refresh-css");
    }
    return;
  }
  
  for (let client of clients) {
    client.send("reload");
  }
});


/**
 * @param {Request} request
 */
async function fetch (request, server) {
  let { pathname }  = new URL(request.url);

  if (pathname.endsWith("ws")) {
    if (server.upgrade(request)) {
      return;
    }
    return new Response("Failed to upgrade", { status: 500 });
  }

  // Handle directories
  if (pathname.endsWith("/")) {
    const index = file(join(ROOT_DIR, pathname, "index.html"));
    if (await index.exists()) {
      // Index exists -> serve it!
      pathname = join(pathname, "index.html"); 
    } else {
      // Index does not exist -> serve a dynamic webpage from the directory 
      // contents.
      let contents = await serveFolder(pathname);
      return new Response(contents, {
        headers: {
          "Content-Type": MIME_TYPES[".html"],
        }
      });
    }
  }

  // Redirect "raw" URLs to directories.
  const ext = extname(pathname);
  if (!ext) {
    return Response.redirect(join(pathname, "/"), 301);
  }

  // Look for a matching file.
  let filePath = join(ROOT_DIR, pathname);

  try {
    return await responseFromFile(filePath);
  } catch (e) {
    // TODO : Build a nice error page.
    return new Response(e, { status: 500 });
  }
}

const websocket = {
  open(ws) {
    clients.add(ws);
  },
  
  message(ws, message) {
    console.log("--- ws message:", message);
  },

  close(ws, code, message) {
    clients.delete(ws)
  }
}

serve({ port: PORT, fetch, websocket });
console.log(`Server running on [ http://localhost:${PORT} ]`);

process.on("SIGINT", () => {
  // close watcher when Ctrl-C is pressed
  console.log("closing watcher");
  watcher.close();
  process.exit(0);
});