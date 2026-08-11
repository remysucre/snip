Runnable Python and SQL code snippets, using WASM builds of
 [MicroPython](https://micropython.org) (~550 KB) and
[SQLite](https://sqlite.org/wasm) (~1.4 MB).
Load the widget script once per page:

```html
<script type="module" src="https://unpkg.com/@remywang/snip@0/snip.js"></script>
```

Write a code block, then place a snippet widget after it:

```html
<pre>
print("Hello, World!")</pre>
<run-snip lang="python"></run-snip>

<pre>
SELECT 1 + 1;</pre>
<run-snip lang="sql"></run-snip>
```


Hidden template code can be specified with `setup` (prepended) and `teardown` (appended):

```html
<script id="fruits.sql" type="text/plain">
CREATE TABLE fruits(name, qty);
INSERT INTO fruits VALUES ('apple', 3), ('pear', 5), ('plum', 2);
</script>

<pre>
SELECT name, qty FROM fruits ORDER BY qty DESC;</pre>
<run-snip lang="sql" setup="fruits.sql"></run-snip>
```
