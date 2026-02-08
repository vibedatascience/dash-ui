# Dash UI

Next.js frontend for [Dash](https://github.com/vibedatascience/dash_trial), an AI data agent powered by Claude.

## Setup

```sh
npm install
npm run dev
```

Requires the backend API running on port 8000. See [dash_trial](https://github.com/vibedatascience/dash_trial) for backend setup.

## Features

- **Chat interface** with SSE streaming and real-time tool execution display
- **Chart rendering** — matplotlib/ggplot2 (base64 images) and D3.js (sandboxed iframes)
- **Python/R toggle** — choose your preferred language for analysis
- **Conversation sidebar** with persistence and URL permalinks (`?c=<uuid>`)
- **Code panel** — view all executed code with export to `.py`, `.R`, or `.ipynb`
- **Jupyter notebook export** — full conversation as a notebook with markdown cells (user questions + AI explanations), code cells, and captured outputs (text results + inline chart images)
- **Dark mode** — automatic via system preference

## Stack

- Next.js + React
- Tailwind CSS v4
- Fonts: Newsreader, Outfit, JetBrains Mono
