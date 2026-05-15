// ── CSV parser ──────────────────────────────────────────────────
function parseCSVLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
  }
  fields.push(field.trim());
  return fields;
}

// ── Lap time helpers ────────────────────────────────────────────
function parseLapTime(s) {
  if (!s || s === '-') return null;
  s = s.trim();
  const colonIdx = s.indexOf(':');
  let seconds;
  if (colonIdx !== -1) {
    const mins = parseInt(s.slice(0, colonIdx), 10);
    const secs = parseFloat(s.slice(colonIdx + 1));
    seconds = mins * 60 + secs;
  } else {
    seconds = parseFloat(s);
  }
  // 0 or NaN means no valid lap recorded
  if (isNaN(seconds) || seconds === 0) return null;
  return seconds;
}

function formatLapTime(seconds) {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(3).padStart(6, '0');
  return m > 0 ? `${m}:${s}` : `${s}`;
}

// ── Interval conversion ─────────────────────────────────────────
function convertInterval(raw) {
  if (!raw || raw.trim() === '' || raw.trim() === '0') return '0';
  const s = raw.trim();
  // Lapped: "-N L" format
  if (/^-?\d+\s*L$/i.test(s)) return s.replace(/\s+/, ' ');
  // Positive number (leader) or "-00.000" style
  const num = parseFloat(s.replace(/^-/, ''));
  if (!isNaN(num)) {
    if (num === 0) return '0';
    // Strip leading minus — interval is always "gap behind leader"
    return num.toFixed(3);
  }
  return s;
}

// ── Main CSV processor ──────────────────────────────────────────
function processCSV(text) {
  const lines = text.split(/\r?\n/);
  let headerIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Fin Pos')) { headerIdx = i; break; }
  }

  if (headerIdx === -1) throw new Error('Could not find results header row ("Fin Pos" column missing). Is this an iRacing race result CSV?');

  const headers = parseCSVLine(lines[headerIdx]);

  // Exact match first, then case-insensitive substring fallback
  const col = (...names) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.trim() === name);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  const colContains = (...keywords) =>
    headers.findIndex(h => keywords.every(k => h.toLowerCase().includes(k.toLowerCase())));

  const FIN_POS    = col('Fin Pos', 'FinPos', 'Finish');
  const CUST_ID    = col('Cust ID', 'CustID', 'Customer ID');
  const NAME       = col('Name', 'Driver', 'Driver Name');
  const startIdx   = col('Start Pos', 'Starting Position', 'Starting Pos', 'StartPos');
  const intervalIdx = col('Interval');
  const LAPS       = col('Laps Comp', 'Laps Completed', 'Laps');
  const avgIdx     = col('Average Lap Time', 'Avg Lap Time', 'Avg Lap') !== -1
                       ? col('Average Lap Time', 'Avg Lap Time', 'Avg Lap')
                       : colContains('avg', 'lap');
  const bestIdx    = col('Fastest Lap Time', 'Best Lap Time', 'Best Lap', 'Fast Lap Time') !== -1
                       ? col('Fastest Lap Time', 'Best Lap Time', 'Best Lap', 'Fast Lap Time')
                       : colContains('fastest', 'lap');

  if (FIN_POS === -1 || NAME === -1) throw new Error(`Required columns not found (searched for "Fin Pos" and "Name"). Make sure this is an iRacing results CSV.`);

  const drivers = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = parseCSVLine(line);
    const finPos = parseInt(row[FIN_POS], 10);
    if (isNaN(finPos)) continue;

    const custId   = CUST_ID    !== -1 ? (row[CUST_ID]    || '').trim() : '';
    const name     = NAME       !== -1 ? (row[NAME]       || '').trim() : '';
    const startPos = startIdx   !== -1 ? (row[startIdx]   || '').trim() : '';
    const interval = intervalIdx !== -1 ? convertInterval(row[intervalIdx]) : '';
    const avgLap   = avgIdx     !== -1 ? (row[avgIdx]     || '').trim() : '';
    const bestLap  = bestIdx    !== -1 ? (row[bestIdx]    || '').trim() : '';
    const laps     = LAPS       !== -1 ? (row[LAPS]       || '').trim() : '';

    drivers.push({ finPos, custId, name, startPos, interval, avgLap, bestLap, laps });
  }

  if (drivers.length === 0) throw new Error('No result rows found after the header.');

  return drivers;
}

// ── Output builder ──────────────────────────────────────────────
function buildOutput(drivers) {
  return drivers.map(d => [
    d.custId,
    d.name,
    d.laps,
    d.bestLap,
    d.avgLap,
    d.finPos,
    d.startPos,
    d.interval
  ].join('\t')).join('\n');
}

// ── Highlights ──────────────────────────────────────────────────
function computeHighlights(drivers) {
  let fastestTime = Infinity;
  let fastestDriver = null;
  let poleDriver = null;

  for (const d of drivers) {
    const t = parseLapTime(d.bestLap);
    if (t !== null && t < fastestTime) {
      fastestTime = t;
      fastestDriver = d;
    }
    const sp = parseInt(d.startPos, 10);
    if (sp === 1) poleDriver = d;
  }

  return {
    fastestTime: fastestDriver ? fastestTime : null,
    fastestDriver,
    poleDriver
  };
}

// ── UI update ───────────────────────────────────────────────────
function showError(msg) {
  const bar = document.getElementById('error-bar');
  bar.textContent = msg;
  bar.classList.add('visible');
}

function clearError() {
  document.getElementById('error-bar').classList.remove('visible');
}

function showResults(drivers, output) {
  const { fastestDriver, fastestTime, poleDriver } = computeHighlights(drivers);

  document.getElementById('hl-fastest-time').textContent = fastestDriver ? formatLapTime(fastestTime) : '—';
  document.getElementById('hl-fastest-name').textContent = fastestDriver ? fastestDriver.name : '';
  document.getElementById('hl-pole-name').textContent    = poleDriver    ? poleDriver.name    : '—';
  document.getElementById('hl-pole-time').textContent    = poleDriver    ? (poleDriver.bestLap || '') : '';

  document.getElementById('highlights-section').classList.add('visible');

  document.getElementById('output-count').textContent = drivers.length;
  document.getElementById('output-textarea').value = output;
  document.getElementById('copy-btn').disabled = false;
  document.getElementById('output-section').classList.add('visible');
}

function handleFile(file) {
  if (!file) return;
  clearError();

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const drivers = processCSV(e.target.result);
      const output  = buildOutput(drivers);
      showResults(drivers, output);
    } catch (err) {
      showError(err.message);
    }
  };
  reader.onerror = () => showError('Failed to read file.');
  reader.readAsText(file);
}

// ── Event wiring ────────────────────────────────────────────────
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const copyBtn   = document.getElementById('copy-btn');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
  fileInput.value = '';
});

copyBtn.addEventListener('click', () => {
  const text = document.getElementById('output-textarea').value;
  if (!text) return;

  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);

  copyBtn.textContent = 'Copied!';
  copyBtn.classList.add('success');
  setTimeout(() => {
    copyBtn.textContent = 'Copy to Clipboard';
    copyBtn.classList.remove('success');
  }, 2000);
});
