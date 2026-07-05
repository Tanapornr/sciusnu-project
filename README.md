# SCIUSNU SMART Project Submission

Minimal web frontend for the SCIUSNU project submission workflow.

## Structure

- `outputs/sciusnu-smart-style-code/` contains the source HTML, CSS, JS, and Apps Script files.
- `scripts/build-static.js` copies deployable frontend files to `dist/`.
- `Code.gs` and `appsscript.json` inside the source folder are for Google Apps Script setup.

## Deploy

Vercel runs:

```bash
npm run build
```

The deployed static site is generated into `dist/`.

## Backend Setup

Deploy `outputs/sciusnu-smart-style-code/Code.gs` as a Google Apps Script Web App, then put the `/exec` URL into `outputs/sciusnu-smart-style-code/config.js` or set `APPS_SCRIPT_URL` during build.
