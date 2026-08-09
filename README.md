# snip

Runnable Python code snippets in the browser. Python runs in the
reader's browser via [MicroPython](https://micropython.org) compiled to
WebAssembly (~550 KB, loaded lazily on first Run).

## Usage

Write a normal code block, then attach a snippet widget to it:

```html
<pre>
print("Hello, World!")</pre>
<snip-pet></snip-pet>

<script type="module" src="https://unpkg.com/snipsnipsnip@0/snip.js"></script>
```

The widget replaces the `<pre>` with an editable code box, a Run button, and an
inline output block.

Markdown converters (pandoc, Hugo, ...) work out of the box: the widget also
finds code blocks wrapped in a `<div>` and climbs out of a `<p>` if the
converter wraps the `<snip-pet>` tag in one. For anything else, point it at
the code explicitly: `<snip-pet selector="#my-block"></snip-pet>`.
