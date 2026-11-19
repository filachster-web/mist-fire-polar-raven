# Folio

Folio turns AI chat archives into readable documents. Drop a file, a folder, a ZIP, or paste a link. The app detects ChatGPT exports, Claude exports, Markdown transcripts, HTML transcripts, JSON, CSV and plain text, then shows the result as a document, a spreadsheet or a diagram.

Processing happens in the browser. A link is fetched by the server only when you paste a URL, so private exports never need to be uploaded.

## Export

- Word (`.docx`, also opens in Google Docs)
- Excel (`.xlsx`)
- PDF via the print dialog
- A self-contained HTML page you can host anywhere
- Markdown
- An SVG diagram
- A local view link for this browser

## Develop

```bash
npm install
npm run dev
```

## Deploy

The app is a TanStack Start project. Push the repository to GitHub and import it on Vercel. `npm run build` produces the server output. File parsing stays on the client, so the deployment does not need a database.
