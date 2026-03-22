/**
 * Price in INR — Popup Script
 * Manages user settings: default currency, region, and tax rate.
 */

const TAX_RATES = {
  // Canadian provinces & territories (combined GST + PST/HST)
  'CA-AB': 5,
  'CA-BC': 12,
  'CA-MB': 12,
  'CA-NB': 15,
  'CA-NL': 15,
  'CA-NS': 15,
  'CA-NT': 5,
  'CA-NU': 5,
  'CA-ON': 13,
  'CA-PE': 15,
  'CA-QC': 14.975,
  'CA-SK': 11,
  'CA-YT': 5,

  // US states (state-level sales tax only)
  'US-AL': 4,
  'US-AK': 0,
  'US-AZ': 5.6,
  'US-AR': 6.5,
  'US-CA': 7.25,
  'US-CO': 2.9,
  'US-CT': 6.35,
  'US-DE': 0,
  'US-DC': 6,
  'US-FL': 6,
  'US-GA': 4,
  'US-HI': 4,
  'US-ID': 6,
  'US-IL': 6.25,
  'US-IN': 7,
  'US-IA': 6,
  'US-KS': 6.5,
  'US-KY': 6,
  'US-LA': 4.45,
  'US-ME': 5.5,
  'US-MD': 6,
  'US-MA': 6.25,
  'US-MI': 6,
  'US-MN': 6.875,
  'US-MS': 7,
  'US-MO': 4.225,
  'US-MT': 0,
  'US-NE': 5.5,
  'US-NV': 6.85,
  'US-NH': 0,
  'US-NJ': 6.625,
  'US-NM': 5.125,
  'US-NY': 4,
  'US-NC': 4.75,
  'US-ND': 5,
  'US-OH': 5.75,
  'US-OK': 4.5,
  'US-OR': 0,
  'US-PA': 6,
  'US-RI': 7,
  'US-SC': 6,
  'US-SD': 4.5,
  'US-TN': 7,
  'US-TX': 6.25,
  'US-UT': 6.1,
  'US-VT': 6,
  'US-VA': 5.3,
  'US-WA': 6.5,
  'US-WV': 6,
  'US-WI': 5,
  'US-WY': 4,
};

const DEFAULTS = {
  defaultCurrency: 'CAD',
  region: '',
  taxRate: 13,
};

const $currency = document.getElementById('defaultCurrency');
const $region   = document.getElementById('region');
const $taxRate  = document.getElementById('taxRate');
const $savedMsg = document.getElementById('savedMsg');

let saveTimeout = null;

function flashSaved() {
  $savedMsg.classList.add('show');
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => $savedMsg.classList.remove('show'), 1200);
}

function save(data) {
  chrome.storage.sync.set(data, flashSaved);
}

// Load saved settings on popup open
chrome.storage.sync.get(DEFAULTS, (settings) => {
  $currency.value = settings.defaultCurrency;
  $region.value   = settings.region;
  $taxRate.value  = settings.taxRate;
});

$currency.addEventListener('change', () => {
  save({ defaultCurrency: $currency.value });
});

$region.addEventListener('change', () => {
  const region = $region.value;
  const rate = TAX_RATES[region];
  if (rate !== undefined) {
    $taxRate.value = rate;
    save({ region, taxRate: rate });
  } else {
    save({ region });
  }
});

$taxRate.addEventListener('input', () => {
  const val = parseFloat($taxRate.value);
  if (!isNaN(val) && val >= 0 && val <= 100) {
    save({ taxRate: val });
  }
});
