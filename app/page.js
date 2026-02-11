'use client'

import { useState, useRef, useEffect } from 'react'

// Helper to extract chart base64 from text
function extractChart(text) {
  if (!text || typeof text !== 'string') return null
  const match = text.match(/\[CHART_BASE64\]([\s\S]*?)\[\/CHART_BASE64\]/)
  if (match && match[1]) {
    return match[1].replace(/\s/g, '')
  }
  return null
}

// Helper to extract D3 chart data from text
function extractD3Chart(text) {
  if (!text || typeof text !== 'string') return null
  const match = text.match(/\[D3_CHART\]([\s\S]*?)\[\/D3_CHART\]/)
  if (match && match[1]) {
    try {
      return JSON.parse(match[1])
    } catch (e) {
      console.error('Failed to parse D3 chart data:', e)
      return null
    }
  }
  return null
}

// Syntax highlighter using CSS classes for dark code blocks
function highlightCode(code, type = 'sql') {
  if (!code) return ''

  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const placeholders = []
  const addPlaceholder = (match, className) => {
    const id = `__PH${placeholders.length}__`
    placeholders.push({ id, html: `<span class="${className}">${match}</span>` })
    return id
  }

  if (type === 'sql') {
    html = html.replace(/(--.*$)/gm, (m) => addPlaceholder(m, 'cm'))
    html = html.replace(/('(?:[^'\\]|\\.)*')/g, (m) => addPlaceholder(m, 'str'))
    html = html.replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|INTO|VALUES|SET|UNION|ALL|EXISTS|BETWEEN|LIKE|ILIKE|ASC|DESC|WITH|OVER|PARTITION|ROW_NUMBER|RANK|DENSE_RANK|COALESCE|NULLIF|CAST|EXTRACT|DATE|YEAR|MONTH|DAY)\b/gi,
      (m) => addPlaceholder(m, 'kw'))
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, (m) => {
      if (m.includes('__PH')) return m
      return addPlaceholder(m, 'num')
    })
  } else if (type === 'python' || type === 'r') {
    html = html.replace(/(#.*$)/gm, (m) => addPlaceholder(m, 'cm'))
    html = html.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, (m) => addPlaceholder(m, 'str'))
    html = html.replace(/(["'](?:[^"'\\]|\\.)*["'])/g, (m) => addPlaceholder(m, 'str'))
    html = html.replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|raise|pass|break|continue|and|or|not|in|is|None|True|False|self|async|await|function|library|require|source)\b/g,
      (m) => addPlaceholder(m, 'kw'))
    html = html.replace(/\b(print|len|range|str|int|float|list|dict|set|tuple|open|read|write|append|extend|sum|min|max|sorted|filter|map|zip|enumerate|isinstance|type|pd|np|plt|df|query_db|run_sql|ggplot|aes|geom_\w+|labs|theme|dplyr|tidyr|mutate|select|arrange|group_by|summarize|head|tail|nrow|ncol|requests|BeautifulSoup|soup)\b/g,
      (m) => addPlaceholder(m, 'fn'))
    html = html.replace(/(@\w+)/g, (m) => addPlaceholder(m, 'dec'))
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, (m) => {
      if (m.includes('__PH')) return m
      return addPlaceholder(m, 'num')
    })
  }

  placeholders.forEach(({ id, html: replacement }) => {
    html = html.replace(id, replacement)
  })

  return html
}

