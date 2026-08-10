[![npm](https://img.shields.io/npm/v/%40remywang%2Fsnip)](https://www.npmjs.com/package/@remywang/snip)

Runnable Python and SQL code snippets, using WASM builds of
 [MicroPython](https://micropython.org) (~550 KB) and
[SQLite](https://sqlite.org/wasm) (~1.4 MB).
Write a code block, then place a snippet widget after it:

```html
<pre>
print("Hello, World!")</pre>
<run-snip lang="python"></run-snip>

<pre>
SELECT 1 + 1;</pre>
<run-snip lang="sql"></run-snip>

<script type="module" src="https://unpkg.com/@remywang/snip@0/snip.js"></script>
```

Hidden template code can be specified with `setup` (prepended) and `teardown` (appended):

```html
<script id="greet.py" type="text/plain">
def greet(name):
    return f"Hello, {name}!"
</script>

<pre>
print(greet('snip'))</pre>
<run-snip lang="python" setup="greet.py"></run-snip>
```
