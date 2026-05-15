
// ── State ───────────────────────────────────────────────────────
let roundNumber  = 4;
let trackName    = 'Watkins Glen';
let carName      = 'SFL';
let sessionType  = 'practice';
let csvRows      = [];
let selectedFlag;
let flagDropdownOpen = false;
let flagSearch       = '';
let subsessionId     = '';

const FLAG_EMOJIS = [
  { code: "🇦🇺", name: "Australia",     search: "australia" },
  { code: "🇺🇸", name: "United States", search: "united states usa america" },
  { code: "🇬🇧", name: "United Kingdom",search: "united kingdom uk britain england" },
  { code: "🇩🇪", name: "Germany",       search: "germany" },
  { code: "🇫🇷", name: "France",        search: "france" },
  { code: "🇮🇹", name: "Italy",         search: "italy" },
  { code: "🇯🇵", name: "Japan",         search: "japan" },
  { code: "🇨🇦", name: "Canada",        search: "canada" },
  { code: "🇧🇷", name: "Brazil",        search: "brazil" },
  { code: "🇲🇽", name: "Mexico",        search: "mexico" },
  { code: "🇪🇸", name: "Spain",         search: "spain" },
  { code: "🇳🇱", name: "Netherlands",   search: "netherlands holland" },
  { code: "🇧🇪", name: "Belgium",       search: "belgium" },
  { code: "🇦🇹", name: "Austria",       search: "austria" },
  { code: "🇵🇹", name: "Portugal",      search: "portugal" },
  { code: "🇨🇭", name: "Switzerland",   search: "switzerland" },
  { code: "🇸🇪", name: "Sweden",        search: "sweden" },
  { code: "🇳🇴", name: "Norway",        search: "norway" },
  { code: "🇩🇰", name: "Denmark",       search: "denmark" },
  { code: "🇫🇮", name: "Finland",       search: "finland" },
  { code: "🇵🇱", name: "Poland",        search: "poland" },
  { code: "🇨🇿", name: "Czech Republic",search: "czech republic czechia" },
  { code: "🇭🇺", name: "Hungary",       search: "hungary" },
  { code: "🇷🇴", name: "Romania",       search: "romania" },
  { code: "🇷🇺", name: "Russia",        search: "russia" },
  { code: "🇨🇳", name: "China",         search: "china" },
  { code: "🇰🇷", name: "South Korea",   search: "south korea" },
  { code: "🇮🇳", name: "India",         search: "india" },
  { code: "🇿🇦", name: "South Africa",  search: "south africa" },
  { code: "🇦🇪", name: "UAE",           search: "uae united arab emirates dubai" },
  { code: "🇸🇦", name: "Saudi Arabia",  search: "saudi arabia" },
  { code: "🇸🇬", name: "Singapore",     search: "singapore" },
  { code: "🇳🇿", name: "New Zealand",   search: "new zealand" },
  { code: "🇦🇷", name: "Argentina",     search: "argentina" },
  { code: "🇨🇱", name: "Chile",         search: "chile" },
  { code: "🇹🇷", name: "Turkey",        search: "turkey" },
  { code: "🇬🇷", name: "Greece",        search: "greece" },
  { code: "🇮🇪", name: "Ireland",       search: "ireland" },
  { code: "🇲🇨", name: "Monaco",        search: "monaco" },
  { code: "🇧🇭", name: "Bahrain",       search: "bahrain" },
  { code: "🇦🇿", name: "Azerbaijan",    search: "azerbaijan baku" },
  { code: "🇲🇾", name: "Malaysia",      search: "malaysia" },
  { code: "🇹🇭", name: "Thailand",      search: "thailand" },
  { code: "🇺🇾", name: "Uruguay",       search: "uruguay" },
  { code: "🇵🇪", name: "Peru",          search: "peru" },
  { code: "🇨🇴", name: "Colombia",      search: "colombia" },
  { code: "🇻🇳", name: "Vietnam",       search: "vietnam" },
  { code: "🇮🇩", name: "Indonesia",     search: "indonesia" },
];