// Markdown renderer
function renderMarkdown(text) {
  if (!text) return ''

  let html = text.replace(/\[CHART_BASE64\][\s\S]*?\[\/CHART_BASE64\]/g, '')
  html = html.replace(/\[D3_CHART\][\s\S]*?\[\/D3_CHART\]/g, '')

  let codeBlockIndex = 0
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const idx = codeBlockIndex++
    const escapedCode = code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<div class="code-block-wrapper relative group my-4" data-code-index="${idx}"><pre class="p-4 pr-12 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed text-[#E2E8F0]" style="background:var(--code-bg)">${escapedCode}</pre><button class="copy-code-btn absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all" data-code="${encodeURIComponent(code.trim())}" onclick="(async function(btn){await navigator.clipboard.writeText(decodeURIComponent(btn.dataset.code));btn.innerHTML='<svg width=\\'14\\' height=\\'14\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'3\\'><polyline points=\\'20 6 9 17 4 12\\'></polyline></svg>';setTimeout(()=>btn.innerHTML='<svg width=\\'14\\' height=\\'14\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><rect x=\\'9\\' y=\\'9\\' width=\\'13\\' height=\\'13\\' rx=\\'2\\'></rect><path d=\\'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\\'></path></svg>',1500)})(this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></div>`
  })

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, body) => {
    const headers = header.split('|').filter(h => h.trim())
    const rows = body.trim().split('\n').map(row => row.split('|').filter(cell => cell.trim()))
    let table = `<div class="overflow-x-auto my-4 border border-[var(--border)] rounded-lg"><table class="w-full text-xs"><thead><tr class="border-b border-[var(--border)] bg-[var(--bg-raised)]">${headers.map(h => `<th class="text-left py-2.5 px-3 font-mono font-semibold text-[var(--ink-3)] uppercase tracking-wider" style="font-size:10px">${h.trim()}</th>`).join('')}</tr></thead><tbody>`
    rows.forEach((row) => {
      table += `<tr class="border-b border-[var(--border-s)] hover:bg-[var(--bg-raised)]">${row.map(cell => `<td class="py-2 px-3 text-[var(--ink-2)] font-mono" style="font-variant-numeric:tabular-nums">${cell.trim()}</td>`).join('')}</tr>`
    })
    table += `</tbody></table><div class="px-3 py-2 border-t border-[var(--border-s)] bg-[var(--bg-raised)] flex items-center justify-between"><span style="font-size:10px" class="text-[var(--ink-4)]">${rows.length} rows</span></div></div>`
    return table
  })

  html = html.replace(/`([^`]+)`/g, '<code class="bg-[var(--bg-sunken)] text-[var(--ink)] px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[var(--ink)]">$1</strong>')
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-[var(--ink)] mt-6 mb-2" style="font-family:var(--font-display)">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-[var(--ink)] mt-6 mb-3" style="font-family:var(--font-display)">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-[var(--ink)] mt-6 mb-3" style="font-family:var(--font-display)">$1</h1>')
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-3 border-[var(--red)] pl-4 py-1 my-3 text-[var(--ink-2)] bg-[var(--red-s)] rounded-r-lg">$1</blockquote>')
  html = html.replace(/^---+$/gm, '<hr class="border-none h-px bg-[var(--border)] my-4" />')
  html = html.replace(/---/g, '\u2014')  // em dash
  html = html.replace(/--/g, '\u2013')   // en dash
  html = html.replace(/^- (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-[var(--ink-4)] select-none">•</span><span>$1</span></div>')
  html = html.replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-[var(--ink-4)] select-none min-w-[1.5rem]">$1.</span><span>$2</span></div>')
  // Remove stray newlines between consecutive list items to prevent <br/> spacing
  html = html.replace(/<\/div>\n+(?=<div class="flex gap-2)/g, '</div>')
  html = html.replace(/\n\n/g, '</p><p class="my-2">')
  html = html.replace(/\n/g, '<br/>')

  return `<p class="my-2">${html}</p>`
}

// Tool type metadata for color-coded icons
function getToolMeta(name) {
  if (name.includes('d3') || name.includes('create_d3')) return { icon: 'D3', bg: 'var(--orange-s)', color: 'var(--orange)' }
  if (name.includes('r_chart')) return { icon: '▦', bg: 'var(--purple-s)', color: 'var(--purple)' }
  if (name.includes('chart') || name.includes('get_chart')) return { icon: '▦', bg: 'var(--yellow-s)', color: '#B8860B' }
  if (name.includes('sql') || name.includes('query')) return { icon: 'S', bg: 'var(--blue-s)', color: 'var(--blue)' }
  if (name.includes('run_r') || name.includes('r_code')) return { icon: 'R', bg: 'var(--purple-s)', color: 'var(--purple)' }
  if (name.includes('run_code')) return { icon: 'Py', bg: 'var(--green-s)', color: 'var(--green)' }
  return { icon: '⚙', bg: 'var(--bg-sunken)', color: 'var(--ink-3)' }
}

// Chart Image Component
function ChartImage({ base64, onZoom }) {
  const handleDownload = (e) => {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${base64}`
    link.download = `chart-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="my-4">
      <div className="relative group inline-block">
        <div className="cursor-zoom-in" onClick={() => onZoom(`data:image/png;base64,${base64}`)}>
          <img
            src={`data:image/png;base64,${base64}`}
            alt="Generated Chart"
            className="max-w-full rounded-lg border border-[var(--border)] transition-all hover:shadow-[var(--sh-m)]"
            style={{ maxHeight: '400px' }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors flex items-center justify-center pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
                <path d="M11 8v6M8 11h6"></path>
              </svg>
              Click to zoom
            </div>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="absolute top-2 right-2 p-2 rounded-lg bg-[var(--bg)]/90 hover:bg-[var(--bg)] shadow-[var(--sh-s)] opacity-0 group-hover:opacity-100 transition-all text-[var(--ink-3)] hover:text-[var(--ink)]"
          title="Download chart"
        >
          <DownloadIcon />
        </button>
      </div>
    </div>
  )
}

// D3.js Chart Component
function D3Chart({ code, data }) {
  const [error, setError] = useState(null)

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; background: white; color: #1e293b; }
    #chart { width: 100%; height: 100%; }
    .error { color: #F04438; padding: 20px; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    try {
      const data = ${JSON.stringify(data)};
      ${code}
    } catch (e) {
      document.getElementById('chart').innerHTML = '<div class="error">D3 Error: ' + e.message + '</div>';
      window.parent.postMessage({ type: 'd3-error', error: e.message }, '*');
    }
  </script>
</body>
</html>`

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'd3-error') setError(event.data.error)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="my-4">
      <div className="relative rounded-lg border border-[var(--border)] overflow-hidden">
        <iframe
          srcDoc={htmlContent}
          className="w-full border-0"
          style={{ height: '500px' }}
          sandbox="allow-scripts"
          title="D3 Chart"
        />
        {error && (
          <div className="absolute bottom-0 left-0 right-0 bg-[var(--red-s)] border-t border-[var(--red)]/20 p-3 text-xs text-[var(--red)]">
            Chart error: {error}
          </div>
        )}
        <div className="absolute top-2 right-2 text-[9px] font-semibold uppercase tracking-wider text-white/30 bg-black/20 px-2 py-1 rounded">
          D3.js
        </div>
      </div>
    </div>
  )
}

