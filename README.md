# Local Mode
Local server for sketching

A drop-in replacement for something like `python3 -m http.server` built with Bun. Watches for file changes at the root and triggers page reloads via WebSockets. It also builds folder views for directories without an `index.html` that look like:

![local-mode](https://github.com/user-attachments/assets/96c487c6-e2a1-4f5e-bb8b-ba4efe4d1af0)


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
