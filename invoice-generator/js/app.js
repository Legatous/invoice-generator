let itemCount = 0;
let logoDataUrl = null;

// Formats a number for display. Fiat-style values use 2 decimals; small
// values (common with crypto, e.g. 0.00034521) show up to 8 decimals with
// trailing zeros trimmed, so tiny crypto amounts stay readable instead of
// rounding to "0.00".
function formatNumber(value){
  value = Number(value) || 0;
  if(value === 0) return '0.00';
  const abs = Math.abs(value);
  if(abs < 1){
    let s = value.toFixed(8);
    s = s.replace(/0+$/, '');
    if(s.endsWith('.')) s += '00';
    const decimals = s.split('.')[1] ? s.split('.')[1].length : 0;
    if(decimals < 2) s = value.toFixed(2);
    return s;
  }
  return value.toFixed(2);
}

function handleLogoUpload(event){
  const file = event.target.files[0];
  if(!file) return;

  if(file.size > 2 * 1024 * 1024){
    alert('Please choose a PNG or JPEG image under 2MB.');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e){
    logoDataUrl = e.target.result;
    document.getElementById('logoImg').src = logoDataUrl;
    document.getElementById('logoImg').style.display = 'block';
    document.getElementById('logoPlaceholder').style.display = 'none';
    document.getElementById('logoRemoveBtn').style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

function removeLogo(){
  logoDataUrl = null;
  document.getElementById('logoInput').value = '';
  document.getElementById('logoImg').style.display = 'none';
  document.getElementById('logoImg').src = '';
  document.getElementById('logoPlaceholder').style.display = 'inline';
  document.getElementById('logoRemoveBtn').style.display = 'none';
}

function addItem(desc, qty, cost){
  itemCount++;
  const id = itemCount;
  const tbody = document.getElementById('itemsBody');
  const tr = document.createElement('tr');
  tr.id = 'item-row-' + id;
  tr.innerHTML = `
    <td><input type="text" id="desc-${id}" placeholder="Item description" value="${desc||''}" oninput="calcTotals()"></td>
    <td><input type="number" id="qty-${id}" value="${qty!==undefined?qty:1}" min="0" step="any" oninput="calcTotals()"></td>
    <td><input type="number" id="rate-${id}" value="${cost!==undefined?cost:0}" min="0" step="any" oninput="calcTotals()"></td>
    <td class="amt-cell" id="amt-${id}">0.00</td>
    <td><button class="remove-btn" onclick="removeItem(${id})" title="Remove item">&times;</button></td>
  `;
  tbody.appendChild(tr);
  calcTotals();
}

function removeItem(id){
  const row = document.getElementById('item-row-' + id);
  if(row) row.remove();
  calcTotals();
}

function calcTotals(){
  const rows = document.querySelectorAll('#itemsBody tr');
  let subTotal = 0;
  rows.forEach(row=>{
    const id = row.id.replace('item-row-','');
    const qty = parseFloat(document.getElementById('qty-'+id).value) || 0;
    const cost = parseFloat(document.getElementById('rate-'+id).value) || 0;
    const amt = qty * cost;
    document.getElementById('amt-'+id).textContent = formatNumber(amt);
    subTotal += amt;
  });
  const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
  const taxAmount = subTotal * (taxRate/100);
  const total = subTotal + taxAmount;

  document.getElementById('subTotalDisplay').textContent = formatNumber(subTotal);
  document.getElementById('taxAmountDisplay').textContent = formatNumber(taxAmount);
  document.getElementById('totalDisplay').textContent = formatNumber(total);
}

document.getElementById('taxRate').addEventListener('input', calcTotals);

// --- Country "Other" manual entry -----------------------------------------

function toggleOtherCountry(selectId, otherInputId){
  const select = document.getElementById(selectId);
  const otherInput = document.getElementById(otherInputId);
  if(select.value === 'Other'){
    otherInput.style.display = 'block';
    otherInput.focus();
  } else {
    otherInput.style.display = 'none';
    otherInput.value = '';
  }
}

// Returns the country name to actually display/print: the manually typed
// value when "Other" is selected, otherwise the dropdown's own value.
function resolveCountryDisplay(selectId, otherInputId){
  const select = document.getElementById(selectId);
  if(select.value === 'Other'){
    const typed = document.getElementById(otherInputId).value.trim();
    return typed || 'Other';
  }
  return select.value;
}

// --- Currency: presets + custom (fiat or crypto) --------------------------

// Common currency codes → symbol, used to auto-fill the symbol field when
// typing a custom currency code. Covers frequently-used fiat and crypto.
const CURRENCY_SYMBOL_MAP = {
  USD:'$', EUR:'€', GBP:'£', JPY:'¥', CAD:'C$', AUD:'A$', CHF:'CHF ', SEK:'kr',
  NOK:'kr', DKK:'kr', INR:'₹', BRL:'R$', MXN:'$', ZAR:'R', SGD:'S$', HKD:'HK$',
  NZD:'NZ$', CNY:'¥', KRW:'₩', PLN:'zł', TRY:'₺', AED:'د.إ', SAR:'﷼',
  BTC:'₿', ETH:'Ξ', USDT:'₮', USDC:'USDC ', BNB:'BNB ', SOL:'◎', XRP:'XRP ',
  ADA:'ADA ', DOGE:'Ð', DOT:'DOT ', LTC:'Ł', MATIC:'MATIC ', AVAX:'AVAX '
};

function toggleCustomCurrency(){
  const select = document.getElementById('currency');
  const box = document.getElementById('customCurrencyInputs');
  if(select.value === '__other__'){
    box.style.display = 'flex';
    document.getElementById('customCurrencyCode').focus();
  } else {
    box.style.display = 'none';
  }
}

function autofillCurrencySymbol(){
  const code = document.getElementById('customCurrencyCode').value.trim().toUpperCase();
  const symbolInput = document.getElementById('customCurrencySymbol');
  const known = CURRENCY_SYMBOL_MAP[code];
  if(known){
    symbolInput.value = known;
  } else if(!symbolInput.value && code){
    // Unknown code — fall back to showing the code itself as the symbol
    symbolInput.value = code + ' ';
  }
}

// Returns the symbol/prefix to actually use for amounts (custom currency
// symbol when "Other" is selected, otherwise the dropdown's own value).
function getCurrentCurrencySymbol(){
  const select = document.getElementById('currency');
  if(select.value === '__other__'){
    const symbol = document.getElementById('customCurrencySymbol').value.trim();
    const code = document.getElementById('customCurrencyCode').value.trim().toUpperCase();
    return symbol || (code ? code + ' ' : '');
  }
  return select.value;
}

// Standard tax system per country: label, default rate (%), and a short note
// shown when the rate can vary (state/province level, etc). reducedRate is
// the most common reduced rate where one exists (null if not applicable).
const COUNTRY_TAX_INFO = {
  'United States':   { label: 'Sales Tax', rate: 0,    reducedRate: null, note: 'Varies by state/local jurisdiction — set manually' },
  'United Kingdom':  { label: 'VAT',       rate: 20,   reducedRate: 5,    note: 'UK standard VAT rate' },
  'Canada':          { label: 'GST',       rate: 5,    reducedRate: 0,    note: 'Federal GST — provinces may add PST/HST on top' },
  'Australia':       { label: 'GST',       rate: 10,   reducedRate: 0,    note: 'Australian standard GST rate' },
  'Germany':         { label: 'VAT',       rate: 19,   reducedRate: 7,    note: 'German standard VAT (Umsatzsteuer) rate' },
  'France':          { label: 'VAT',       rate: 20,   reducedRate: 5.5,  note: 'French standard VAT (TVA) rate' },
  'Other':           { label: 'Tax',       rate: 0,    reducedRate: null, note: 'Set the applicable local tax rate manually' }
};

function applyCountryTaxDefaults(){
  const country = document.getElementById('companyCountry').value;
  const info = COUNTRY_TAX_INFO[country];
  const noteEl = document.getElementById('taxCountryNote');
  const reducedToggle = document.getElementById('reducedRateToggleRow');
  if(!info){
    noteEl.textContent = '';
    reducedToggle.style.display = 'none';
    return;
  }
  document.getElementById('taxLabel').value = info.label;
  document.getElementById('taxRate').value = info.rate;
  noteEl.textContent = info.note;

  document.getElementById('reducedRateCheckbox').checked = false;
  if(info.reducedRate !== null && info.reducedRate !== undefined){
    reducedToggle.style.display = 'flex';
    document.getElementById('reducedRateCheckbox').dataset.standardRate = info.rate;
    document.getElementById('reducedRateCheckbox').dataset.reducedRate = info.reducedRate;
    document.getElementById('reducedRateLabel').textContent =
      'Use reduced rate (' + info.reducedRate + '%) for eligible goods/services';
  } else {
    reducedToggle.style.display = 'none';
  }
  calcTotals();
}

document.getElementById('companyCountry').addEventListener('change', applyCountryTaxDefaults);

// --- Tax Region picker: US states & EU countries -------------------------

// US state-level base sales tax rates. These are the state rate only —
// most states allow counties/cities to add local sales tax on top, so the
// true combined rate at checkout is often higher. Verify current rates
// before filing, as they can change.
const US_STATES = [
  ['Alabama','AL',4.0],['Alaska','AK',0],['Arizona','AZ',5.6],['Arkansas','AR',6.5],
  ['California','CA',7.25],['Colorado','CO',2.9],['Connecticut','CT',6.35],['Delaware','DE',0],
  ['District of Columbia','DC',6.0],['Florida','FL',6.0],['Georgia','GA',4.0],['Hawaii','HI',4.0],
  ['Idaho','ID',6.0],['Illinois','IL',6.25],['Indiana','IN',7.0],['Iowa','IA',6.0],
  ['Kansas','KS',6.5],['Kentucky','KY',6.0],['Louisiana','LA',4.45],['Maine','ME',5.5],
  ['Maryland','MD',6.0],['Massachusetts','MA',6.25],['Michigan','MI',6.0],['Minnesota','MN',6.875],
  ['Mississippi','MS',7.0],['Missouri','MO',4.225],['Montana','MT',0],['Nebraska','NE',5.5],
  ['Nevada','NV',6.85],['New Hampshire','NH',0],['New Jersey','NJ',6.625],['New Mexico','NM',4.875],
  ['New York','NY',4.0],['North Carolina','NC',4.75],['North Dakota','ND',5.0],['Ohio','OH',5.75],
  ['Oklahoma','OK',4.5],['Oregon','OR',0],['Pennsylvania','PA',6.0],['Rhode Island','RI',7.0],
  ['South Carolina','SC',6.0],['South Dakota','SD',4.2],['Tennessee','TN',7.0],['Texas','TX',6.25],
  ['Utah','UT',4.85],['Vermont','VT',6.0],['Virginia','VA',5.3],['Washington','WA',6.5],
  ['West Virginia','WV',6.0],['Wisconsin','WI',5.0],['Wyoming','WY',4.0]
];

// EU VAT rates by member state: [name, code, standardRate, reducedRate].
// reducedRate is the most commonly used reduced rate (many countries have
// more than one tier — this is the primary one). null where a country has
// no general reduced rate. Exact eligibility (food, books, transport,
// etc.) varies by country — verify current rates, as these change often.
const EU_COUNTRIES = [
  ['Austria','AT',20,10],['Belgium','BE',21,6],['Bulgaria','BG',20,9],['Croatia','HR',25,5],
  ['Cyprus','CY',19,5],['Czechia','CZ',21,12],['Denmark','DK',25,null],['Estonia','EE',22,9],
  ['Finland','FI',25.5,14],['France','FR',20,5.5],['Germany','DE',19,7],['Greece','GR',24,13],
  ['Hungary','HU',27,5],['Ireland','IE',23,13.5],['Italy','IT',22,10],['Latvia','LV',21,12],
  ['Lithuania','LT',21,9],['Luxembourg','LU',17,8],['Malta','MT',18,5],['Netherlands','NL',21,9],
  ['Poland','PL',23,8],['Portugal','PT',23,6],['Romania','RO',19,9],['Slovakia','SK',23,10],
  ['Slovenia','SI',22,9.5],['Spain','ES',21,10],['Sweden','SE',25,12]
];

function populateRegionDropdowns(){
  const usSelect = document.getElementById('usStateSelect');
  US_STATES.forEach(([name, code, rate])=>{
    const opt = document.createElement('option');
    opt.value = code;
    opt.dataset.rate = rate;
    opt.dataset.name = name;
    opt.textContent = name + ' — ' + rate + '%';
    usSelect.appendChild(opt);
  });

  const euSelect = document.getElementById('euCountrySelect');
  EU_COUNTRIES.forEach(([name, code, rate, reducedRate])=>{
    const opt = document.createElement('option');
    opt.value = code;
    opt.dataset.rate = rate;
    opt.dataset.reducedRate = reducedRate === null ? '' : reducedRate;
    opt.dataset.name = name;
    opt.textContent = name + ' — ' + rate + '% VAT';
    euSelect.appendChild(opt);
  });
}
populateRegionDropdowns();

function selectTaxRegion(region){
  document.getElementById('regionBtnUS').classList.toggle('active', region === 'US');
  document.getElementById('regionBtnEU').classList.toggle('active', region === 'EU');
  document.getElementById('regionBtnOther').classList.toggle('active', region === 'OTHER');

  document.getElementById('usStateSelect').style.display = region === 'US' ? 'block' : 'none';
  document.getElementById('euCountrySelect').style.display = region === 'EU' ? 'block' : 'none';
  document.getElementById('otherRegionInputs').style.display = region === 'OTHER' ? 'flex' : 'none';

  document.getElementById('reducedRateCheckbox').checked = false;
  document.getElementById('reducedRateToggleRow').style.display = 'none';

  if(region === 'US'){
    document.getElementById('usStateSelect').value = '';
    document.getElementById('taxLabel').value = 'Sales Tax';
    document.getElementById('taxCountryNote').textContent = 'Pick a state below for its base sales tax rate';
    document.getElementById('reverseChargeRow').style.display = 'none';
  } else if(region === 'EU'){
    document.getElementById('euCountrySelect').value = '';
    document.getElementById('taxLabel').value = 'VAT';
    document.getElementById('taxCountryNote').textContent = 'Pick a country below for its standard VAT rate';
    document.getElementById('reverseChargeRow').style.display = 'none';
  } else {
    document.getElementById('otherRegionName').value = '';
    document.getElementById('otherRegionRate').value = '';
    document.getElementById('otherReducedLabel').value = 'Tax Reduction';
    document.getElementById('otherReducedRate').value = '';
    document.getElementById('taxLabel').value = 'Tax';
    document.getElementById('taxRate').value = 0;
    document.getElementById('taxCountryNote').textContent = 'Enter the region name and tax rate manually';
    document.getElementById('reverseChargeRow').style.display = 'none';
  }
  calcTotals();
}

function applyUsState(){
  const select = document.getElementById('usStateSelect');
  const opt = select.selectedOptions[0];
  const toggleRow = document.getElementById('reducedRateToggleRow');
  const checkbox = document.getElementById('reducedRateCheckbox');
  if(!opt || !opt.value){
    document.getElementById('taxCountryNote').textContent = 'Pick a state below for its base sales tax rate';
    toggleRow.style.display = 'none';
    return;
  }
  const rate = parseFloat(opt.dataset.rate);
  const name = opt.dataset.name;
  document.getElementById('taxLabel').value = 'Sales Tax (' + opt.value + ')';
  document.getElementById('taxRate').value = rate;
  document.getElementById('taxCountryNote').textContent =
    name + ' state base rate — counties/cities may add local sales tax on top';

  checkbox.checked = false;
  checkbox.dataset.standardRate = rate;
  checkbox.dataset.reducedRate = 0;
  document.getElementById('reducedRateLabel').textContent =
    'Mark as tax-exempt sale (resale certificate, exempt customer, etc.)';
  toggleRow.style.display = 'flex';

  calcTotals();
}

function applyEuCountry(){
  const select = document.getElementById('euCountrySelect');
  const opt = select.selectedOptions[0];
  const toggleRow = document.getElementById('reducedRateToggleRow');
  const checkbox = document.getElementById('reducedRateCheckbox');
  if(!opt || !opt.value){
    document.getElementById('taxCountryNote').textContent = 'Pick a country below for its standard VAT rate';
    toggleRow.style.display = 'none';
    return;
  }
  const rate = parseFloat(opt.dataset.rate);
  const name = opt.dataset.name;
  document.getElementById('taxLabel').value = 'VAT (' + opt.value + ')';
  document.getElementById('taxRate').value = rate;
  document.getElementById('taxCountryNote').textContent =
    name + ' standard VAT rate — reduced rates may apply to specific goods/services';

  checkbox.checked = false;
  if(opt.dataset.reducedRate !== ''){
    const reducedRate = parseFloat(opt.dataset.reducedRate);
    checkbox.dataset.standardRate = rate;
    checkbox.dataset.reducedRate = reducedRate;
    document.getElementById('reducedRateLabel').textContent =
      'Use reduced rate (' + reducedRate + '%) for eligible goods/services';
    toggleRow.style.display = 'flex';
  } else {
    toggleRow.style.display = 'none';
  }

  calcTotals();
}

function toggleReducedRate(){
  const checkbox = document.getElementById('reducedRateCheckbox');
  const standardRate = parseFloat(checkbox.dataset.standardRate);
  const reducedRate = parseFloat(checkbox.dataset.reducedRate);
  const taxRateInput = document.getElementById('taxRate');
  const taxLabelInput = document.getElementById('taxLabel');

  // Strip any previous (Reduced)/(Exempt) suffix before reapplying
  let label = taxLabelInput.value.replace(/\s*\((Reduced|Exempt)\)$/, '');

  if(checkbox.checked){
    taxRateInput.value = reducedRate;
    label += reducedRate === 0 ? ' (Exempt)' : ' (Reduced)';
  } else {
    taxRateInput.value = standardRate;
  }
  taxLabelInput.value = label;
  calcTotals();
}

function applyOtherRegion(){
  const name = document.getElementById('otherRegionName').value.trim();
  const rateInput = document.getElementById('otherRegionRate').value;
  const rate = parseFloat(rateInput) || 0;
  const reducedLabel = document.getElementById('otherReducedLabel').value.trim();
  const reducedRateInput = document.getElementById('otherReducedRate').value;
  const toggleRow = document.getElementById('reducedRateToggleRow');
  const checkbox = document.getElementById('reducedRateCheckbox');

  document.getElementById('taxLabel').value = name ? ('Tax (' + name + ')') : 'Tax';
  document.getElementById('taxRate').value = rate;
  document.getElementById('taxCountryNote').textContent = name
    ? ('Manually entered rate for ' + name + ' — verify with local requirements')
    : 'Enter the region name and tax rate manually';

  if(reducedRateInput !== ''){
    const reductionAmount = parseFloat(reducedRateInput) || 0;
    const effectiveRate = Math.max(0, rate - reductionAmount);
    checkbox.dataset.standardRate = rate;
    checkbox.dataset.reducedRate = effectiveRate;
    document.getElementById('reducedRateLabel').textContent =
      (reducedLabel || 'Tax Reduction') + ' (-' + reductionAmount + '%) → ' + effectiveRate + '%';
    toggleRow.style.display = 'flex';
    if(checkbox.checked){
      document.getElementById('taxRate').value = effectiveRate;
    }
  } else {
    checkbox.checked = false;
    toggleRow.style.display = 'none';
  }

  calcTotals();
}

function generatePDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const currency = getCurrentCurrencySymbol();
  const marginX = 40;
  let y = 50;

  // Logo (top-left)
  let logoBottomY = y;
  if(logoDataUrl){
    try{
      const props = doc.getImageProperties(logoDataUrl);
      const maxW = 120, maxH = 60;
      let w = maxW, h = (props.height / props.width) * maxW;
      if(h > maxH){ h = maxH; w = (props.width / props.height) * maxH; }
      doc.addImage(logoDataUrl, props.fileType, marginX, y, w, h);
      logoBottomY = y + h + 10;
    }catch(e){
      logoBottomY = y;
    }
  }

  // INVOICE title — top right, matching the on-screen box
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text(document.getElementById('invoiceLabel').value || 'INVOICE', 555, y, { align: 'right' });

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');

  // From block (starts below logo if present)
  y = logoDataUrl ? logoBottomY : 50;
  doc.setFont(undefined, 'bold');
  doc.text(document.getElementById('companyName').value || '', marginX, y);
  doc.setFont(undefined, 'normal');
  y += 16;
  const companyTaxId = document.getElementById('companyTaxId').value;
  const fromLines = [
    document.getElementById('yourName').value,
    document.getElementById('companyAddress').value,
    document.getElementById('companyCityStateZip').value,
    resolveCountryDisplay('companyCountry','companyCountryOther'),
    companyTaxId ? ('Tax ID / VAT: ' + companyTaxId) : ''
  ].filter(Boolean);
  fromLines.forEach(line=>{ doc.text(line, marginX, y); y += 14; });

  // Invoice meta box (right side)
  let metaY = 90;
  doc.setFontSize(10);
  doc.text('Invoice #:', 400, metaY);
  doc.text(document.getElementById('invoiceNumber').value || '', 555, metaY, { align: 'right' });
  metaY += 16;
  doc.text('Invoice Date:', 400, metaY);
  doc.text(formatDate(document.getElementById('invoiceDate').value), 555, metaY, { align: 'right' });
  metaY += 16;
  doc.text('Due Date:', 400, metaY);
  doc.text(formatDate(document.getElementById('dueDate').value), 555, metaY, { align: 'right' });

  // Bill To block
  y = Math.max(y, metaY) + 30;
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('BILL TO', marginX, y);
  doc.setTextColor(0);
  y += 16;
  doc.setFontSize(11);
  const clientTaxId = document.getElementById('clientTaxId').value;
  const billLines = [
    document.getElementById('billTo').value,
    document.getElementById('clientCompany').value,
    document.getElementById('clientAddress').value,
    document.getElementById('clientCityStateZip').value,
    resolveCountryDisplay('clientCountry','clientCountryOther'),
    clientTaxId ? ('Tax ID / VAT: ' + clientTaxId) : ''
  ].filter(Boolean);
  billLines.forEach(line=>{ doc.text(line, marginX, y); y += 14; });

  y += 20;

  // Table header
  const colX = { desc: marginX, qty: 340, rate: 400, amt: 480 };
  doc.setFillColor(33,150,243);
  doc.rect(marginX, y, 515, 22, 'F');
  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.setFont(undefined,'bold');
  doc.text('Description', colX.desc + 6, y + 15);
  doc.text('Qty', colX.qty, y + 15);
  doc.text('Cost', colX.rate, y + 15);
  doc.text('Amount', 555, y + 15, { align: 'right' });
  doc.setFont(undefined,'normal');
  doc.setTextColor(0);
  y += 22;

  const rows = document.querySelectorAll('#itemsBody tr');
  rows.forEach((row, idx)=>{
    const id = row.id.replace('item-row-','');
    const desc = document.getElementById('desc-'+id).value || '';
    const qty = document.getElementById('qty-'+id).value || '0';
    const cost = parseFloat(document.getElementById('rate-'+id).value) || 0;
    const amt = document.getElementById('amt-'+id).textContent;

    if(idx % 2 === 1){
      doc.setFillColor(245,247,250);
      doc.rect(marginX, y, 515, 20, 'F');
    }
    doc.setFontSize(10);
    doc.text(desc, colX.desc + 6, y + 14);
    doc.text(String(qty), colX.qty, y + 14);
    doc.text(currency + formatNumber(cost), colX.rate, y + 14);
    doc.text(currency + formatNumber(parseFloat(amt) || 0), 555, y + 14, { align: 'right' });
    y += 20;
  });

  y += 15;
  const subTotal = document.getElementById('subTotalDisplay').textContent;
  const taxAmount = document.getElementById('taxAmountDisplay').textContent;
  const taxRate = document.getElementById('taxRate').value;
  const taxLabel = document.getElementById('taxLabel').value || 'Tax';
  const total = document.getElementById('totalDisplay').textContent;
  const reverseCharge = document.getElementById('reverseChargeRow').style.display !== 'none';

  doc.setFontSize(11);
  doc.text('Sub Total:', 420, y);
  doc.text(currency + subTotal, 555, y, { align: 'right' });
  y += 18;
  doc.text(taxLabel + ' (' + taxRate + '%):', 420, y);
  doc.text(currency + taxAmount, 555, y, { align: 'right' });
  y += 10;
  doc.setLineWidth(0.5);
  doc.line(420, y, 555, y);
  y += 18;
  doc.setFont(undefined,'bold');
  doc.setFontSize(13);
  doc.text('Total:', 420, y);
  doc.text(currency + total, 555, y, { align: 'right' });
  y += 20;

  if(reverseCharge){
    doc.setFont(undefined,'italic');
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text('Reverse charge — VAT to be accounted for by the recipient.', marginX, y);
    doc.setTextColor(0);
    doc.setFont(undefined,'normal');
  } else {
    const taxNote = document.getElementById('taxCountryNote').textContent;
    if(taxNote){
      doc.setFont(undefined,'italic');
      doc.setFontSize(9);
      doc.setTextColor(130);
      doc.text(taxNote, marginX, y, { maxWidth: 350 });
      doc.setTextColor(0);
      doc.setFont(undefined,'normal');
    }
  }

  const invNum = document.getElementById('invoiceNumber').value || 'invoice';
  const filename = invNum + '.pdf';
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  // Show a visible link the user can click/long-press to save.
  // Sandboxed viewers (like this preview) often block a programmatic
  // download click, but a real click on a real link still works,
  // and opening the PDF in a new tab always lets you save it from there.
  const box = document.getElementById('pdfLinkBox');
  box.innerHTML = '';
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = '📄 Tap here to open / download ' + filename;
  a.className = 'pdf-ready-link';
  box.appendChild(a);
  box.style.display = 'block';

  // Also try to trigger it automatically (works in a normal browser tab)
  a.click();
}

function todayStr(offsetDays){
  const d = new Date();
  d.setDate(d.getDate() + (offsetDays||0));
  return d.toISOString().split('T')[0];
}

function autofillUS(){
  document.getElementById('companyName').value = 'Northwind Studio LLC';
  document.getElementById('yourName').value = 'Alex Morgan';
  document.getElementById('companyAddress').value = '128 Harbor Lane';
  document.getElementById('companyCityStateZip').value = 'Austin, TX 78701';
  document.getElementById('companyCountry').value = 'United States';
  document.getElementById('companyTaxId').value = 'EIN 12-3456789';

  document.getElementById('billTo').value = 'Bill To:';
  document.getElementById('clientCompany').value = 'Brightline Retail Co.';
  document.getElementById('clientAddress').value = '55 Market Street, Suite 400';
  document.getElementById('clientCityStateZip').value = 'San Francisco, CA 94103';
  document.getElementById('clientCountry').value = 'United States';
  document.getElementById('clientTaxId').value = '';

  document.getElementById('invoiceNumber').value = 'INV-' + Math.floor(1000 + Math.random()*9000);
  document.getElementById('invoiceDate').value = todayStr(0);
  document.getElementById('dueDate').value = todayStr(30);

  document.getElementById('itemsBody').innerHTML = '';
  itemCount = 0;
  addItem('Website design & development', 1, 2400);
  addItem('Hosting setup (annual)', 1, 180);
  addItem('Content migration', 8, 45);

  // US invoices typically show state/local Sales Tax, not VAT
  document.getElementById('taxLabel').value = 'Sales Tax';
  document.getElementById('taxRate').value = 8.25;
  document.getElementById('currency').value = '$';
  document.getElementById('reverseChargeRow').style.display = 'none';
  document.getElementById('taxCountryNote').textContent = COUNTRY_TAX_INFO['United States'].note;

  calcTotals();
}

function autofillEU(){
  document.getElementById('companyName').value = 'Nordlicht Design GmbH';
  document.getElementById('yourName').value = 'Freya Nilsson';
  document.getElementById('companyAddress').value = 'Torstraße 22';
  document.getElementById('companyCityStateZip').value = '10119 Berlin';
  document.getElementById('companyCountry').value = 'Germany';
  document.getElementById('companyTaxId').value = 'DE123456789';

  document.getElementById('billTo').value = 'Bill To:';
  document.getElementById('clientCompany').value = 'Atelier Lumière SARL';
  document.getElementById('clientAddress').value = '18 Rue de Rivoli';
  document.getElementById('clientCityStateZip').value = '75004 Paris';
  document.getElementById('clientCountry').value = 'France';
  document.getElementById('clientTaxId').value = 'FR12345678901';

  document.getElementById('invoiceNumber').value = 'INV-' + Math.floor(1000 + Math.random()*9000);
  document.getElementById('invoiceDate').value = todayStr(0);
  document.getElementById('dueDate').value = todayStr(14);

  document.getElementById('itemsBody').innerHTML = '';
  itemCount = 0;
  addItem('Brand identity design', 1, 1800);
  addItem('Packaging artwork (per SKU)', 4, 220);
  addItem('Print production oversight', 6, 65);

  // Cross-border EU B2B (both VAT numbers present) → 0% reverse-charge VAT
  document.getElementById('taxLabel').value = 'VAT';
  document.getElementById('taxRate').value = 0;
  document.getElementById('currency').value = '€';
  document.getElementById('reverseChargeRow').style.display = 'flex';
  document.getElementById('taxCountryNote').textContent = 'Cross-border EU B2B with valid VAT numbers on both sides — 0% reverse charge applies';

  calcTotals();
}

function clearForm(){
  ['companyName','yourName','companyAddress','companyCityStateZip','companyTaxId',
   'billTo','clientCompany','clientAddress','clientCityStateZip','clientTaxId',
   'invoiceDate','dueDate'].forEach(id=>{
    document.getElementById(id).value = '';
  });
  document.getElementById('companyCountry').value = '';
  document.getElementById('clientCountry').value = '';
  document.getElementById('companyCountryOther').value = '';
  document.getElementById('companyCountryOther').style.display = 'none';
  document.getElementById('clientCountryOther').value = '';
  document.getElementById('clientCountryOther').style.display = 'none';
  document.getElementById('invoiceNumber').value = 'INV-100';
  document.getElementById('taxLabel').value = 'Sales Tax';
  document.getElementById('taxRate').value = 10;
  document.getElementById('currency').value = '$';
  document.getElementById('customCurrencyCode').value = '';
  document.getElementById('customCurrencySymbol').value = '';
  document.getElementById('customCurrencyInputs').style.display = 'none';
  document.getElementById('reverseChargeRow').style.display = 'none';
  document.getElementById('taxCountryNote').textContent = '';
  document.getElementById('reducedRateCheckbox').checked = false;
  document.getElementById('reducedRateToggleRow').style.display = 'none';

  document.getElementById('itemsBody').innerHTML = '';
  itemCount = 0;
  addItem('', 1, 0);
  calcTotals();
}

function formatDate(dateStr){
  if(!dateStr) return '';
  const [yy, mm, dd] = dateStr.split('-');
  return `${dd}/${mm}/${yy}`;
}

// init with one blank row
addItem('', 1, 0);