// Image Modal — backdrop blur, white card
function ImageModal({ src, onClose }) {
  const handleDownload = (e) => {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = src
    link.download = `chart-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8 cursor-zoom-out"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-[var(--bg)] rounded-xl shadow-[var(--sh-l)] overflow-hidden max-w-4xl max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-[var(--bg-sunken)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
        >
          <CloseIcon />
        </button>
        <div className="p-4">
          <img src={src} alt="Chart (zoomed)" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
        </div>
        <div className="px-4 pb-4 flex justify-end">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)] rounded-lg transition-colors"
          >
            <DownloadIcon /> Download
          </button>
        </div>
      </div>
    </div>
  )
}

// Icons
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
)

const PaperclipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

const SpinnerIcon = ({ size = 16 }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

const ChevronIcon = ({ open }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
)

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
)

const CopyIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
)

const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
  </svg>
)

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
)

// Code block for CodePanel — dark background
function CodeBlockItem({ block }) {
  const [copied, setCopied] = useState(false)
  const meta = getToolMeta(block.toolName || block.type)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(block.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-lg border border-[var(--border-s)] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-raised)] border-b border-[var(--border-s)]">
        <div
          className="w-4 h-4 rounded flex items-center justify-center"
          style={{ background: meta.bg, color: meta.color, fontSize: '7px', fontWeight: 700 }}
        >
          {meta.icon}
        </div>
        <span className="text-[10px] font-semibold font-mono text-[var(--ink-3)]">
          {block.type.toUpperCase()} · Step {block.stepNumber}
        </span>
        <button
          onClick={handleCopy}
          className="ml-auto text-[9px] text-[var(--ink-4)] hover:text-[var(--ink-2)] cursor-pointer px-1.5 py-0.5 rounded hover:bg-[var(--bg-sunken)] transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        className="p-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed"
        style={{ background: 'var(--code-bg)', color: '#E2E8F0' }}
        dangerouslySetInnerHTML={{ __html: highlightCode(block.code, block.type) }}
      />
    </div>
  )
}

// Code Panel — slide-out right sidebar
function CodePanel({ messages, isOpen, onClose, language }) {
  const [copied, setCopied] = useState(false)

  const codeBlocks = []
  messages.forEach((msg) => {
    if (msg.role === 'assistant' && msg.events) {
      msg.events.forEach((event) => {
        if (event.type === 'tool' && event.tool) {
          const tool = event.tool
          if (tool.name === 'run_sql' && tool.args?.query) {
            codeBlocks.push({ type: 'sql', code: tool.args.query, label: 'SQL Query', toolName: tool.name, stepNumber: codeBlocks.length + 1 })
          } else if ((tool.name === 'run_code' || tool.name === 'run_code_and_get_chart') && tool.args?.code) {
            codeBlocks.push({ type: 'python', code: tool.args.code, label: tool.name === 'run_code_and_get_chart' ? 'Chart Code' : 'Python Code', toolName: tool.name, stepNumber: codeBlocks.length + 1 })
          } else if ((tool.name === 'run_r_code' || tool.name === 'run_r_chart') && tool.args?.code) {
            codeBlocks.push({ type: 'r', code: tool.args.code, label: tool.name === 'run_r_chart' ? 'R Chart Code' : 'R Code', toolName: tool.name, stepNumber: codeBlocks.length + 1 })
          }
        }
      })
    }
  })

  const hasRCode = codeBlocks.some(b => b.type === 'r')
  const hasPythonCode = codeBlocks.some(b => b.type === 'python')
  const exportLanguage = hasRCode ? 'r' : (hasPythonCode ? 'python' : language)

  const generatePythonFile = () => {
    let py = `"""\nGenerated by Dash — AI Data Analyst\nRun with: python analysis.py\n"""\n\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nfrom sqlalchemy import create_engine\n\nDB_URL = "postgresql://localhost/your_database"\nengine = create_engine(DB_URL)\n\ndef query_db(sql):\n    return pd.read_sql(sql, engine)\n\nrun_sql = query_db\n\n`
    codeBlocks.forEach((block, i) => {
      py += `# ${'='.repeat(60)}\n# Step ${i + 1}: ${block.label}\n# ${'='.repeat(60)}\n\n`
      if (block.type === 'sql') py += `result_${i + 1} = query_db("""${block.code}""")\nprint(result_${i + 1})\n\n`
      else py += `${block.code}\n\n`
    })
    py += `plt.show()\n`
    return py
  }

  const generateRFile = () => {
    let r = `# Generated by Dash — AI Data Analyst\n# Run with: Rscript analysis.R\n\nlibrary(DBI)\nlibrary(RPostgres)\nlibrary(dplyr)\nlibrary(ggplot2)\nlibrary(tidyr)\n\ndb_con <- dbConnect(RPostgres::Postgres(), host="localhost", port=5432, dbname="your_database", user="your_user", password="your_password")\nquery_db <- function(sql) { dbGetQuery(db_con, sql) }\nrun_sql <- query_db\n\n`
    codeBlocks.forEach((block, i) => {
      r += `# ${'='.repeat(60)}\n# Step ${i + 1}: ${block.label}\n# ${'='.repeat(60)}\n\n`
      if (block.type === 'sql') r += `result_${i + 1} <- query_db("${block.code.replace(/"/g, '\\"').replace(/\n/g, ' ')}")\nprint(result_${i + 1})\n\n`
      else r += `${block.code}\n\n`
    })
    r += `dbDisconnect(db_con)\n`
    return r
  }

  const generateNotebook = () => {
    const cells = []
    // Header cell
    cells.push({ cell_type: 'markdown', metadata: {}, source: ['# Dash Analysis\n', '*Generated by Dash — AI Data Analyst*'], outputs: [] })
    // Setup cell
    cells.push({ cell_type: 'code', metadata: {}, source: ['import pandas as pd\n', 'import numpy as np\n', 'import matplotlib.pyplot as plt\n', 'from sqlalchemy import create_engine\n', '\n', 'DB_URL = "postgresql://localhost/your_database"\n', 'engine = create_engine(DB_URL)\n', '\n', 'def query_db(sql):\n', '    return pd.read_sql(sql, engine)\n', '\n', 'run_sql = query_db'], outputs: [], execution_count: null })

    messages.forEach((msg) => {
      if (msg.role === 'user') {
        cells.push({ cell_type: 'markdown', metadata: {}, source: [`**User:** ${msg.content}`], outputs: [] })
      } else if (msg.role === 'assistant' && msg.events) {
        msg.events.forEach((event) => {
          if (event.type === 'text' && event.content) {
            cells.push({ cell_type: 'markdown', metadata: {}, source: event.content.split('\n').map((line, i, arr) => i < arr.length - 1 ? line + '\n' : line), outputs: [] })
          } else if (event.type === 'tool' && event.tool) {
            const tool = event.tool
            const code = tool.args?.query || tool.args?.code
            if (code) {
              const source = tool.name === 'run_sql'
                ? [`# ${tool.name}\n`, `query_db("""${code}""")`]
                : code.split('\n').map((line, i, arr) => i < arr.length - 1 ? line + '\n' : line)
              const outputs = []
              if (tool.result && typeof tool.result === 'string') {
                const chartMatch = tool.result.match(/\[CHART_BASE64\]([\s\S]*?)\[\/CHART_BASE64\]/)
                if (chartMatch) {
                  outputs.push({ output_type: 'display_data', metadata: {}, data: { 'image/png': chartMatch[1].trim() } })
                } else {
                  const text = tool.result.replace(/\[D3_CHART\][\s\S]*?\[\/D3_CHART\]/g, '').trim()
                  if (text) {
                    outputs.push({ output_type: 'execute_result', metadata: {}, execution_count: null, data: { 'text/plain': text.split('\n').map((line, i, arr) => i < arr.length - 1 ? line + '\n' : line) } })
                  }
                }
              }
              cells.push({ cell_type: 'code', metadata: {}, source, outputs, execution_count: null })
            }
          }
        })
      }
    })

    return JSON.stringify({
      nbformat: 4, nbformat_minor: 5,
      metadata: { kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' }, language_info: { name: 'python', version: '3.11.0' } },
      cells
    }, null, 1)
  }

  const generateFile = () => exportLanguage === 'r' ? generateRFile() : generatePythonFile()

  const handleDownload = () => {
    const blob = new Blob([generateFile()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportLanguage === 'r' ? 'dash_analysis.R' : 'dash_analysis.py'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadNotebook = () => {
    const blob = new Blob([generateNotebook()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dash_analysis.ipynb'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateFile())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="w-80 border-l border-[var(--border)] flex flex-col h-full" style={{ background: 'var(--bg-warm)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-s)]">
        <span className="text-[13px] font-semibold text-[var(--ink)]">Executed Code</span>
        <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center text-[var(--ink-3)] hover:bg-[var(--bg-sunken)] transition-colors">
          <CloseIcon />
        </button>
      </div>

      <div className="flex gap-1.5 px-4 py-2.5 border-b border-[var(--border-s)]">
        <button
          onClick={handleDownload}
          disabled={codeBlocks.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ink)] hover:opacity-90 text-white text-[11px] font-medium rounded-md disabled:opacity-30 transition-colors"
        >
          ↓ {exportLanguage === 'r' ? '.R' : '.py'}
        </button>
        <button
          onClick={handleDownloadNotebook}
          disabled={codeBlocks.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ink)] hover:opacity-90 text-white text-[11px] font-medium rounded-md disabled:opacity-30 transition-colors"
        >
          ↓ .ipynb
        </button>
        <button
          onClick={handleCopy}
          disabled={codeBlocks.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-raised)] text-[var(--ink-2)] text-[11px] font-medium rounded-md disabled:opacity-30 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy all'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {codeBlocks.length === 0 ? (
          <div className="text-center py-12 text-[var(--ink-4)]">
            <p className="text-xs">No code generated yet.</p>
            <p className="text-[10px] mt-1">Ask Dash to query data or create charts.</p>
          </div>
        ) : (
          codeBlocks.map((block, i) => <CodeBlockItem key={i} block={block} />)
        )}
      </div>

      {codeBlocks.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[var(--border-s)]">
          <p className="text-[10px] text-[var(--ink-4)] text-center">Export to run locally with your database</p>
        </div>
      )}
    </div>
  )
}

