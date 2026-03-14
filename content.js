/**
 * Price in INR — Content Script
 * Detects CAD prices and shows INR equivalent on hover.
 * All "$" amounts are treated as CAD.
 */

// ── Ontario HST ────────────────────────────────────────────────────
const HST_RATE = 0.13;

// ── Currency config ────────────────────────────────────────────────
const CURRENCY_PATTERNS = [
  { regex: /\b(CA\$|CAD\s*\$?|C\$)\s*([\d,]+(?:\.\d{1,2})?)/gi,  code: 'CAD' },
  { regex: /\bCAD\s+([\d,]+(?:\.\d{1,2})?)/gi,                    code: 'CAD', singleGroup: true },
  { regex: /(?<!\w)\$\s*([\d,]+(?:\.\d{1,2})?)/g,                 code: 'CAD', singleGroup: true },
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

    if (!isNaN(amount)) return { code: 'CAD', amount };
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
  const tax   = found.amount * HST_RATE * rate;
  const total = inr + tax;

  const fmt = (v) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(v);

  showTooltip(e.clientX, e.clientY,
    `<span class="inr-flag">🇮🇳</span>
     <span class="inr-amount">${fmt(inr)}</span>
     <span class="inr-tax">+ HST 13%: ${fmt(tax)}</span>
     <span class="inr-divider"></span>
     <span class="inr-total">Total: ${fmt(total)}</span>
     <span class="inr-rate">1 CAD ≈ ₹${rate.toFixed(2)}</span>`
  );
});

document.addEventListener('mouseout', (e) => {
  if (e.target !== tooltip) hideTooltip();
});
document.addEventListener('scroll', hideTooltip, { passive: true });