// ── CSV helpers ─────────────────────────────────────────────────
function splitCSVLine(line) {
  const out = []; let cur = '', inQ = false;
  for (const c of line) {
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) throw new Error('File appears empty or invalid.');

  const metaHeaders = splitCSVLine(lines[0]);
  const metaValues  = splitCSVLine(lines[1]);
  const get = name => { const i = metaHeaders.indexOf(name); return i !== -1 ? metaValues[i] : ''; };

  let rawTrack  = get('Track');
  let rawSeries = get('Hosted Session Name');

  rawTrack = rawTrack.replace(/ - .*$/, '');

  const sm = rawSeries.match(/^FDL\s*-\s*(\S+)/);
  const series = sm ? sm[1] : rawSeries;

  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Fin Pos')) { headerIdx = i; break; }
  }
  if (headerIdx === -1) throw new Error('Could not find results header row ("Fin Pos" column missing).');

  const headers = splitCSVLine(lines[headerIdx]);
  const col = name => headers.indexOf(name);

  const FIN_POS = col('Fin Pos');
  const NAME    = col('Name');
  const INTV    = col('Interval');
  const FAST    = col('Fastest Lap Time');
  const LAPS    = col('Laps Comp');
  const OUT     = col('Out');
  const INC     = col('Inc');
  const CUST_ID = col('Cust ID');

  if (FIN_POS === -1 || NAME === -1) throw new Error('Required columns missing. Is this an iRacing results CSV?');

  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i]);
    const finPos = parseInt(row[FIN_POS], 10);
    if (isNaN(finPos)) continue;
    const driverName  = row[NAME] || '';
    const custId      = CUST_ID !== -1 ? parseInt(row[CUST_ID], 10) : null;
    const driverEntry = (typeof FDL_DRIVERS !== 'undefined')
      ? (custId ? FDL_DRIVERS.find(d => d.id === custId)
                : FDL_DRIVERS.find(d => d.driver.toLowerCase() === driverName.toLowerCase()))
      : null;
    rows.push({
      finPos,
      name:           driverName,
      interval:       row[INTV]  || '',
      fastestLapTime: row[FAST]  || '',
      laps:           row[LAPS]  || '',
      out:            row[OUT]   || '',
      inc:            row[INC]   || '0',
      team:     driverEntry ? driverEntry.team   : '',
      teamId:   driverEntry ? driverEntry.teamId : null,
      class:    driverEntry ? driverEntry.class  : '',
    });
  }
  if (!rows.length) throw new Error('No result rows found after the header.');
  return { track: rawTrack, series, rows };
}

// ── Lap time helpers ────────────────────────────────────────────
function lapToSec(str) {
  if (!str) return null;
  const m = str.match(/^(\d+):(\d+\.\d+)$/);
  if (m) return parseInt(m[1]) * 60 + parseFloat(m[2]);
  const n = parseFloat(str);
  return isNaN(n) || n === 0 ? null : n;
}

// ── Sorting / top-10 ────────────────────────────────────────────
function getTop10(rows, type) {
  if (type === 'race') {
    return [...rows]
      .sort((a, b) => a.finPos - b.finPos)
      .slice(0, 10)
      .map(r => ({ ...r, displayPos: r.finPos }));
  }
  const withTime = rows.filter(r => lapToSec(r.fastestLapTime) !== null)
    .sort((a, b) => lapToSec(a.fastestLapTime) - lapToSec(b.fastestLapTime));
  const noTime = rows.filter(r => lapToSec(r.fastestLapTime) === null);
  return [...withTime, ...noTime]
    .slice(0, 10)
    .map((r, i) => ({ ...r, displayPos: i + 1 }));
}

// ── Gap formatting ──────────────────────────────────────────────
function formatGap(driver, idx, p1, type) {
  if (idx === 0) return driver.fastestLapTime || '\u2014';

  if (type !== 'race') {
    const p1s = lapToSec(p1.fastestLapTime);
    const ms  = lapToSec(driver.fastestLapTime);
    if (!p1s || !ms) return '\u2014';
    return '+' + (ms - p1s).toFixed(3);
  }

  const s = driver.interval.trim();
  const lapM = s.match(/^-(\d+) L$/i);
  if (lapM) { const n = parseInt(lapM[1]); return `-${n} ${n === 1 ? 'LAP' : 'LAPS'}`; }

  const minM = s.match(/^-(\d+):(\d+\.\d+)$/);
  if (minM) return `+${minM[1]}:${minM[2]}`;

  const secM = s.match(/^-0*(\d+\.\d+)$/);
  if (secM) return '+' + parseFloat(secM[1]).toFixed(3);

  return s;
}

