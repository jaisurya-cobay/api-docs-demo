# api-docs-demo

Demo of automated API docs: **code → openapi.json → Scalar → live site**. No docs are written by hand.

```
src/app.js                 routes + JSON schemas (the only thing a dev edits)
      │  npm run docs:generate   (scripts/export-openapi.js boots the app, reads the schemas)
      ▼
docs/openapi.json          generated, not committed
      │  GitHub Actions on every push to main
      ▼
docs/index.html (Scalar)   renders the interactive reference
      ▼
GitHub Pages               live docs site
```

## Run locally

```bash
npm ci
npm start        # API http://localhost:3000/api/tasks · Docs http://localhost:3000/docs (Try it works here)
npm run docs:generate   # write docs/openapi.json
```

## See it update

Add a route (with a `schema`) in `src/app.js`, push to `main`. The **API docs** workflow regenerates
`openapi.json` and redeploys the site, so the new endpoint appears without anyone touching docs.
