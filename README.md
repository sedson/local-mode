# Local Mode
Local server for prototyping

A personal drop-in replacement for something like `python3 -m http.server` when prototyping small webpages and projects. Built with Bun. It uses WebSockets for triggering page reloads on file changes. It also templates up little pages for directories with out an `index.html` that look like:

## Usage
1. Have a global install of [Bun](https://bun.sh/)
1. Clone the repo somewhere
1. run `bun /.../local-mode/index.js --port <PORT>`

## Alias
With an alias like:
```bash
alias serve="bun ~/Tools/local-mode/index.js --port"
```
run `serve 8420` from any project root.