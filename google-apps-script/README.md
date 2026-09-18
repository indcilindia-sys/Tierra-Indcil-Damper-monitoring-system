# Duplicate-proof Google Apps Script

Use `Code.gs` to replace the existing Apps Script code, then deploy a **new Web App version**. It maintains the same endpoints:

- `?action=read`
- `?action=write&status=ON`
- `?action=write&status=OFF`

Each new event is inserted at row 2, directly beneath the header row, so the Sheet always shows the newest data first. Before inserting a write, it checks the newest saved status in row 2, column C. If the new status is the same, it returns `success: true` with `ignored: true` and does not add a row. This protects the Sheet even if a device retries a request or runs old firmware.

After saving: **Deploy → Manage deployments → Edit → New version → Deploy**. Keep the `/exec` URL in the ESP32 sketch and dashboard configuration.
