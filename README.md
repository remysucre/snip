Runnable code snippets in the browser, no backend: Python via
[MicroPython](https://micropython.org) (~550 KB) and SQL via the official
[SQLite](https://sqlite.org/wasm) build (~1.4 MB), each compiled to
WebAssembly and loaded lazily on first Run.

Write a normal code block, then attach a snippet widget to it:

```html
<pre>
print("Hello, World!")</pre>
<snip-py></snip-py>

<pre>
SELECT 1 + 1;</pre>
<snip-sql></snip-sql>

<script type="module" src="https://unpkg.com/snipsnipsnip@0/snip.js"></script>
```

SQL snippets get a fresh in-memory database per run; SELECT results print as
an aligned text table.

## Templates

To hide boilerplate, give the widget a `template` attribute. The template's
`##CODE##` placeholder is replaced with the snippet's code before running.
`template="#id"` reads a `<script type="text/plain">` element on the page;
any other value is fetched as a file relative to the page.

```html
<script id="greet.py" type="text/plain">
def greet(name):
    return f"Hello, {name}!"

##CODE##
</script>

<pre>
print(greet('snip'))</pre>
<snip-py template="#greet.py"></snip-py>
```

(Don't put the template element between a code block and its widget — the
widget finds its code in the preceding block.)

The widget replaces the `<pre>` with an editable code box, a Run button, and an
inline output block.
