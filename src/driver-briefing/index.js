(function () {

  const FLAG_EMOJIS = [
    { code: "🇦🇺", name: "Australia",      search: "australia" },
    { code: "🇺🇸", name: "United States",  search: "united states usa america" },
    { code: "🇬🇧", name: "United Kingdom", search: "united kingdom uk britain england" },
    { code: "🇩🇪", name: "Germany",        search: "germany" },
    { code: "🇫🇷", name: "France",         search: "france" },
    { code: "🇮🇹", name: "Italy",          search: "italy" },
    { code: "🇯🇵", name: "Japan",          search: "japan" },
    { code: "🇨🇦", name: "Canada",         search: "canada" },
    { code: "🇧🇷", name: "Brazil",         search: "brazil" },
    { code: "🇲🇽", name: "Mexico",         search: "mexico" },
    { code: "🇪🇸", name: "Spain",          search: "spain" },
    { code: "🇳🇱", name: "Netherlands",    search: "netherlands holland" },
    { code: "🇧🇪", name: "Belgium",        search: "belgium" },
    { code: "🇦🇹", name: "Austria",        search: "austria" },
    { code: "🇵🇹", name: "Portugal",       search: "portugal" },
    { code: "🇨🇭", name: "Switzerland",    search: "switzerland" },
    { code: "🇸🇪", name: "Sweden",         search: "sweden" },
    { code: "🇳🇴", name: "Norway",         search: "norway" },
    { code: "🇩🇰", name: "Denmark",        search: "denmark" },
    { code: "🇫🇮", name: "Finland",        search: "finland" },
    { code: "🇵🇱", name: "Poland",         search: "poland" },
    { code: "🇨🇿", name: "Czech Republic", search: "czech republic czechia" },
    { code: "🇭🇺", name: "Hungary",        search: "hungary" },
    { code: "🇷🇴", name: "Romania",        search: "romania" },
    { code: "🇷🇺", name: "Russia",         search: "russia" },
    { code: "🇨🇳", name: "China",          search: "china" },
    { code: "🇰🇷", name: "South Korea",    search: "south korea" },
    { code: "🇮🇳", name: "India",          search: "india" },
    { code: "🇿🇦", name: "South Africa",   search: "south africa" },
    { code: "🇦🇪", name: "UAE",            search: "uae united arab emirates dubai" },
    { code: "🇸🇦", name: "Saudi Arabia",   search: "saudi arabia" },
    { code: "🇸🇬", name: "Singapore",      search: "singapore" },
    { code: "🇳🇿", name: "New Zealand",    search: "new zealand" },
    { code: "🇦🇷", name: "Argentina",      search: "argentina" },
    { code: "🇨🇱", name: "Chile",          search: "chile" },
    { code: "🇹🇷", name: "Turkey",         search: "turkey" },
    { code: "🇬🇷", name: "Greece",         search: "greece" },
    { code: "🇮🇪", name: "Ireland",        search: "ireland" },
    { code: "🇲🇨", name: "Monaco",         search: "monaco" },
    { code: "🇧🇭", name: "Bahrain",        search: "bahrain" },
    { code: "🇦🇿", name: "Azerbaijan",     search: "azerbaijan baku" },
    { code: "🇲🇾", name: "Malaysia",       search: "malaysia" },
    { code: "🇹🇭", name: "Thailand",       search: "thailand" },
    { code: "🇺🇾", name: "Uruguay",        search: "uruguay" },
    { code: "🇵🇪", name: "Peru",           search: "peru" },
    { code: "🇨🇴", name: "Colombia",       search: "colombia" },
    { code: "🇻🇳", name: "Vietnam",        search: "vietnam" },
    { code: "🇮🇩", name: "Indonesia",      search: "indonesia" },
  ];

  const FIXED_SECTIONS = [
    {
      heading: '**🚨 Virtual Safety Car (VSC) In Effect Tonight**',
      body: 'Please familiarise yourself with the VSC procedure in the ⁠https://discord.com/channels/1307904004638113814/1308213248633339974. TL;DR: It operates like a standard Safety Car, except the race leader controls the field instead of Race Control driving a manual Safety Car.',
    },
    {
      heading: '**🛑 Race Control (RC)**',
      body: 'If you\'re involved in an incident:\n🗣️ Only say: "Car #XX, Lap X, Turn X" – **No extra chatter**.\n🚨 If you need a tow, say: "Car #XX, requesting a tow"',
    },
    {
      heading: '**📻 Radio Use**',
      body: 'Radio comms are strictly for RC-to-driver communication. Any other use may result in penalties.',
    },
  ];

  const state = {
    roundNumber: 1,
    trackName: '',
    selectedFlag: FLAG_EMOJIS[0],
    flagSearch: '',
    flagDropdownOpen: false,
    warnings: [],
    nextId: 0,
  };

  // ── Output builder ────────────────────────────────────────────────
  function buildPost() {
    const { roundNumber, trackName, selectedFlag, warnings } = state;
    const track = trackName || 'TBC';

    let post = `**Driver Briefing – SFL Round ${roundNumber} @ ${track} ${selectedFlag.code}  **\n\n@sfl ,`;

    warnings.forEach(w => {
      post += `\n\n **⚠️  ${w.title || 'Warning'}**\n${w.text || ''}`;
    });

    FIXED_SECTIONS.forEach(s => {
      post += `\n\n${s.heading}\n${s.body}`;
    });

    return post;
  }

  // ── Render output only ─────────────────────────────────────────────
  function render() {
    document.getElementById('raw-output').textContent = buildPost();
    document.getElementById('flag-trigger-code').textContent = state.selectedFlag.code;
    document.getElementById('flag-trigger-name').textContent = state.selectedFlag.name;

    const panel = document.getElementById('flag-panel');
    if (state.flagDropdownOpen) {
      panel.classList.add('open');
      renderFlagList();
    } else {
      panel.classList.remove('open');
    }
  }

  // ── Warnings DOM ──────────────────────────────────────────────────
  function renderWarnings() {
    const list = document.getElementById('warnings-list');

    if (!state.warnings.length) {
      list.innerHTML = '<p class="no-warnings">No warnings — the fixed sections will still be included.</p>';
      render();
      return;
    }

    list.innerHTML = state.warnings.map((w, i) => `
      <div class="warning-item" data-id="${w.id}">
        <div class="warning-item__header">
          <span class="warning-item__num">Warning ${i + 1}</span>
          <button class="warning-remove-btn" data-id="${w.id}" aria-label="Remove warning">✕</button>
        </div>
        <div class="form-group">
          <label class="label">Title</label>
          <input type="text" class="input-field warning-title" data-id="${w.id}" value="${escHtml(w.title)}" placeholder="e.g. Kerb Cutting at T3">
        </div>
        <div class="form-group">
          <label class="label">Text</label>
          <textarea class="input-field warning-text" data-id="${w.id}" rows="3" placeholder="Warning details...">${escHtml(w.text)}</textarea>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.warning-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.warnings = state.warnings.filter(w => w.id !== Number(btn.dataset.id));
        renderWarnings();
      });
    });

    list.querySelectorAll('.warning-title').forEach(input => {
      input.addEventListener('input', () => {
        const w = state.warnings.find(w => w.id === Number(input.dataset.id));
        if (w) { w.title = input.value; render(); }
      });
    });

    list.querySelectorAll('.warning-text').forEach(ta => {
      ta.addEventListener('input', () => {
        const w = state.warnings.find(w => w.id === Number(ta.dataset.id));
        if (w) { w.text = ta.value; render(); }
      });
    });

    render();
  }

  // ── Flag list ─────────────────────────────────────────────────────
  function renderFlagList() {
    const list = document.getElementById('flag-list');
    const query = state.flagSearch.toLowerCase();
    const filtered = query
      ? FLAG_EMOJIS.filter(f => f.name.toLowerCase().includes(query) || f.search.includes(query))
      : FLAG_EMOJIS;

    if (!filtered.length) {
      list.innerHTML = '<div class="flag-no-results">No results</div>';
      return;
    }

    list.innerHTML = filtered.map(f => `
      <div class="flag-item${f.code === state.selectedFlag.code ? ' flag-item--active' : ''}" data-idx="${FLAG_EMOJIS.indexOf(f)}" role="option">
        <span class="flag-item__code">${f.code}</span>
        <span>${escHtml(f.name)}</span>
      </div>
    `).join('');

    list.querySelectorAll('.flag-item').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        const flag = FLAG_EMOJIS[parseInt(item.dataset.idx, 10)];
        if (flag) {
          state.selectedFlag = flag;
          state.flagDropdownOpen = false;
          state.flagSearch = '';
          document.getElementById('flag-search').value = '';
          render();
        }
      });
    });
  }

  // ── Clipboard ─────────────────────────────────────────────────────
  function copyToClipboard(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    document.getElementById('round-number').addEventListener('input', e => {
      state.roundNumber = parseInt(e.target.value, 10) || 1;
      render();
    });

    document.getElementById('track-name').addEventListener('input', e => {
      state.trackName = e.target.value;
      render();
    });

    document.getElementById('add-warning-btn').addEventListener('click', () => {
      state.warnings.push({ id: state.nextId++, title: '', text: '' });
      renderWarnings();
    });

    const flagDropdown = document.getElementById('flag-dropdown');
    const flagTrigger  = document.getElementById('flag-trigger');
    const flagSearch   = document.getElementById('flag-search');

    flagTrigger.addEventListener('click', e => {
      e.stopPropagation();
      state.flagDropdownOpen = !state.flagDropdownOpen;
      render();
      if (state.flagDropdownOpen) flagSearch.focus();
    });

    flagSearch.addEventListener('click', e => e.stopPropagation());

    flagSearch.addEventListener('input', e => {
      state.flagSearch = e.target.value;
      renderFlagList();
    });

    document.addEventListener('click', e => {
      if (state.flagDropdownOpen && !flagDropdown.contains(e.target)) {
        state.flagDropdownOpen = false;
        render();
      }
    });

    const copyBtn = document.getElementById('copy-btn');
    copyBtn.addEventListener('click', () => {
      copyToClipboard(document.getElementById('raw-output').textContent);
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('success');
      setTimeout(() => {
        copyBtn.textContent = 'Copy to Clipboard';
        copyBtn.classList.remove('success');
      }, 2000);
    });

    renderWarnings();
    render();
  }

  init();

})();
