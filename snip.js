// snip — runnable code snippets via WASM. Python (MicroPython) and SQL (SQLite).
//
// Usage:
//   <pre>print("hi")</pre>
//   <run-snip lang="python"></run-snip>
//
//   <pre>SELECT 1 + 1;</pre>
//   <run-snip lang="sql"></run-snip>
//
// Snippets sharing a session="..." tag form a notebook: running one replays
// every snippet up to it (in document order) from scratch — cells build on
// each other, with no stale interpreter state — but only the output of the
// one you ran is shown, not the replayed cells before it. A hide-run cell
// stays editable but drops its own run button, for session cells that are
// only ever run as part of a later one.
//
//   <script type="module" src=".../snip.js"></script>

const STYLE = `
  run-snip { display: block; }
  run-snip textarea {
    width: 100%; box-sizing: border-box; white-space: pre; field-sizing: content;
    font-family: ui-monospace, monospace; font-size: 0.85rem;
  }
  run-snip pre { white-space: pre-wrap; word-break: break-word; }
  run-snip pre.error, run-snip .status.failed { color: #b00; }
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

// Resolve a setup="..." / teardown="..." reference: the id of an element on
// the page, typically <script type="text/plain">. Setup text runs before the
// snippet's code, teardown after.
// getElementById, not querySelector: ids like "greet.py" contain characters
// that mean something else in a CSS selector.
function loadTemplate(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`template ${id} not found`);
  return el.textContent.replace(/^\n/, '');
}

const engines = {
  python: {
    module: null,
    // Runs each chunk in order against one interpreter, so state accumulates
    // across a session — but only the last chunk's output reaches `print`,
    // so replaying earlier cells doesn't reprint their output too.
    async run(chunks, print) {
      this.module ??= import(new URL('./vendor/micropython.mjs', import.meta.url));
      const { loadMicroPython } = await this.module;
      let show = false;
      const sink = (text) => show && print(text);
      // fresh interpreter per run, so every run is a clean slate
      const mp = await loadMicroPython({ stdout: sink, stderr: sink });
      for (const [i, code] of chunks.entries()) {
        show = i === chunks.length - 1;
        await mp.runPythonAsync(code);
      }
    },
  },
  sql: {
    module: null,
    async run(chunks, print) {
      this.module ??= import(new URL('./vendor/sqlite3.mjs', import.meta.url))
        .then((m) => m.default({ print: () => {}, printErr: () => {} }));
      const sqlite3 = await this.module;
      // fresh in-memory database per run
      const db = new sqlite3.oo1.DB();
      try {
        for (const [i, code] of chunks.entries()) {
          const cols = [];
          const rows = [];
          db.exec({ sql: code, rowMode: 'array', columnNames: cols, callback: (r) => rows.push([...r]) });
          if (i === chunks.length - 1 && cols.length) print(table(cols, rows));
        }
      } finally {
        db.close();
      }
    },
  },
};

class RunSnip extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const engine = engines[this.getAttribute('lang')];
    if (!engine) {
      console.warn('run-snip: unknown lang for', this);
      return;
    }

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

    // A hide-run cell is still a live, editable part of a session — just
    // without its own run button, since it's meant to be replayed by a
    // later cell rather than run on its own.
    const hideRun = this.hasAttribute('hide-run');

    this.innerHTML = `
      <form>
        <textarea name="code" spellcheck="false"></textarea>
        ${hideRun ? '' : `
        <div>
          <button>Run</button>
          <span class="status"></span>
        </div>
        <pre hidden></pre>`}
      </form>`;

    const form = this.querySelector('form');
    const textarea = form.code;

    textarea.value = code;
    textarea.rows = code.split('\n').length; // fallback where field-sizing is unsupported

    if (hideRun) return;

    const button = form.querySelector('button');
    const output = form.querySelector('pre');
    const status = form.querySelector('.status');

    // after a run the button reads Close; editing the code flips it back to Run
    textarea.addEventListener('input', () => {
      if (button.textContent === 'Close') button.textContent = 'Run';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (button.textContent === 'Close') {
        output.hidden = true;
        status.textContent = '';
        button.textContent = 'Run';
        return;
      }
      button.disabled = true;
      button.textContent = 'Running…';
      status.textContent = engine.module ? 'running' : 'loading runtime…';
      status.classList.remove('failed');

      const lines = [];
      let failed = false;
      const t0 = performance.now();
      try {
        await engine.run(this.sessionChunks(), (text) => lines.push(text));
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
      button.disabled = false;
      button.textContent = 'Close';
    });
  }

  // This snippet's code, with its own setup prepended and teardown appended.
  // Empty for a widget that never upgraded (no code block was found).
  cellCode() {
    const textarea = this.querySelector('textarea');
    if (!textarea) return '';
    let code = textarea.value;
    const setup = this.getAttribute('setup');
    const teardown = this.getAttribute('teardown');
    if (setup) code = loadTemplate(setup).trimEnd() + '\n' + code;
    if (teardown) code = code.trimEnd() + '\n' + loadTemplate(teardown);
    return code;
  }

  // The chunks to execute, in order. With a session="..." tag, snippets
  // sharing that tag form a notebook: running this one replays every
  // snippet up to and including it, in document order, so cells build on
  // each other. It still runs from scratch each time — no persistent
  // interpreter, so no stale-state surprises — and only the last chunk's
  // output is shown, so replayed cells don't reprint their output.
  sessionChunks() {
    const session = this.getAttribute('session');
    if (session === null) return [this.cellCode()];
    const cells = [...document.querySelectorAll('run-snip')]
      .filter((s) => s.getAttribute('session') === session);
    return cells
      .slice(0, cells.indexOf(this) + 1)
      .map((s) => s.cellCode())
      .filter(Boolean);
  }
}

customElements.define('run-snip', RunSnip);
