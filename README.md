# Build the Pyramid! Guide

Independent English fan guide for Build the Pyramid! on Roblox by Janitors Studios. The site covers codes, beginner progression, upgrades, training, gamepasses, the Free Gift and community links.

Production address: https://build-the-pyramid.github.io/

## Development and checks

```sh
npm ci
npm run dev
```

Before publishing:

```sh
npm run typecheck
npm run lint
npm run validate
npm run build
npm run audit:seo
```

`build:site` performs the same static export as `build`. The SEO audit checks exported HTML, exact titles and descriptions, visible content, links, schema, sitemap, robots and asset paths. Content lives in `content/generated/`; the eight launch URLs are defined in `scripts/launch-blueprint.json`. About, Privacy, Terms and Copyright are noindex utility pages outside the sitemap.

## GitHub Pages

The deployment workflow builds `out/`, runs all checks and publishes through GitHub Pages. This project uses the account-root domain with an empty base path and no custom domain. Set Pages to use GitHub Actions in the destination repository. No repository URL is displayed in the site.

Analytics, search-engine verification and native advertising are optional. Use the names in `.env.example` to supply environment values; absent values leave the services disabled. Never commit private environment files. GA uses `NEXT_PUBLIC_GA_MEASUREMENT_ID` consistently in configuration and the workflow.

Code rewards and gift requirements use the October 1, 2026 snapshot. Pass names, descriptions and prices were checked against the public Roblox catalogue on that date. Update the visible date whenever you review changing information; do not automatically claim a new review date at build time.

`npm run package` creates a source ZIP in `release/`, excluding dependencies, build output, Git history and private environment files.
