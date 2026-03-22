/**
 * Price in INR — Content Script
 * Detects prices in multiple currencies and shows INR equivalent on hover.
 * Bare "$" defaults to a user-configurable currency (CAD by default).
 */

// ── Settings (loaded from chrome.storage.sync) ─────────────────────
let defaultCurrency = 'CAD';
let taxRate = 0.13;

chrome.storage.sync.get({ defaultCurrency: 'CAD', taxRate: 13 }, (s) => {
  defaultCurrency = s.defaultCurrency;
  taxRate = s.taxRate / 100;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.defaultCurrency) defaultCurrency = changes.defaultCurrency.newValue;
  if (changes.taxRate)         taxRate = changes.taxRate.newValue / 100;
});

// ── Currency patterns ──────────────────────────────────────────────
// Explicit prefixes are matched first; bare "$" falls through to the
// configurable default at the bottom of the list.
const CURRENCY_PATTERNS = [
  { regex: /\b(CA\$|CAD\s*\$?|C\$)\s*([\d,]+(?:\.\d{1,2})?)/gi,  code: 'CAD' },
  { regex: /\bCAD\s+([\d,]+(?:\.\d{1,2})?)/gi,                    code: 'CAD', singleGroup: true },
  { regex: /\b(US\$|USD\s*\$?)\s*([\d,]+(?:\.\d{1,2})?)/gi,       code: 'USD' },
  { regex: /\bUSD\s+([\d,]+(?:\.\d{1,2})?)/gi,                     code: 'USD', singleGroup: true },
  { regex: /\b(A\$|AUD\s*\$?)\s*([\d,]+(?:\.\d{1,2})?)/gi,        code: 'AUD' },
  { regex: /\bAUD\s+([\d,]+(?:\.\d{1,2})?)/gi,                     code: 'AUD', singleGroup: true },
  { regex: /€\s*([\d,]+(?:\.\d{1,2})?)/g,                          code: 'EUR', singleGroup: true },
  { regex: /\bEUR\s+([\d,]+(?:\.\d{1,2})?)/gi,                     code: 'EUR', singleGroup: true },
  { regex: /£\s*([\d,]+(?:\.\d{1,2})?)/g,                          code: 'GBP', singleGroup: true },
  { regex: /\bGBP\s+([\d,]+(?:\.\d{1,2})?)/gi,                     code: 'GBP', singleGroup: true },
  // Bare "$" — uses the user's chosen default currency
  { regex: /(?<!\w)\$\s*([\d,]+(?:\.\d{1,2})?)/g,                  code: null,  singleGroup: true },
];

// ── Exchange-rate cache ────────────────────────────────────────────
let ratesCache   = {};
let ratesFetched = false;
let fetchPromise = null;

async function getRates() {
  if (ratesFetched) return ratesCache;
  if (fetchPromise)  return fetchPromise;

  fetchPromise = fetch('https://open.er-api.com/v6/latest/INR')
    .then(r => r.json())
    .then(data => {
      if (data && data.rates) {
        Object.entries(data.rates).forEach(([code, rate]) => {
          ratesCache[code] = 1 / rate;
        });
        ratesFetched = true;
      }
      return ratesCache;
    })
    .catch(() => {
      fetchPromise = null;
      return {};
    });

  return fetchPromise;
}

getRates();

// ── Tooltip element ────────────────────────────────────────────────
const tooltip = document.createElement('div');
tooltip.id = 'inr-price-tooltip';
document.body.appendChild(tooltip);

let hideTimer = null;

function showTooltip(x, y, html) {
  clearTimeout(hideTimer);
  tooltip.innerHTML = html;
  tooltip.classList.add('visible');

  const pad = 12;
  tooltip.style.left = '0px';
  tooltip.style.top  = '0px';
  tooltip.style.left = Math.min(x + 14, window.innerWidth  - tooltip.offsetWidth  - pad) + 'px';
  tooltip.style.top  = Math.max(y - tooltip.offsetHeight - 10, pad) + 'px';
}

function hideTooltip() {
  hideTimer = setTimeout(() => tooltip.classList.remove('visible'), 120);
}

// ── Price detection ────────────────────────────────────────────────
function extractPrice(text) {
  for (const cfg of CURRENCY_PATTERNS) {
    cfg.regex.lastIndex = 0;
    const m = cfg.regex.exec(text.trim());
    if (!m) continue;

    let amount;
    if (cfg.singleGroup) {
      amount = parseFloat(m[1].replace(/,/g, ''));
    } else {
      amount = parseFloat(m[2].replace(/,/g, ''));
    }

    if (!isNaN(amount)) {
      const code = cfg.code || defaultCurrency;
      return { code, amount };
    }
  }
  return null;
}

// ── Hover handler ─────────────────────────────────────────────────
document.addEventListener('mouseover', async (e) => {
  const el = e.target;
  if (!el || el === tooltip) return;

  const raw = el.textContent || '';
  if (raw.length > 200) return;

  const found = extractPrice(raw.trim());
  if (!found) return;

  const rates = await getRates();
  const rate  = rates[found.code];
  if (!rate) return;

  const inr   = found.amount * rate;
  const tax   = found.amount * taxRate * rate;
  const total = inr + tax;
  const rawPct = taxRate * 100;
  const taxPct = rawPct % 1 === 0 ? rawPct.toFixed(0) : rawPct.toFixed(3).replace(/0+$/, '');

  const fmt = (v) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(v);

  showTooltip(e.clientX, e.clientY,
    `<span class="inr-flag">🇮🇳</span>
     <span class="inr-amount">${fmt(inr)}</span>
     <span class="inr-tax">+ Tax ${taxPct}%: ${fmt(tax)}</span>
     <span class="inr-divider"></span>
     <span class="inr-total">Total: ${fmt(total)}</span>
     <span class="inr-rate">1 ${found.code} ≈ ₹${rate.toFixed(2)}</span>`
  );
});

document.addEventListener('mouseout', (e) => {
  if (e.target !== tooltip) hideTooltip();
});
document.addEventListener('scroll', hideTooltip, { passive: true });
