Runnable code snippets in the browser, no backend: Python via
[MicroPython](https://micropython.org) (~550 KB) and SQL via the official
[SQLite](https://sqlite.org/wasm) build (~1.4 MB), each compiled to
WebAssembly and loaded lazily on first Run.

Write a normal code block, then attach a snippet widget to it:

```html
<pre>
print("Hello, World!")</pre>
<run-snip lang="python"></run-snip>

<pre>
SELECT 1 + 1;</pre>
<run-snip lang="sql"></run-snip>

<script type="module" src="https://unpkg.com/@remywang/snip@0/snip.js"></script>
```

SQL snippets get a fresh in-memory database per run; SELECT results print as
an aligned text table.

## Setup and teardown

To hide boilerplate, give the widget a `setup` and/or `teardown` attribute
naming the id of a `<script type="text/plain">` element on the page: setup
code is prepended to the snippet before running, and teardown code appended
(handy for hidden checks).

```html
<script id="greet.py" type="text/plain">
def greet(name):
    return f"Hello, {name}!"
</script>

<pre>
print(greet('snip'))</pre>
<run-snip lang="python" setup="greet.py"></run-snip>
```

(Don't put the setup element between a code block and its widget — the
widget finds its code in the preceding block.)

The widget replaces the `<pre>` with an editable code box, a Run button, and an
inline output block.

```python
print("snip snip snip!")
```
<run-snip lang="python"></run-snip>

<script type="module" src="./snip.js"></script>
