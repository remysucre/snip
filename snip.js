// snip — runnable Python snippets via MicroPython WASM.
//
// Usage:
//   <pre>print("hi")</pre>
//   <snip-pet></snip-pet>
//   <script type="module" src=".../snip.js"></script>

const STYLE = `
  snip-pet { display: block; }
  snip-pet textarea {
    width: 100%; box-sizing: border-box; white-space: pre; field-sizing: content;
    font-family: ui-monospace, monospace; font-size: 0.85rem;
  }
  snip-pet pre { white-space: pre-wrap; word-break: break-word; }
  snip-pet pre.error, snip-pet .status.failed { color: #b00; }
`;

let loaderPromise = null;
function getLoader() {
  loaderPromise ??= import(new URL('./vendor/micropython.mjs', import.meta.url))
    .then((m) => m.loadMicroPython);
  return loaderPromise;
}

class SnipSnippet extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';

    if (!document.head.querySelector('style[data-snip]')) {
      const style = document.createElement('style');
      style.dataset.snip = 'true';
      style.textContent = STYLE;
      document.head.append(style);
    }

    // Find the code block. An explicit selector="..." attribute wins.
    // Otherwise use the previous sibling — or the parent's previous sibling,
    // since markdown converters (pandoc et al.) wrap a bare <snip-pet> in <p>.
    // The block may be the <pre> itself or a wrapper around one, like
    // pandoc's <div class="sourceCode">.
    const sel = this.getAttribute('selector');
    const block = sel
      ? document.querySelector(sel)
      : this.previousElementSibling ?? this.parentElement.previousElementSibling;
    const codeEl = block?.matches('pre, code') ? block : block?.querySelector('pre, code');
    if (!codeEl) {
      console.warn('snip-pet: no code block found for', this);
      return;
    }
    const code = codeEl.textContent.replace(/^\n/, '').trimEnd();
    block.hidden = true;

    this.innerHTML = `
      <form>
        <textarea name="code" spellcheck="false"></textarea>
        <div>
          <button>Run</button>
          <span class="status"></span>
        </div>
        <pre hidden></pre>
      </form>`;

    const form = this.querySelector('form');
    const textarea = form.code;
    const button = form.querySelector('button');
    const output = form.querySelector('pre');
    const status = form.querySelector('.status');

    textarea.value = code;
    textarea.rows = code.split('\n').length; // fallback where field-sizing is unsupported

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      button.disabled = true;
      button.textContent = 'Running…';
      status.textContent = loaderPromise ? 'running' : 'loading runtime…';
      status.classList.remove('failed');

      const lines = [];
      const capture = (text) => lines.push(text);
      let failed = false;
      const t0 = performance.now();
      try {
        const loadMicroPython = await getLoader();
        // fresh interpreter per run, so every run is a clean slate
        const mp = await loadMicroPython({ stdout: capture, stderr: capture });
        await mp.runPythonAsync(textarea.value);
      } catch (err) {
        lines.push(String(err.message ?? err).trim());
        failed = true;
      }
      const ms = Math.max(1, Math.round(performance.now() - t0));

      output.textContent = lines.join('\n') || '(no output)';
      output.classList.toggle('error', failed);
      output.hidden = false;
      status.textContent =   ms + ' ms';
      status.classList.toggle('failed', failed);
      button.disabled = false;
      button.textContent = 'Run';
    });
  }
}

customElements.define('snip-pet', SnipSnippet);
