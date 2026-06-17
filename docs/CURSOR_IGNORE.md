# AI index exclusions

Create a **`.cursorignore`** file in the repo root with these lines (Cursor blocked auto-creating this file in some environments):

```
tapped-in-scaffold/
node_modules/
.expo/
dist/
build/
*.log
assets/
pi-session-*.html
.replit-artifact/
package-lock.json
```

For Claude Code, use the same patterns in **`.claudeignore`**.

This keeps agents from indexing the scaffold prototype and burning tokens on duplicate code.