// Tool call — color-coded, dark code, shimmer loaders
function ToolCall({ tool, running }) {
  const [open, setOpen] = useState(false)
  const [copiedQuery, setCopiedQuery] = useState(false)
  const [copiedResult, setCopiedResult] = useState(false)

  const name = tool.name || 'Tool'
  const query = tool.args?.query || tool.args?.sql || tool.args?.search_query || tool.args?.code
  const meta = getToolMeta(name)

  let codeType = 'python'
  if (name.includes('sql') || name.includes('query') || tool.args?.query || tool.args?.sql) codeType = 'sql'
  else if (name.includes('run_r') || name.includes('r_code') || name.includes('r_chart')) codeType = 'r'

  const handleCopyQuery = async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(query)
    setCopiedQuery(true)
    setTimeout(() => setCopiedQuery(false), 1500)
  }

  const handleCopyResult = async (e) => {
    e.stopPropagation()
    const text = typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)
    await navigator.clipboard.writeText(text)
    setCopiedResult(true)
    setTimeout(() => setCopiedResult(false), 1500)
  }

  return (
    <div className="border border-[var(--border)] rounded-lg my-2 overflow-hidden bg-[var(--bg)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--bg-raised)] text-left transition-colors"
        style={{ background: open ? 'var(--bg-raised)' : undefined }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.icon}
        </div>
        <span className="flex-1 font-mono text-[11px] font-medium text-[var(--ink-2)]">{name}</span>
        {running ? (
          <span className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--yellow)' }}>
            <span className="w-[5px] h-[5px] rounded-full pulse-dot" style={{ background: 'var(--yellow)' }} />
            Running...
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--green)' }}>
            <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--green)' }} />
            Done
          </span>
        )}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-[var(--border-s)] space-y-0">
          {query && (
            <div className="relative group">
              <pre
                className="p-3 pr-10 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed"
                style={{ background: 'var(--code-bg)', color: '#E2E8F0' }}
                dangerouslySetInnerHTML={{ __html: highlightCode(query, codeType) }}
              />
              <button
                onClick={handleCopyQuery}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                title="Copy code"
              >
                {copiedQuery ? <CheckIcon /> : <CopyIcon size={12} />}
              </button>
            </div>
          )}
          {!query && tool.args && Object.keys(tool.args).length > 0 && (
            <div className="p-3">
              <pre className="text-[10px] font-mono text-[var(--ink-2)] overflow-x-auto">{JSON.stringify(tool.args, null, 2)}</pre>
            </div>
          )}
          {tool.result && (
            <div className="border-t border-[var(--border-s)]">
              {typeof tool.result === 'string' && tool.result.includes('[CHART_BASE64]') ? (
                <div className="px-3 py-2 text-[11px] font-medium" style={{ color: 'var(--green)', background: 'var(--green-s)' }}>
                  Chart generated successfully
                </div>
              ) : typeof tool.result === 'string' && tool.result.includes('[D3_CHART]') ? (
                <div className="px-3 py-2 text-[11px] font-medium" style={{ color: 'var(--orange)', background: 'var(--orange-s)' }}>
                  D3.js chart generated successfully
                </div>
              ) : (
                <div className="relative group" style={{ background: 'var(--bg-warm)' }}>
                  <pre className="p-3 pr-10 text-[10px] font-mono overflow-x-auto max-h-[160px] whitespace-pre-wrap text-[var(--ink-2)]">
                    {typeof tool.result === 'string' ? tool.result.slice(0, 1500) + (tool.result.length > 1500 ? '\n...' : '') : JSON.stringify(tool.result, null, 2)}
                  </pre>
                  <button
                    onClick={handleCopyResult}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--bg-sunken)] hover:bg-[var(--border)] text-[var(--ink-4)] hover:text-[var(--ink)] opacity-0 group-hover:opacity-100 transition-all"
                    title="Copy result"
                  >
                    {copiedResult ? <CheckIcon /> : <CopyIcon size={12} />}
                  </button>
                </div>
              )}
            </div>
          )}
          {running && !tool.result && (
            <div className="p-3 space-y-2" style={{ background: 'var(--bg-raised)' }}>
              <div className="h-2.5 w-3/4 rounded shimmer-loader" />
              <div className="h-2.5 w-1/2 rounded shimmer-loader" />
              <div className="h-2.5 w-2/3 rounded shimmer-loader" />
              <div className="h-2.5 w-[45%] rounded shimmer-loader" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Message component — right-aligned user bubbles, left-aligned assistant with red icon
function Message({ msg, msgIndex, onZoomChart, onEdit, loading }) {
  const isUser = msg.role === 'user'
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(msg.content || '')
  const editInputRef = useRef(null)

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (editText.trim() && editText !== msg.content) onEdit(msgIndex, editText.trim())
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(msg.content || '')
    setIsEditing(false)
  }

  // User message — right-aligned dark bubble
  if (isUser) {
    return (
      <div className="px-5 py-3 group/msg">
        <div className="flex justify-end">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="max-w-[75%] space-y-2 w-full">
              <textarea
                ref={editInputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--ink)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--red)] focus:border-transparent resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancel()
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(e) }
                }}
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={handleCancel} className="px-3 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-raised)] text-[var(--ink-2)] text-xs font-medium rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={!editText.trim()} className="px-3 py-1.5 bg-[var(--ink)] hover:opacity-90 text-white text-xs font-medium rounded-lg disabled:opacity-40 transition-colors">Save & Resend</button>
              </div>
            </form>
          ) : (
            <div className="relative group max-w-[75%]">
              <div
                className="px-4 py-3 text-[14px] leading-[1.5]"
                data-user-msg=""
                style={{ background: 'var(--ink)', color: 'var(--bg)', borderRadius: '12px 12px 3px 12px' }}
              >
                {msg.content}
              </div>
              {!loading && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--bg-raised)] text-[var(--ink-4)] hover:text-[var(--ink-2)] opacity-0 group-hover:opacity-100 transition-all"
                  title="Edit and resend"
                >
                  <EditIcon />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Assistant message — left-aligned with red icon
  return (
    <div className="px-5 py-3">
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ background: 'var(--red)' }}>
          D
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-[var(--ink)] mb-1.5">Dash</div>

          {msg.events?.map((event, i) => (
            <div key={i} className="mb-2">
              {event.type === 'tool' && event.tool && (
                <>
                  <ToolCall tool={event.tool} running={event.tool.isRunning} />
                  {event.tool.result && (() => {
                    const chartBase64 = extractChart(event.tool.result)
                    if (chartBase64) return <ChartImage base64={chartBase64} onZoom={onZoomChart} />
                    const d3Chart = extractD3Chart(event.tool.result)
                    if (d3Chart) return <D3Chart code={d3Chart.code} data={d3Chart.data} />
                    return null
                  })()}
                </>
              )}
              {event.type === 'text' && event.content && (
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(event.content) }} />
              )}
            </div>
          ))}

          {!msg.events && msg.content && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
          )}
        </div>
      </div>
    </div>
  )
}

