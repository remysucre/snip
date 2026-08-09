# snip

Runnable Python code snippets in the browser — no backend. Python runs in the
reader's browser via [MicroPython](https://micropython.org) compiled to
WebAssembly (~550 KB, loaded lazily on first Run).

## Usage

Write a normal code block, then attach a snippet widget to it:

```html
<pre>
print("Hello, World!")</pre>
<snip-pet></snip-pet>

<script type="module" src="https://unpkg.com/snip-snip@0/snip.js"></script>
```

The widget replaces the `<pre>` with an editable code box, a Run button, and an
inline output block. Without JavaScript, readers just see the plain code block.

Notes:

- Each Run uses a fresh interpreter — no state leaks between runs.
- Errors show the Python traceback in the output block, in red.
- Code in HTML must be HTML-escaped (`&lt;` for `<`, `&amp;` for `&`).
- MicroPython covers the core language (dicts, classes, f-strings, comprehensions);
  it is not full CPython — limited stdlib, no numpy. Dicts do not preserve
  insertion order.

## Development

Static files only. Serve locally (ES modules don't load from `file://`):

```sh
python3 -m http.server 8420
```

then open http://localhost:8420. See `vendor/README.md` for where the
MicroPython build comes from and how to update it.

## Publish

```sh
npm publish
```

unpkg and jsDelivr pick the package up automatically.
