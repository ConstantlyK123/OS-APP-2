# Offshore Worker Capture App v2.0

GitHub Pages-ready version of the offshore worker capture app.

## Files

- `index.html` — main app page
- `assets/css/styles.css` — styling
- `assets/js/app.js` — app functionality
- `assets/images/` — optional app icon/logo folder
- `.nojekyll` — keeps GitHub Pages simple

## Features

- Capture offshore worker details
- Multiple job type/trade tick boxes
- Editable job type list in Settings
- Certificates/tickets tick-box checklist
- Editable certificate/ticket list in Settings
- Searchable records
- WhatsApp contact buttons
- Print/PDF worker profile
- Select workers and export CSV
- Export full backup as JSON

## GitHub Pages setup

1. Upload all files and folders to a GitHub repository.
2. Go to Settings → Pages.
3. Source: Deploy from a branch.
4. Branch: `main`, folder: `/ root`.
5. Open the GitHub Pages URL on iPad Safari.

## Important

Records are stored locally in the browser/iPad storage, not on GitHub.
Use Export Backup regularly.


## Google Sheets sync

Connected Apps Script endpoint:

`https://script.google.com/macros/s/AKfycbzhmbogSOzDk89eiRkRhA8rSMetbWTDiRUojequJ7tXs10E4X1kxGLHfRScZpvnO7U/exec`

Records save locally first, then post to Google Sheets. Use the Refresh Sheet button to pull records saved from other devices.
