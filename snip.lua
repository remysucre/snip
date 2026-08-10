-- Pandoc filter: any ```html code block containing a <run-snip> widget is
-- emitted twice — the original highlighted code, then the same text as raw
-- HTML, so the example also runs live on the generated page.

function CodeBlock(cb)
  if cb.classes:includes('html') and cb.text:match('<run%-snip') then
    return { cb, pandoc.RawBlock('html', cb.text) }
  end
end
