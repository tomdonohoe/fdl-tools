
// ── State ───────────────────────────────────────────────────────
let roundNumber = 5;
let seasonName  = 'SFL Championship · FDL Season 6';
let pointsType  = 'drop';
let cutAfter    = 13;
let cutLabel    = 'AOWN Cut';
let drivers     = [];

// ── Parse standings (TSV paste) ─────────────────────────────────
function parseStandings(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const rows = [];
  for (const line of lines) {
    const cols = line.split('\t');
    const pos = parseInt(cols[0], 10);
    if (isNaN(pos) || pos < 1) continue;
    const driverName = (cols[2] || '').trim();
    const entry = (typeof FDL_DRIVERS !== 'undefined')
      ? FDL_DRIVERS.find(d => d.driver.toLowerCase() === driverName.toLowerCase())
      : null;
    rows.push({
      pos,
      driver:      driverName,
      pointsTotal: parseInt(cols[6], 10) || 0,
      pointsDrop:  parseInt(cols[7], 10) || 0,
      team:   entry ? entry.team   : '',
      teamId: entry ? entry.teamId : null,
      class:  entry ? entry.class  : '',
    });
  }
  return rows;
}

// ── Table HTML ──────────────────────────────────────────────────
function buildTable(drivers, type, cutAfter, cutLabel) {
  if (!drivers.length) return '';

  const sorted = [...drivers]
    .sort((a, b) => {
      const pa = type === 'total' ? a.pointsTotal : a.pointsDrop;
      const pb = type === 'total' ? b.pointsTotal : b.pointsDrop;
      return pb - pa;
    })
    .map((d, i) => ({ ...d, displayPos: i + 1 }));

  const posClass = ['', 'g-row-p1', 'g-row-p2', 'g-row-p3'];

  const silverRanks = new Map();
  sorted.filter(d => d.class === 'SILVER').slice(0, 3).forEach((d, i) => {
    silverRanks.set(d.driver, i + 1);
  });

  let h = '<thead><tr>';
  h += '<th></th>';
  h += '<th style="text-align:left">DRIVER</th>';
  h += '<th style="text-align:right">PTS</th>';
  h += '</tr></thead><tbody>';

  sorted.forEach(d => {
    const silverRank = silverRanks.get(d.driver) || 0;
    let cls = d.displayPos <= 3 ? posClass[d.displayPos] : '';
    if (!cls) {
      if (silverRank === 1) cls = 'g-row-silver';
      else if (silverRank === 2) cls = 'g-row-silver-2';
      else if (silverRank === 3) cls = 'g-row-silver-3';
    }
    const pts = type === 'total' ? d.pointsTotal : d.pointsDrop;
    const badge = silverRank === 1 ? ' <span class="silver-badge">🥇</span>'
      : silverRank === 2 ? ' <span class="silver-badge">🥈</span>'
      : silverRank === 3 ? ' <span class="silver-badge">🥉</span>'
      : '';
    const teamLabel = d.teamId ? d.teamId : (d.team || '');
    const meta = teamLabel ? ` <span class="driver-meta">${teamLabel}${d.class ? ' · ' + d.class : ''}</span>` : '';
    h += `<tr class="${cls}">`;
    h += `<td>${d.displayPos}</td>`;
    h += `<td>${d.driver}${badge}${meta}</td>`;
    h += `<td>${pts}</td>`;
    h += '</tr>';

    if (cutAfter > 0 && d.displayPos === cutAfter) {
      h += `<tr class="g-row-cut"><td colspan="3"><span class="cut-label">${cutLabel}</span></td></tr>`;
    }
  });

  return h + '</tbody>';
}

// ── Render ──────────────────────────────────────────────────────
function render() {
  document.getElementById('g-round-title').textContent = `Round ${roundNumber} Standings`;
  document.getElementById('g-subtitle').textContent    = seasonName.toUpperCase();
  document.getElementById('g-table').innerHTML = buildTable(drivers, pointsType, cutAfter, cutLabel);
}

// ── Export ──────────────────────────────────────────────────────
function h2c() {
  return document.fonts.ready.then(() =>
    html2canvas(document.getElementById('graphic'), {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#000000', logging: false,
      width: 600, height: 720,
    })
  );
}

function downloadJPG() {
  h2c().then(canvas => {
    const a = document.createElement('a');
    a.download = `fdl-r${roundNumber}-standings.jpg`;
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

// ── Init ────────────────────────────────────────────────────────
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

  document.getElementById('season-name').addEventListener('input', e => {
    seasonName = e.target.value;
    render();
  });

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('toggle-btn--active'));
      btn.classList.add('toggle-btn--active');
      pointsType = btn.dataset.type;
      render();
    });
  });

  document.getElementById('cut-after').addEventListener('input', e => {
    cutAfter = parseInt(e.target.value, 10) || 0;
    render();
  });

  document.getElementById('cut-label').addEventListener('input', e => {
    cutLabel = e.target.value;
    render();
  });

  document.getElementById('standings-data').addEventListener('input', e => {
    drivers = parseStandings(e.target.value);
    render();
  });

  document.getElementById('generate-btn').addEventListener('click', () => {
    const card = document.getElementById('export-card');
    card.style.display = 'block';
    render();
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('download-btn').addEventListener('click', downloadJPG);
  document.getElementById('copy-btn').addEventListener('click', copyToClipboard);

  const discordDefault = `**Gripline SFL Championship** - *Season 6 (2026 S2)*\n:point_right: [Click here to view full standings](https://docs.google.com/spreadsheets/d/1St9EWbUtg1Dorl_XjpGdxPApsS0inq1jSlzQS-IeqWE/edit?usp=sharing) :trophy:`;
  document.getElementById('discord-text').value = discordDefault;

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
