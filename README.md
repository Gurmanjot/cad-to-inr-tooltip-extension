# Price in INR

A lightweight Chrome extension for Indians living in Canada. Hover over any dollar amount on any webpage and instantly see its equivalent in Indian Rupees (₹) — with Ontario HST (13%) calculated and included.

## Features

- **Hover to convert** — move your mouse over any CAD price (`$`, `CA$`, `C$`, `CAD`) and a sleek tooltip appears with the INR equivalent
- **HST included** — automatically adds Ontario's 13% HST so you see the real total cost
- **Live exchange rates** — fetches real-time CAD → INR rates from the [Open Exchange Rates API](https://open.er-api.com/)
- **Works everywhere** — runs on all websites, no configuration needed
- **Minimal & fast** — no popup, no background service worker, no permissions beyond the exchange rate API

## How It Works

1. The content script scans text under your cursor for price patterns (`$99.99`, `CA$50`, `CAD 120`, etc.)
2. It fetches the latest CAD/INR exchange rate (cached after the first call)
3. A tooltip appears showing:
   - Base price in ₹
   - HST 13% in ₹
   - Total in ₹
   - Current exchange rate

## Installation

1. Clone this repo or download the ZIP
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select this folder
5. Browse any website — hover over a dollar amount to see the tooltip

## Tech

- Manifest V3 Chrome Extension
- Vanilla JavaScript — no frameworks, no build step
- [Open Exchange Rates API](https://open.er-api.com/) (free, no key required)
