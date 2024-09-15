// @ts-check
/**
 * @file Build a webpage from a folder
 */
import { readdir, stat } from "fs/promises";
import { extname, join } from "path";

const scriptDir = import.meta.dir;

// Inject the websockets script.
const websocketScript = await Bun.file(join(scriptDir, "inject.html")).text();

const icons = {
  folder: await Bun.file(join(scriptDir, "icons/folder.svg")).text(),
  arrow: await Bun.file(join(scriptDir, "icons/arrow.svg")).text(),
  file: await Bun.file(join(scriptDir, "icons/file.svg")).text(),
  picture: await Bun.file(join(scriptDir, "icons/picture.svg")).text(),
};

const page = ({ dir, content}) => (`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${dir}</title>
  <style type="text/css">
    * {
      font-family: system-ui;
      font-weight: light;
    }
    :root {
      --background: ghostwhite;
      --text: black;
      --link: olivedrab;
      --line: rgb(from var(--text) r g b / 0.2);
    }
    body {
      background-color: var(--background);
      color: var(--text);
      margin-top: 2rem;
      background-color: var(--background);
      background-image: radial-gradient(var(--line) 1px, transparent 0);
      background-size: 0.5rem 0.5rem;
      background-position: 0.25rem 0.25rem;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --background: #101210;
        --text: #888a88;
        --link: hotpink;  
      }
    }
    h1 {
      margin-top: 0rem;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--line);
    }
    .dir {
      max-width: 600px;
      margin: 0 auto;
      border: 1px solid var(--line);
      padding: 1rem;
      background: var(--background);
    }
    a {
      color: var(--text);
    }
    li:hover {
      color: var(--link);
      & * {
        color: var(--link);
      }
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      & li {
        padding: 0.33rem 0;
        margin: 0;
        display: flex;
        align-items: center;
      }
      & li:nth-child(even) {
        background: rgb(from var(--text) r g b / 0.01);
      }
      & li * {
        margin-right: 0.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="dir">
    <h1>${dir}</h1>
    <ul class="contents">
      ${content}
    </ul>
  </div>
  ${websocketScript}
</body>
</html>
`).trim();

const item =  ({ name, href, icon }) => {
  return (`<li>${icon}<a href="${href}">${name}</a></li>`).trim();
}


/**
 * From a path, generate a webpage to view the contents of a directory.
 * @param {string} path
 * @return {Promise<string>}
 */
export async function serveFolder(path) {
  const root = join(process.cwd(), path);
  const files = await readdir(root);

  /** @type {string[]} */
  const content = await Promise.all(files.map(async f => {
    const localPath = join(root, f);
    const stats = await stat(localPath);

    let icon = icons.arrow;
    if (stats.isDirectory()) {
      icon = icons.folder;
    }

    if ([".jpg", ".gif", ".png", ".jpeg"].includes(extname(f))) {
      icon = icons.picture;
    }

    if ([".js", ".mjs", ".css"].includes(extname(f))) {
      icon = icons.file;
    }

    if (stats.isDirectory()) {
      icon = icons.folder;
    }
    
    return item({ name: f, href: f, icon });
  }));

  return page({dir: path, content: content.join("\n") });
}