// Streaming message — bouncing dots, blinking cursor
function StreamingMsg({ events, onZoomChart }) {
  return (
    <div className="px-5 py-3">
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ background: 'var(--red)' }}>
          D
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-[var(--ink)] mb-1.5">Dash</div>

          {events.length === 0 ? (
            <div className="flex items-center gap-2 py-1">
              <div className="flex gap-1">
                <span className="w-[5px] h-[5px] rounded-full dot-bounce" style={{ background: 'var(--red)' }} />
                <span className="w-[5px] h-[5px] rounded-full dot-bounce-2" style={{ background: 'var(--red)' }} />
                <span className="w-[5px] h-[5px] rounded-full dot-bounce-3" style={{ background: 'var(--red)' }} />
              </div>
              <span className="text-[12px] italic text-[var(--ink-3)]">Analyzing your request...</span>
            </div>
          ) : (
            events.map((event, i) => (
              <div key={i} className="mb-2">
                {event.type === 'tool' && event.tool && (
                  <>
                    <ToolCall tool={event.tool} running={event.tool.isRunning} />
                    {event.tool.result && (() => {
                      const chartBase64 = extractChart(event.tool.result)
                      if (chartBase64) return <ChartImage base64={chartBase64} onZoom={onZoomChart} />
                      const d3Chart = extractD3Chart(event.tool.result)
                      if (d3Chart) return <D3Chart code={d3Chart.code} data={d3Chart.data} />
                      return null
                    })()}
                  </>
                )}
                {event.type === 'text' && event.content && (
                  <div className="prose max-w-none cursor-blink" dangerouslySetInnerHTML={{ __html: renderMarkdown(event.content) }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Conversation Sidebar — persistent, date groups, language badges
function ConversationSidebar({ conversations, currentConversationId, onSelectConversation, onNewConversation, onDeleteConversation, isLoading }) {
  // Group conversations by date
  const groups = {}
  conversations.forEach(conv => {
    const date = conv.created_at ? new Date(conv.created_at) : new Date()
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    let label = 'Previous'
    if (diffDays === 0) label = 'Today'
    else if (diffDays === 1) label = 'Yesterday'
    else if (diffDays < 7) label = 'This Week'
    if (!groups[label]) groups[label] = []
    groups[label].push(conv)
  })

  return (
    <aside className="flex flex-col h-screen border-r border-[var(--border)] overflow-hidden" style={{ background: 'var(--bg-warm)' }}>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <button
          onClick={onNewConversation}
          className="text-[16px] font-medium cursor-pointer hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
        >
          <span style={{ color: 'var(--red)' }}>·</span> Dash
        </button>
        <button
          onClick={onNewConversation}
          className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)] transition-colors"
          title="New chat"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-[var(--ink-4)]">
            <SpinnerIcon size={18} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-[var(--ink-4)] text-[11px]">No conversations yet</div>
        ) : (
          Object.entries(groups).map(([label, convs]) => (
            <div key={label}>
              <div className="px-2 py-2 text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">{label}</div>
              {convs.map(conv => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors mb-px ${
                    conv.id === currentConversationId ? 'bg-[var(--bg-sunken)]' : 'hover:bg-[var(--bg-sunken)]/50'
                  }`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[12px] font-medium text-[var(--ink-2)]">{conv.title || 'New conversation'}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[var(--ink-4)]">{conv.message_count || 0} msgs</span>
                      <span
                        className="text-[8px] font-semibold uppercase tracking-wider px-1 py-px rounded"
                        style={{
                          background: conv.language === 'r' ? 'var(--purple-s)' : 'var(--blue-s)',
                          color: conv.language === 'r' ? 'var(--purple)' : 'var(--blue)',
                        }}
                      >
                        {conv.language === 'r' ? 'R' : 'PY'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id) }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--border)] text-[var(--ink-4)] hover:text-[var(--red)] transition-all"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-[var(--border-s)] flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--blue), var(--green))' }}>
          U
        </div>
        <span className="text-[12px] font-medium text-[var(--ink-2)]">User</span>
      </div>
    </aside>
  )
}

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamEvents, setStreamEvents] = useState([])
  const [zoomImage, setZoomImage] = useState(null)
  const [codePanelOpen, setCodePanelOpen] = useState(false)
  const [language, setLanguage] = useState('python')
  // sessionId is derived from conversationId — each conversation gets its own backend agent
  const sessionIdRef = useRef(generateSessionId())

  const [conversationId, setConversationId] = useState(null)
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(true)

  const endRef = useRef(null)
  const inputRef = useRef(null)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, streamEvents])

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { loadConversations() }, [])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const convId = params.get('c')
    if (convId) loadConversation(convId)
  }, [])

  const loadConversations = async () => {
    try {
      setConversationsLoading(true)
      const res = await fetch('http://localhost:8000/conversations')
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (e) { console.error('Failed to load conversations:', e) }
    finally { setConversationsLoading(false) }
  }

  const createNewConversation = async () => {
    try {
      const res = await fetch('http://localhost:8000/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language }) })
      const data = await res.json()
      return data.id
    } catch (e) { console.error('Failed to create conversation:', e); return null }
  }

  const saveMessages = async (convId, msgs) => {
    if (!convId) return
    try {
      await fetch(`http://localhost:8000/conversations/${convId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: msgs }) })
      loadConversations()
    } catch (e) { console.error('Failed to save messages:', e) }
  }

  const loadConversation = async (convId) => {
    try {
      const res = await fetch(`http://localhost:8000/conversations/${convId}`)
      const data = await res.json()
      // Each conversation uses its own session — no cross-contamination
      sessionIdRef.current = convId
      setConversationId(convId)
      setMessages(data.messages || [])
      setLanguage(data.language || 'python')
      window.history.replaceState(null, '', `?c=${convId}`)
      // Restore agent history so Claude can continue this conversation
      await fetch('http://localhost:8000/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: convId, messages: data.messages || [] }) })
    } catch (e) { console.error('Failed to load conversation:', e) }
  }

  const deleteConversation = async (convId) => {
    if (!confirm('Delete this conversation?')) return
    try {
      await fetch(`http://localhost:8000/conversations/${convId}`, { method: 'DELETE' })
      if (convId === conversationId) handleNewConversation()
      loadConversations()
    } catch (e) { console.error('Failed to delete conversation:', e) }
  }

  const handleNewConversation = async () => {
    // Generate a fresh session — completely isolated from previous conversations
    sessionIdRef.current = generateSessionId()
    setConversationId(null)
    setMessages([])
    window.history.replaceState(null, '', '/')
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  const handleEditMessage = async (msgIndex, newText) => {
    const truncatedMessages = messages.slice(0, msgIndex)
    setMessages(truncatedMessages)
    try {
      // Clear the agent and restore only the messages up to the edit point
      await fetch('http://localhost:8000/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionIdRef.current }) })
      if (truncatedMessages.length > 0) {
        await fetch('http://localhost:8000/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionIdRef.current, messages: truncatedMessages }) })
      }
    } catch (e) { console.error('Failed to clear session:', e) }
    setTimeout(() => send(newText), 100)
  }

  const send = async (text) => {
    if (!text.trim() || loading) return

    let currentConvId = conversationId
    if (!currentConvId) {
      currentConvId = await createNewConversation()
      if (currentConvId) {
        // Tie the session to this conversation — isolated backend agent
        sessionIdRef.current = currentConvId
        setConversationId(currentConvId)
        window.history.replaceState(null, '', `?c=${currentConvId}`)
      }
    }

    const userMessage = { role: 'user', content: text }
    setMessages(m => [...m, userMessage])
    setInput('')
    setLoading(true)
    setStreamEvents([])

    abortControllerRef.current = new AbortController()

    let events = []
    let currentTextContent = ''
    let tools = {}

    try {
      const res = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionIdRef.current, language }),
        signal: abortControllerRef.current.signal,
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6))
              if (d.type === 'tool_start') {
                if (currentTextContent.trim()) {
                  events = [...events, { type: 'text', content: currentTextContent }]
                  currentTextContent = ''
                }
                const toolId = `${d.name}_${Date.now()}`
                tools[toolId] = { id: toolId, name: d.name, args: d.args, result: null, isRunning: true }
                events = [...events, { type: 'tool', toolId }]
                setStreamEvents([...events].map(e => e.type === 'tool' ? { ...e, tool: tools[e.toolId] } : e))
              } else if (d.type === 'tool_complete') {
                const toolId = Object.keys(tools).find(id => tools[id].name === d.name && tools[id].isRunning)
                if (toolId) {
                  tools[toolId] = { ...tools[toolId], result: d.result, isRunning: false, args: d.args }
                  setStreamEvents([...events].map(e => e.type === 'tool' ? { ...e, tool: tools[e.toolId] } : e))
                }
              } else if (d.type === 'delta') {
                currentTextContent += d.content
                const displayEvents = [...events]
                if (currentTextContent.trim()) displayEvents.push({ type: 'text', content: currentTextContent })
                setStreamEvents(displayEvents.map(e => e.type === 'tool' ? { ...e, tool: tools[e.toolId] } : e))
              } else if (d.type === 'content') {
                currentTextContent = d.content
                const displayEvents = [...events]
                if (currentTextContent.trim()) displayEvents.push({ type: 'text', content: currentTextContent })
                setStreamEvents(displayEvents.map(e => e.type === 'tool' ? { ...e, tool: tools[e.toolId] } : e))
              } else if (d.type === 'done') {
                if (currentTextContent.trim()) events = [...events, { type: 'text', content: currentTextContent }]
                const finalEvents = events.map(e => e.type === 'tool' ? { ...e, tool: { ...tools[e.toolId], isRunning: false } } : e)
                const assistantMessage = { role: 'assistant', events: finalEvents }
                setMessages(m => {
                  const newMessages = [...m, assistantMessage]
                  if (currentConvId) saveMessages(currentConvId, newMessages)
                  return newMessages
                })
                setStreamEvents([])
                setLoading(false)
                return
              } else if (d.type === 'error') {
                throw new Error(d.error)
              }
            } catch (e) { }
          }
        }
      }
      if (currentTextContent.trim()) events = [...events, { type: 'text', content: currentTextContent }]
      if (events.length) {
        const finalEvents = events.map(e => e.type === 'tool' ? { ...e, tool: tools[e.toolId] } : e)
        setMessages(m => [...m, { role: 'assistant', events: finalEvents }])
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        if (currentTextContent.trim() || events.length > 0) {
          if (currentTextContent.trim()) events = [...events, { type: 'text', content: currentTextContent + '\n\n*[Response stopped]*' }]
          const finalEvents = events.map(ev => ev.type === 'tool' ? { ...ev, tool: { ...tools[ev.toolId], isRunning: false } } : ev)
          setMessages(m => [...m, { role: 'assistant', events: finalEvents }])
        }
      } else {
        setMessages(m => [...m, { role: 'assistant', events: [{ type: 'text', content: `Error: ${e.message}` }] }])
      }
    } finally {
      setLoading(false)
      setStreamEvents([])
      abortControllerRef.current = null
      inputRef.current?.focus()
    }
  }

  const suggestions = [
    { title: 'TidyTuesday dataset', description: 'Explore a community dataset from R4DS', query: 'I want to explore a TidyTuesday dataset! Fetch https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/README.md and parse the latest dataset table. Show me a few recent ones to pick from, then I\'ll choose which one to dive into.' },
    { title: 'Stock analysis', description: 'AMZN price trends with yfinance', query: 'Use yfinance to pull AMZN stock data for the past year. Plot the price with a 50-day moving average and highlight any big swings.' },
    { title: 'International football', description: '50k+ matches from 1872 to today', query: 'I want to explore international football match history. First, download and extract the data by running these shell commands via subprocess:\n\nimport subprocess\nsubprocess.run(["curl", "-L", "-o", "~/Downloads/all-international-football-results.zip", "https://www.kaggle.com/api/v1/datasets/download/patateriedata/all-international-football-results"], check=True)\nsubprocess.run(["unzip", "-o", "~/Downloads/all-international-football-results.zip", "-d", "~/Downloads/football-data/"], check=True)\n\nThen load the CSVs from ~/Downloads/football-data/. The dataset has two files:\n1. all_matches.csv (50,243 matches): columns are date, home_team, away_team, home_score, away_score, tournament, country, neutral\n2. countries_names.csv (289 teams): maps historical names to current names (e.g. West Germany -> Germany, Soviet Union -> Russia) with color_code for viz\n\nKey gotchas: scores include extra time but NOT penalty shootouts. Team names are historical (West Germany, not Germany for pre-1990). Missing dates default to Dec 31.\n\nShow me some interesting analyses to pick from -- like dominant teams by era, biggest upsets, home advantage trends, or World Cup patterns.' },
    { title: 'F1 database', description: 'Query the pre-loaded racing data', query: 'What tables are in the database? Show me who dominated each era of F1 with a chart.' },
    { title: 'StatsBomb football analytics', description: 'Match events, xG, passing networks, pitch maps', query: `I want to analyze football match data using StatsBomb's free data. First install the packages:

pip install statsbombpy mplsoccer

Here's what's available:

SETUP:
from statsbombpy import sb
from mplsoccer import Pitch, VerticalPitch
import pandas as pd

AVAILABLE FREE COMPETITIONS (use these competition_id and season_id values):
- La Liga (11): seasons 2004-2021 (season_ids: 37,38,39,40,41,21,22,23,24,25,26,27,2,1,4,42,90 and 1973/74=278)
- Champions League (16): 1970-2019 (season_ids: 276,71,277,76,44,37,39,41,21,22,23,24,25,26,27,2,1,4)
- FIFA World Cup (43): 1958,1962,1970,1974,1986,1990,2018,2022 (season_ids: 269,270,272,51,54,55,3,106)
- UEFA Euro (55): 2020,2024 (season_ids: 43,282)
- Premier League (2): 2003/04,2015/16 (season_ids: 44,27)
- Women's World Cup (72): 2019,2023 (season_ids: 30,107)
- FA WSL (37): 2018-2021 (season_ids: 4,42,90)
- Copa America (223): 2024 (season_id: 282)
- Serie A (12): 1986/87,2015/16 (season_ids: 86,27)
- Ligue 1 (7): 2015/16,2021/22,2022/23 (season_ids: 27,108,235)
- 1. Bundesliga (9): 2015/16,2023/24 (season_ids: 27,281)
- MLS (44): 2023 (season_id: 107)
- Indian Super League (1238): 2021/22 (season_id: 108)

KEY API FUNCTIONS:
1. sb.competitions() - list all competitions
2. sb.matches(competition_id=43, season_id=106) - matches for a competition/season
3. sb.lineups(match_id=3943043) - returns dict keyed by team name, each a DataFrame of players with positions list
4. sb.events(match_id=3943043) - all events (passes, shots, dribbles, tackles, etc.)
   - Use split=True to get separate DataFrames per event type
   - Key columns: type, player, team, location (list [x,y]), minute, second, period
   - Shot columns: shot_statsbomb_xg, shot_outcome, shot_body_part, shot_end_location, shot_freeze_frame
   - Pass columns: pass_end_location, pass_outcome (NaN=completed), pass_recipient, pass_height, pass_type
   - Completed passes have pass_outcome = NaN (not 'Complete')

COORDINATE EXTRACTION (location is a list [x,y]):
def safe_extract_coords(location):
    try:
        if isinstance(location, list) and len(location) >= 2:
            return pd.Series([float(location[0]), float(location[1])])
    except:
        pass
    return pd.Series([None, None])
events[['x', 'y']] = events['location'].apply(safe_extract_coords)

PITCH VISUALIZATION WITH MPLSOCCER:
from mplsoccer import Pitch
pitch = Pitch(pitch_type='statsbomb', pitch_color='#22312b', line_color='white')
fig, ax = pitch.draw(figsize=(12, 8))
pitch.scatter(x_coords, y_coords, ax=ax, s=100, color='red')
# Use VerticalPitch for vertical orientation
# StatsBomb pitch: 120x80, (0,0) = bottom-left, x=length, y=width

MATCH ANALYSIS FUNCTION - use this pattern for comprehensive analysis:
def analyze_match(match_id):
    events = sb.events(match_id=match_id)
    lineups = sb.lineups(match_id=match_id)
    teams = events['possession_team'].dropna().unique()
    home_team = events[events['type'] == 'Starting XI']['team'].iloc[0]
    away_team = events[events['type'] == 'Starting XI']['team'].iloc[1]
    # Build name_map from lineups for short names
    name_map = {}
    for team_name in lineups.keys():
        for idx, player in lineups[team_name].iterrows():
            name_map[player['player_name']] = player['player_nickname'] if pd.notna(player['player_nickname']) else player['player_name']
    # Filter event types
    passes = events[events['type'] == 'Pass'].copy()
    shots = events[events['type'] == 'Shot'].copy()
    goals = shots[shots['shot_outcome'] == 'Goal']
    # Completed passes: pass_outcome is NaN
    completed = passes[passes['pass_outcome'].isna()]
    # xG analysis
    total_xg = shots['shot_statsbomb_xg'].sum()

Show me a list of interesting matches to pick from. I'd love to see:
- A famous World Cup or Euro match
- Shot maps and passing networks on a pitch visualization
- xG timeline and key player stats

Let me choose which match to deep-dive into.` },
    { title: 'World Bank indicators', description: 'GDP, population, or climate data', query: 'Fetch GDP per capita data from the World Bank API for the G7 countries over the last 20 years. Chart the trends and note anything surprising.' },
  ]

  const codeBlockCount = messages.reduce((count, msg) => {
    if (msg.role === 'assistant' && msg.events) {
      msg.events.forEach(event => {
        if (event.type === 'tool' && event.tool) {
          if ((event.tool.name === 'run_sql' && event.tool.args?.query) ||
              ((event.tool.name === 'run_code' || event.tool.name === 'run_code_and_get_chart') && event.tool.args?.code) ||
              ((event.tool.name === 'run_r_code' || event.tool.name === 'run_r_chart') && event.tool.args?.code)) {
            count++
          }
        }
      })
    }
    return count
  }, 0)

  // Current conversation title
  const currentTitle = conversations.find(c => c.id === conversationId)?.title

  // Grid columns: sidebar + main + optional code panel
  const gridCols = codePanelOpen ? '240px 1fr' : '240px 1fr'

  return (
    <div className="grid h-screen bg-[var(--bg)]" style={{ gridTemplateColumns: gridCols }}>
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={conversationId}
        onSelectConversation={loadConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        isLoading={conversationsLoading}
      />

      {/* Main + Code Panel wrapper */}
      <div className="flex min-w-0 h-full overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-[var(--border-s)] bg-[var(--bg)] sticky top-0 z-10">
            <div className="px-5 h-12 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[14px] font-semibold text-[var(--ink)]">{currentTitle || 'New conversation'}</h1>
                <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'var(--green-s)', color: 'var(--green)' }}>
                  <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--green)' }} />
                  Connected
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: language === 'r' ? 'var(--purple-s)' : 'var(--blue-s)',
                    color: language === 'r' ? 'var(--purple)' : 'var(--blue)',
                  }}
                >
                  {language === 'r' ? 'R' : 'Python'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleNewConversation}
                  className="h-7 px-2.5 rounded-md border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-raised)] text-[11px] font-medium text-[var(--ink-2)] flex items-center gap-1.5 transition-colors"
                >
                  ↺ Clear
                </button>
                <button
                  onClick={() => setCodePanelOpen(!codePanelOpen)}
                  className={`h-7 px-2.5 rounded-md border text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                    codePanelOpen
                      ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                      : 'border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-raised)] text-[var(--ink-2)]'
                  }`}
                >
                  ⟨/⟩ Code
                  {codeBlockCount > 0 && (
                    <span className={`text-[9px] px-1.5 py-px rounded-full ${codePanelOpen ? 'bg-white/20' : 'bg-[var(--bg-sunken)]'}`}>
                      {codeBlockCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Messages */}
          <main className="flex-1 overflow-y-auto">
            {messages.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
                {/* Red icon with glow */}
                <div className="relative w-14 h-14 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-xl opacity-20 blur-xl" style={{ background: 'var(--red)' }} />
                  <div
                    className="relative w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-[var(--sh-m)]"
                    style={{ background: 'var(--red)', fontFamily: 'var(--font-display)' }}
                  >
                    D
                  </div>
                </div>

                <h1 className="text-2xl text-[var(--ink)] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>
                  What do you want to explore?
                </h1>
                <p className="text-[14px] text-[var(--ink-3)] max-w-sm mx-auto mb-6 leading-relaxed">
                  Query databases, run analysis, and create visualizations with AI.
                </p>

                {/* Language toggle */}
                <div className="flex items-center gap-1 p-1 rounded-lg border border-[var(--border)] mb-8" style={{ background: 'var(--bg-raised)' }}>
                  <button
                    onClick={() => setLanguage('python')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                      language === 'python' ? 'bg-[var(--bg)] text-[var(--ink)] shadow-[var(--sh-s)]' : 'text-[var(--ink-3)] hover:text-[var(--ink-2)]'
                    }`}
                  >
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--blue)' }} />
                    Python
                  </button>
                  <button
                    onClick={() => setLanguage('r')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                      language === 'r' ? 'bg-[var(--bg)] text-[var(--ink)] shadow-[var(--sh-s)]' : 'text-[var(--ink-3)] hover:text-[var(--ink-2)]'
                    }`}
                  >
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--purple)' }} />
                    R / tidyverse
                  </button>
                </div>

                {/* Suggestion cards */}
                <div className="grid grid-cols-2 gap-3 max-w-2xl w-full">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s.query)}
                      className="text-left p-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:shadow-[var(--sh-s)] hover:-translate-y-px transition-all duration-150 group"
                    >
                      <div className="text-[13px] font-semibold text-[var(--ink)] mb-0.5">{s.title}</div>
                      <div className="text-[11px] text-[var(--ink-3)] leading-relaxed">{s.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full">
                {messages.map((m, i) => <Message key={i} msg={m} msgIndex={i} onZoomChart={setZoomImage} onEdit={handleEditMessage} loading={loading} />)}
                {loading && <StreamingMsg events={streamEvents} onZoomChart={setZoomImage} />}
                <div ref={endRef} className="h-6" />
              </div>
            )}
          </main>

          {/* Input */}
          <footer className="border-t border-[var(--border-s)] bg-[var(--bg)] px-5 py-3.5">
            <form onSubmit={e => { e.preventDefault(); send(input) }}>
              <div className="flex items-end gap-2 border border-[var(--border)] rounded-[10px] px-3 py-2 transition-all focus-within:border-[var(--ink)] focus-within:shadow-[var(--sh-m)]" style={{ background: 'var(--bg-raised)' }}>
                <button
                  type="button"
                  className="p-1 text-[var(--ink-4)] hover:text-[var(--ink-2)] rounded-md hover:bg-[var(--bg-sunken)] transition-colors flex-shrink-0"
                >
                  <PaperclipIcon />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about your data..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-[var(--ink)] placeholder-[var(--ink-4)] text-[13px] outline-none min-w-0 disabled:opacity-50"
                />
                {loading ? (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="w-7 h-7 rounded-lg bg-[var(--ink-3)] hover:bg-[var(--ink)] text-white flex items-center justify-center transition-colors flex-shrink-0"
                    title="Stop generating"
                  >
                    <StopIcon />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="w-7 h-7 rounded-lg bg-[var(--ink)] hover:opacity-90 text-white flex items-center justify-center disabled:opacity-30 transition-colors flex-shrink-0"
                  >
                    <SendIcon />
                  </button>
                )}
              </div>
            </form>
            <div className="text-center mt-2 text-[10px] text-[var(--ink-4)]">
              PostgreSQL connected · Python env · R available
            </div>
          </footer>

          {/* Zoom Modal */}
          {zoomImage && <ImageModal src={zoomImage} onClose={() => setZoomImage(null)} />}
        </div>

        {/* Code Panel */}
        <CodePanel
          messages={messages}
          isOpen={codePanelOpen}
          onClose={() => setCodePanelOpen(false)}
          language={language}
        />
      </div>
    </div>
  )
}
