# Vendored runtimes

## MicroPython WebAssembly

- `micropython.mjs` + `micropython.wasm`
- Package: [`@micropython/micropython-webassembly-pyscript`](https://www.npmjs.com/package/@micropython/micropython-webassembly-pyscript) 1.28.0-6 (MIT)
- Built from `ports/webassembly` in https://github.com/micropython/micropython (Emscripten build, PyScript variant)
- Vendored 2026-08-09

To update:

```sh
curl -sL "$(curl -s https://registry.npmjs.org/@micropython/micropython-webassembly-pyscript \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['versions'][d['dist-tags']['latest']]['dist']['tarball'])")" \
  | tar xz -C /tmp
cp /tmp/package/micropython.mjs /tmp/package/micropython.wasm .
```

The tarball also ships variants we don't use: `micropython-ulab.wasm` (numpy-like arrays, +~180 KB) and `-settrace` builds (sys.settrace support).

## SQLite WebAssembly

- `sqlite3.mjs` + `sqlite3.wasm`
- Package: [`@sqlite.org/sqlite-wasm`](https://www.npmjs.com/package/@sqlite.org/sqlite-wasm) 3.53.0-build1
- The official SQLite WASM build, published by the SQLite project
- `sqlite3.mjs` is the package's `dist/index.mjs` renamed; `sqlite3.wasm` is `dist/sqlite3.wasm` and must sit next to the `.mjs`
- Vendored 2026-08-09

To update:

```sh
curl -sL "$(curl -s https://registry.npmjs.org/@sqlite.org/sqlite-wasm \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['versions'][d['dist-tags']['latest']]['dist']['tarball'])")" \
  | tar xz -C /tmp
cp /tmp/package/dist/index.mjs sqlite3.mjs
cp /tmp/package/dist/sqlite3.wasm .
```
