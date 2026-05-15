
// ── State ────────────────────────────────────────────────────────
let roundNumber  = 1;
let trackName    = '';
let roundType    = 'standard';   // 'standard' | 'sprint'
let sprintType   = 'sprint';     // 'sprint' | 'feature'
let selectedFlag;
let flagDropdownOpen = false;
let flagSearch       = '';

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
let drivers      = [];

// ── Parse race data (TSV paste) ──────────────────────────────────
function parseRaceData(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (!lines.length) return [];

  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(c => c.trim().toLowerCase());
    if (cols.includes('driver') && cols.includes('race pos')) {
      headerIdx = i;
      break;
    }
  }

  let colMap = {};
  if (headerIdx >= 0) {
    const headers = lines[headerIdx].split('\t').map(c => c.trim().toLowerCase());
    headers.forEach((h, i) => { colMap[h] = i; });
  } else {
    // Fall back to fixed column order: ID DRIVER LAPS BEST AVG RACE_POS QUAL_POS INTERVAL PEN_S PEN_PTS POST_RACE_INT BONUS CHAMP ADJ
    colMap = { 'id':0,'driver':1,'laps':2,'best':3,'avg lap':4,'race pos':5,'qual pos':6,'interval (s)':7,'pen (s)':8,'pen (pts)':9,'post race int':10,'bonus pts':11,'champ points':12,'adj points':13 };
  }

  const col = (name) => colMap[name.toLowerCase()] ?? -1;

  const rows = [];
  const start = headerIdx >= 0 ? headerIdx + 1 : 0;
  for (let i = start; i < lines.length; i++) {
    const c = lines[i].split('\t').map(x => x.trim());
    const pos = parseInt(c[col('race pos')], 10);
    if (isNaN(pos)) continue;
    const penRaw   = c[col('pen (s)')] || '';
    const penSecs  = parseFloat(penRaw) || 0;
    const postInt  = (c[col('post race int')] || '').trim();
    const intRaw   = (postInt && postInt !== '-') ? postInt : (c[col('interval (s)')] || '').trim();
    const rawId      = c[col('id')] || '';
    const driverEntry = (typeof FDL_DRIVERS !== 'undefined')
      ? FDL_DRIVERS.find(d => d.id === parseInt(rawId, 10))
      : null;
    rows.push({
      pos,
      id:       rawId,
      driver:   c[col('driver')] || '',
      interval: intRaw,
      penSecs,
      team:     driverEntry ? driverEntry.team   : '',
      teamId:   driverEntry ? driverEntry.teamId : null,
      class:    driverEntry ? driverEntry.class  : '',
    });
  }
  rows.sort((a, b) => a.pos - b.pos);
  return rows;
}

// ── Silver winner auto-detection ─────────────────────────────────
function findTopSilver(rows) {
  return rows
    .filter(d => d.class === 'SILVER')
    .sort((a, b) => a.pos - b.pos)
    .slice(0, 3)
    .map(d => String(d.id));
}

// ── Table HTML ───────────────────────────────────────────────────
function buildRow(d, silverIds) {
  const isP1 = d.pos === 1;
  const isP2 = d.pos === 2;
  const isP3 = d.pos === 3;
  const silverRank = silverIds ? silverIds.indexOf(d.id) + 1 : 0; // 1/2/3 or 0

  let rowCls = '';
  if (isP1) rowCls = 'g-row-p1';
  else if (isP2) rowCls = 'g-row-p2';
  else if (isP3) rowCls = 'g-row-p3';
  else if (silverRank === 1) rowCls = 'g-row-silver';
  else if (silverRank === 2) rowCls = 'g-row-silver-2';
  else if (silverRank === 3) rowCls = 'g-row-silver-3';

  const penBadge = d.penSecs > 0
    ? `<span class="pen-badge">+${d.penSecs}s</span>`
    : '';

  const silverBadge = silverRank === 1 ? ' <span class="silver-badge">🥇</span>'
    : silverRank === 2 ? ' <span class="silver-badge">🥈</span>'
    : silverRank === 3 ? ' <span class="silver-badge">🥉</span>'
    : '';

  const teamLabel = d.teamId ? d.teamId : (d.team || '');
  const meta      = teamLabel ? ` <span class="driver-meta">${teamLabel}${d.class ? ' · ' + d.class : ''}</span>` : '';

  return `<tr class="${rowCls}"><td>${d.pos}</td><td>${d.driver}${silverBadge}${penBadge}${meta}</td><td>${formatInterval(d.interval)}</td></tr>`;
}