// ── Table HTML ──────────────────────────────────────────────────
function buildTable(top10, type) {
  if (!top10.length) return '';
  const isRace = type === 'race';
  const gapHdr = isRace ? 'GAP' : 'BEST LAP';
  const p1     = top10[0];

  let h = '<thead><tr>';
  h += '<th></th>';
  h += '<th style="text-align:left">DRIVER</th>';
  h += `<th style="text-align:right;min-width:110px">${gapHdr}</th>`;
  h += '<th style="text-align:right;min-width:55px">LAPS</th>';
  if (isRace) h += '<th style="text-align:right;min-width:46px">INC</th>';
  h += '</tr></thead><tbody>';

  const silverRanks = new Map();
  top10.filter(d => d.class === 'SILVER').slice(0, 3).forEach((d, i) => {
    silverRanks.set(d.name, i + 1);
  });

  top10.forEach((d, i) => {
    const isP1       = i === 0;
    const isDNF      = d.out !== 'Running';
    const gap        = formatGap(d, i, p1, type);
    const inc        = parseInt(d.inc, 10) || 0;
    const silverRank = silverRanks.get(d.name) || 0;

    let rowCls = isP1 ? 'g-row-p1' : isDNF ? 'g-row-dnf' : '';
    if (!rowCls) {
      if (silverRank === 1) rowCls = 'g-row-silver';
      else if (silverRank === 2) rowCls = 'g-row-silver-2';
      else if (silverRank === 3) rowCls = 'g-row-silver-3';
    }

    const badge = silverRank === 1 ? ' <span class="silver-badge">🥇</span>'
      : silverRank === 2 ? ' <span class="silver-badge">🥈</span>'
      : silverRank === 3 ? ' <span class="silver-badge">🥉</span>'
      : '';
    const teamLabel = d.teamId ? d.teamId : (d.team || '');
    const meta      = teamLabel ? ` <span class="driver-meta">${teamLabel}${d.class ? ' · ' + d.class : ''}</span>` : '';
    const nameTxt   = isDNF
      ? `${d.name} <span class="dnf-badge">DNF</span>${badge}${meta}`
      : `${d.name}${badge}${meta}`;
    const gapCls    = isP1 ? '' : 'g-gap';
    const incCls    = inc > 0 ? 'g-inc-hot' : '';

    h += `<tr class="${rowCls}">`;
    h += `<td>${d.displayPos}</td>`;
    h += `<td>${nameTxt}</td>`;
    h += `<td class="${gapCls}" style="text-align:right">${gap}</td>`;
    h += `<td style="text-align:right">${d.laps}</td>`;
    if (isRace) h += `<td class="${incCls}" style="text-align:right">${d.inc}</td>`;
    h += '</tr>';
  });

  return h + '</tbody>';
}

// ── Discord text ────────────────────────────────────────────────
function buildDiscordText() {
  const typeLabel = { race: 'Race', qualify: 'Qualifying', practice: 'Practice' }[sessionType] || 'Practice';
  const link = subsessionId
    ? `https://members.iracing.com/membersite/member/EventResult.do?&subsessionid=${subsessionId}`
    : 'https://members.iracing.com/membersite/member/EventResult.do';
  return `**${carName} Round ${roundNumber} - Official ${typeLabel} @ ${trackName} ${selectedFlag.code} **\n:point_right: [Click here to view full classifications](${link}) :bar_chart:`;
}

// ── Render ──────────────────────────────────────────────────────
function render() {
  const typeLabel = { race: 'RACE', qualify: 'QUALIFYING', practice: 'PRACTICE' }[sessionType] || 'RACE';
  document.getElementById('g-round-title').textContent = `Round ${roundNumber} @ ${trackName}`;
  document.getElementById('g-subtitle').textContent    = `${carName} OFFICIAL ${typeLabel} CLASSIFICATION`;

  const top10 = getTop10(csvRows, sessionType);
  document.getElementById('g-table').innerHTML = buildTable(top10, sessionType);

  const ta = document.getElementById('discord-text');
  if (ta) ta.value = buildDiscordText();
}

// ── Export ──────────────────────────────────────────────────────
function h2c() {
  return document.fonts.ready.then(() =>
    html2canvas(document.getElementById('graphic'), {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#000000', logging: false,
      width: 600, height: 600,
    })
  );
}

