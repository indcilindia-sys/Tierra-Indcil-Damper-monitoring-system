# Indcel Damper Monitor

A responsive, static React dashboard for the ON/OFF records stored by the Google Apps Script endpoint. It only performs `?action=read` requests; it never writes to the sheet or contacts the ESP32.

## Run locally

```bash
npm install
npm run dev
```

### Install on a new Windows PC

Copy the complete project folder by pendrive, then double-click `INSTALL-AND-START-DASHBOARD.bat`. On first use it installs Node.js LTS (with Windows Package Manager), downloads the dashboard packages, starts the local server, and opens `http://localhost:5173`.

The new PC needs an internet connection for the one-time Node.js/package installation and for live Google Sheets data. If Windows Package Manager is unavailable, install the Node.js **LTS** version from [nodejs.org](https://nodejs.org/) and run the batch file again. There is no need to install Python, Arduino IDE, a database, or a separate web server for the dashboard.

The endpoint supplied for this project is already configured in `src/config/config.js`. For a different deployment, create a `.env` file from `.env.example` and set `VITE_GOOGLE_SCRIPT_URL` to the deployed `/exec` URL. Environment configuration takes precedence over the fallback setting.

## Build and deploy

```bash
npm run build
```

Deploy the generated `dist` directory to Vercel, Netlify, GitHub Pages, or Cloudflare Pages. Add `VITE_GOOGLE_SCRIPT_URL` to that platform's build environment if needed. The Apps Script web app must be deployed with public access so browsers can read it.

## Reporting and date logic

The UI uses the `Asia/Kolkata` time represented in Sheets, rather than the browser time zone. Filters include ON periods that began before the selected start date and end them at the selected boundary. Likewise, an unfinished ON period is counted through the end of the selected date. The live current-duration card updates every second and records refresh every 10 seconds without changing the active range.

**Print PDF** generates an A4 report containing only the active date range, its summary, and its visible event table.
