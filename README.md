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

Snippets that share a `session` tag form a notebook. Running one concatenates
every snippet up to it (in document order) and runs the whole thing from
scratch — so cells build on each other, without the stale-state surprises of a
persistent interpreter:

```html
<pre>
x = 21</pre>
<run-snip lang="python" session="1"></run-snip>

<pre>
print(x * 2)</pre>
<run-snip lang="python" session="1"></run-snip>
```

`setup` and `session` compose: put `setup` on a session's first cell and its
template becomes the session's shared setup, invisibly prepended whichever
cell in the session actually runs:

```html
<script id="math-setup.py" type="text/plain">
import math
</script>

<pre>
r = 2</pre>
<run-snip lang="python" session="2" setup="math-setup.py"></run-snip>

<pre>
math.pi * r ** 2</pre>
<run-snip lang="python" session="2"></run-snip>
```

A `hide-run` cell stays visible and editable, but drops its own run
button — for a session cell that's only ever meant to run as part of a
later one:

```html
<pre>
nums = [3, 1, 4, 1, 5]</pre>
<run-snip lang="python" session="3" hide-run></run-snip>

<pre>
print(sorted(nums))</pre>
<run-snip lang="python" session="3"></run-snip>
```