function downloadJPG() {
  h2c().then(canvas => {
    const a = document.createElement('a');
    a.download = `fdl-r${roundNumber}-${trackName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }).catch(err => alert('Export failed: ' + err.message));
}

function copyToClipboard() {
  const btn = document.getElementById('copy-btn');
  h2c().then(canvas => {
    canvas.toBlob(blob => {
      try {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          .then(() => {
            btn.textContent = '\u2713 Copied!';
            setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000);
          })
          .catch(() => alert('Copy failed \u2014 use Download instead'));
      } catch (e) {
        alert('Copy failed \u2014 use Download instead');
      }
    });
  }).catch(err => alert('Export failed: ' + err.message));
}

// ── Flag dropdown ───────────────────────────────────────────────
function renderFlagDropdown() {
  document.getElementById('flag-trigger-code').textContent = selectedFlag.code;
  document.getElementById('flag-trigger-name').textContent = selectedFlag.name;
  const panel = document.getElementById('flag-panel');
  if (flagDropdownOpen) {
    panel.classList.add('open');
    renderFlagList();
  } else {
    panel.classList.remove('open');
  }
}

function renderFlagList() {
  const list     = document.getElementById('flag-list');
  const query    = flagSearch.toLowerCase();
  const filtered = query
    ? FLAG_EMOJIS.filter(f => f.name.toLowerCase().includes(query) || f.search.includes(query))
    : FLAG_EMOJIS;

  if (filtered.length === 0) {
    list.innerHTML = '<div class="flag-no-results">No results</div>';
    return;
  }

  list.innerHTML = filtered.map(f => `
    <div class="flag-item${f.code === selectedFlag.code ? ' flag-item--active' : ''}" data-idx="${FLAG_EMOJIS.indexOf(f)}" role="option">
      <span class="flag-item__code">${f.code}</span>
      <span>${f.name}</span>
    </div>`).join('');

  list.querySelectorAll('.flag-item').forEach(item => {
    item.addEventListener('click', e => {
      e.stopPropagation();
      const flag = FLAG_EMOJIS[parseInt(item.dataset.idx, 10)];
      if (flag) {
        selectedFlag     = flag;
        flagDropdownOpen = false;
        flagSearch       = '';
        document.getElementById('flag-search').value = '';
        renderFlagDropdown();
        render();
      }
    });
  });
}

// ── Init ────────────────────────────────────────────────────────
(function init() {
  document.getElementById('g-logo').src    = logoDataURL;
  document.getElementById('logo-gripline').src = gripDataURL;
  document.getElementById('logo-es').src        = esDataURL;
  document.getElementById('bg-photo').style.backgroundImage = `url(${bgDataURL})`;

  document.getElementById('round-number').addEventListener('input', e => {
    let v = parseInt(e.target.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 20) v = 20;
    roundNumber = v;
    render();
  });

  document.getElementById('track-name').addEventListener('input', e => {
    trackName = e.target.value;
    render();
  });

  document.getElementById('series-label').addEventListener('input', e => {
    carName = e.target.value;
    render();
  });

  document.getElementById('session-type').addEventListener('change', e => {
    sessionType = e.target.value;
    render();
  });

  // Flag dropdown
  selectedFlag = FLAG_EMOJIS[0];
  renderFlagDropdown();

  const flagDropdown = document.getElementById('flag-dropdown');
  const flagTrigger  = document.getElementById('flag-trigger');
  const flagSearchEl = document.getElementById('flag-search');

  flagTrigger.addEventListener('click', e => {
    e.stopPropagation();
    flagDropdownOpen = !flagDropdownOpen;
    renderFlagDropdown();
    if (flagDropdownOpen) flagSearchEl.focus();
  });

  flagSearchEl.addEventListener('click', e => e.stopPropagation());

  flagSearchEl.addEventListener('input', e => {
    flagSearch = e.target.value;
    renderFlagList();
  });

  document.addEventListener('click', e => {
    if (flagDropdownOpen && !flagDropdown.contains(e.target)) {
      flagDropdownOpen = false;
      renderFlagDropdown();
    }
  });

  document.getElementById('subsession-id').addEventListener('input', e => {
    subsessionId = e.target.value.trim();
    render();
  });

  document.getElementById('csv-upload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    // Extract subsession ID from filename: eventresult_85684115_0.csv
    const m = file.name.match(/eventresult_(\d+)_/);
    if (m) {
      subsessionId = m[1];
      document.getElementById('subsession-id').value = subsessionId;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const { track, series, rows } = parseCSV(ev.target.result);
        if (track)  { trackName = track;  document.getElementById('track-name').value   = track; }
        if (series) { carName   = series; document.getElementById('series-label').value = series; }
        csvRows = rows;
        render();
      } catch (err) {
        alert('CSV parse error: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('generate-btn').addEventListener('click', () => {
    const card = document.getElementById('export-card');
    card.style.display = 'block';
    render();
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('download-btn').addEventListener('click', downloadJPG);
  document.getElementById('copy-btn').addEventListener('click', copyToClipboard);

  document.getElementById('copy-text-btn').addEventListener('click', () => {
    const text = document.getElementById('discord-text').value;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const btn = document.getElementById('copy-text-btn');
    btn.textContent = '✓ Copied!';
    btn.classList.add('success');
    setTimeout(() => { btn.textContent = 'Copy Text'; btn.classList.remove('success'); }, 2000);
  });
})();
