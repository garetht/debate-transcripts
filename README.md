# debate-transcripts

## Web app

The Vite app inside `web/` powers the public site.

- Local dev: `cd web && npm install && npm run dev`
- Static build: `cd web && npm run build` (outputs to `web/dist`)
- Deployment: pushes to `main` trigger `.github/workflows/build-and-deploy.yml`, which builds the app and publishes `web/dist` to GitHub Pages at `https://garetht.github.io/debate-transcripts/`
