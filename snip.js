// snip — runnable code snippets via WASM. Python (MicroPython) and SQL (SQLite).
//
// Usage:
//   <pre>print("hi")</pre>
//   <snip-py></snip-py>
//
//   <pre>SELECT 1 + 1;</pre>
//   <snip-sql></snip-sql>
//
//   <script type="module" src=".../snip.js"></script>

const STYLE = `
  snip-py, snip-sql { display: block; }
  snip-py textarea, snip-sql textarea {
    width: 100%; box-sizing: border-box; white-space: pre; field-sizing: content;
    font-family: ui-monospace, monospace; font-size: 0.85rem;
  }
  snip-py pre, snip-sql pre { white-space: pre-wrap; word-break: break-word; }
  snip-py pre.error, snip-sql pre.error,
  snip-py .status.failed, snip-sql .status.failed { color: #b00; }
`;

const style = document.createElement('style');
style.textContent = STYLE;
document.head.append(style);

// Align rows into a text table, sqlite3-CLI style.
function table(cols, rows) {
  const data = [cols, ...rows].map((r) => r.map((v) => (v === null ? 'NULL' : String(v))));
  const ncol = Math.max(...data.map((r) => r.length));
  const width = Array.from({ length: ncol }, (_, i) =>
    Math.max(...data.map((r) => (r[i] ?? '').length)));
  const fmt = (r) =>
    Array.from({ length: ncol }, (_, i) => (r[i] ?? '').padEnd(width[i])).join('  ').trimEnd();
  return [fmt(data[0]), width.map((w) => '-'.repeat(w)).join('  '), ...data.slice(1).map(fmt)]
    .join('\n');
}

// Resolve a setup="..." / teardown="..." reference: "#id" points at an element
// on the page (typically <script type="text/plain">), anything else is fetched
// as a file. Setup text runs before the snippet's code, teardown after.
async function loadTemplate(ref) {
  if (ref.startsWith('#')) {
    // getElementById, not querySelector: ids like "greet.py" contain
    // characters that mean something else in a CSS selector
    const el = document.getElementById(ref.slice(1));
    if (!el) throw new Error(`template ${ref} not found`);
    return el.textContent.replace(/^\n/, '');
  }
  const resp = await fetch(ref);
  if (!resp.ok) throw new Error(`could not load template ${ref} (HTTP ${resp.status})`);
  return resp.text();
}

const engines = {
  py: {
    module: null,
    async run(code, print) {
      this.module ??= import(new URL('./vendor/micropython.mjs', import.meta.url));
      const { loadMicroPython } = await this.module;
      // fresh interpreter per run, so every run is a clean slate
      const mp = await loadMicroPython({ stdout: print, stderr: print });
      await mp.runPythonAsync(code);
    },
  },
  sql: {
    module: null,
    async run(code, print) {
      this.module ??= import(new URL('./vendor/sqlite3.mjs', import.meta.url))
        .then((m) => m.default({ print: () => {}, printErr: () => {} }));
      const sqlite3 = await this.module;
      // fresh in-memory database per run
      const db = new sqlite3.oo1.DB();
      try {
        const cols = [];
        const rows = [];
        db.exec({ sql: code, rowMode: 'array', columnNames: cols, callback: (r) => rows.push([...r]) });
        if (cols.length) print(table(cols, rows));
      } finally {
        db.close();
      }
    },
  },
};

class SnipBase extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const engine = engines[this.constructor.engine];

    // Find the code block. An explicit selector="..." attribute wins.
    // Otherwise use the previous sibling — or the parent's previous sibling,
    // since markdown converters (pandoc et al.) wrap a bare widget tag in <p>.
    // The block may be the <pre> itself or a wrapper around one, like
    // pandoc's <div class="sourceCode">.
    const sel = this.getAttribute('selector');
    const block = sel
      ? document.querySelector(sel)
      : this.previousElementSibling ?? this.parentElement.previousElementSibling;
    const codeEl = block?.matches('pre, code') ? block : block?.querySelector('pre, code');
    if (!codeEl) {
      console.warn(this.localName + ': no code block found for', this);
      return;
    }
    const code = codeEl.textContent.replace(/^\n/, '').trimEnd();
    block.remove();

    this.innerHTML = `
      <form>
        <textarea name="code" spellcheck="false"></textarea>
        <div>
          <button>Run</button>
          <span class="status"></span>
          <a href="#" class="close" hidden>x</a>
        </div>
        <pre hidden></pre>
      </form>`;

    const form = this.querySelector('form');
    const textarea = form.code;
    const button = form.querySelector('button');
    const output = form.querySelector('pre');
    const status = form.querySelector('.status');
    const close = form.querySelector('.close');

    close.addEventListener('click', (e) => {
      e.preventDefault();
      output.hidden = true;
      close.hidden = true;
    });

    textarea.value = code;
    textarea.rows = code.split('\n').length; // fallback where field-sizing is unsupported

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      button.disabled = true;
      button.textContent = 'Running…';
      status.textContent = engine.module ? 'running' : 'loading runtime…';
      status.classList.remove('failed');

      const lines = [];
      let failed = false;
      const t0 = performance.now();
      try {
        let code = textarea.value;
        const setup = this.getAttribute('setup');
        const teardown = this.getAttribute('teardown');
        if (setup) code = (await loadTemplate(setup)).trimEnd() + '\n' + code;
        if (teardown) code = code.trimEnd() + '\n' + (await loadTemplate(teardown));
        await engine.run(code, (text) => lines.push(text));
      } catch (err) {
        lines.push(String(err.message ?? err).trim());
        failed = true;
      }
      const ms = Math.max(1, Math.round(performance.now() - t0));

      output.textContent = lines.join('\n') || '(no output)';
      output.classList.toggle('error', failed);
      output.hidden = false;
      status.textContent = ms + ' ms';
      status.classList.toggle('failed', failed);
      close.hidden = false;
      button.disabled = false;
      button.textContent = 'Run';
    });
  }
}

class SnipPy extends SnipBase { static engine = 'py'; }
class SnipSql extends SnipBase { static engine = 'sql'; }

customElements.define('snip-py', SnipPy);
customElements.define('snip-sql', SnipSql);