function buildHalfTable(rows, silverIds) {
  let h = '<thead><tr><th></th><th>DRIVER</th><th>INT</th></tr></thead><tbody>';
  rows.forEach(d => { h += buildRow(d, silverIds); });
  return h + '</tbody>';
}

function buildTable(drivers, silverIds) {
  if (!drivers.length) return '';
  const half = Math.ceil(drivers.length / 2);
  const left  = drivers.slice(0, half);
  const right = drivers.slice(half);
  return `<table>${buildHalfTable(left, silverIds)}</table><table>${buildHalfTable(right, silverIds)}</table>`;
}

function formatInterval(raw) {
  if (!raw || raw === '0' || raw === '0.000') return '–';
  if (raw === '-') return '–';
  // Lap-down intervals: '-1 L', '-2 L' etc.
  if (raw.includes('L') || raw.includes('l')) {
    return raw.trim();
  }
  // Positive number: show as +x.xxx
  const n = parseFloat(raw);
  if (!isNaN(n) && n > 0) return '+' + n.toFixed(3);
  return raw;
}

// ── Title builder ────────────────────────────────────────────────
function buildTitle() {
  if (roundType === 'sprint') {
    return sprintType === 'feature' ? 'Feature Race Report' : 'Sprint Race Report';
  }
  return 'Race Report';
}

// ── Render ───────────────────────────────────────────────────────
function render() {
  const title = buildTitle();
  document.getElementById('g-round-title').textContent = `Round ${roundNumber} ${title}`;
  document.getElementById('g-subtitle').textContent    = trackName ? trackName.toUpperCase() : '';
  document.getElementById('g-table').innerHTML = buildTable(drivers, findTopSilver(drivers));
}

// ── Export ───────────────────────────────────────────────────────
function h2c() {
  return document.fonts.ready.then(() =>
    html2canvas(document.getElementById('graphic'), {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#000000', logging: false,
      width: 700, height: 700,
    })
  );
}

function downloadJPG() {
  const label = buildTitle().toLowerCase().replace(/\s+/g, '-');
  h2c().then(canvas => {
    const a = document.createElement('a');
    a.download = `fdl-r${roundNumber}-${label}.jpg`;
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
            btn.textContent = '✓ Copied!';
            setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000);
          })
          .catch(() => alert('Copy failed — use Download instead'));
      } catch (e) {
        alert('Copy failed — use Download instead');
      }
    });
  }).catch(err => alert('Export failed: ' + err.message));
}

// ── Discord text ────────────────────────────────────────────────
function updateDiscordText() {
  const rn   = document.getElementById('round-number').value || '?';
  const tn   = document.getElementById('track-name').value || '?';
  const text = `**:clipboard: Race Report \u2013 SFL Round ${rn} @ ${tn} ${selectedFlag.code} **\n\nThe results from Round ${rn} at ${tn} are now official!`;
  const ta   = document.getElementById('discord-text');
  if (ta) ta.value = text;
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
  const list    = document.getElementById('flag-list');
  const query   = flagSearch.toLowerCase();
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
        updateDiscordText();
      }
    });
  });
}

// ── Init ─────────────────────────────────────────────────────────
(function init() {
  document.getElementById('g-logo').src        = logoDataURL;
  document.getElementById('logo-gripline').src = gripDataURL;
  document.getElementById('logo-es').src       = esDataURL;
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



  // Round type toggle
  document.querySelectorAll('.toggle-btn[data-round]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn[data-round]').forEach(b => b.classList.remove('toggle-btn--active'));
      btn.classList.add('toggle-btn--active');
      roundType = btn.dataset.round;
      document.getElementById('sprint-type-row').style.display = roundType === 'sprint' ? '' : 'none';
      render();
    });
  });

  // Sprint sub-type toggle
  document.querySelectorAll('.toggle-btn[data-sprint]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn[data-sprint]').forEach(b => b.classList.remove('toggle-btn--active'));
      btn.classList.add('toggle-btn--active');
      sprintType = btn.dataset.sprint;
      render();
    });
  });

  document.getElementById('race-data').addEventListener('input', e => {
    drivers = parseRaceData(e.target.value);
    render();
  });

  document.getElementById('generate-btn').addEventListener('click', () => {
    const card = document.getElementById('export-card');
    card.style.display = 'block';
    render();
    updateDiscordText();
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('download-btn').addEventListener('click', downloadJPG);
  document.getElementById('copy-btn').addEventListener('click', copyToClipboard);

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
    btn.textContent = '\u2713 Copied!';
    btn.classList.add('success');
    setTimeout(() => { btn.textContent = 'Copy Text'; btn.classList.remove('success'); }, 2000);
  });
})();
