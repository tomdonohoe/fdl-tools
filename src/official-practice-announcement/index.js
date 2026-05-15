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

function generateTimeOptions() {
  const options = [];
  for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += 30) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "AM" : "PM";
    options.push({ label: `${hour12}:${m === 0 ? "00" : "30"} ${ampm}`, totalMinutes });
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function getTodaySydney() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
}

function getSydneyMidnightUnix(dateStr) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const utcMidnight = Date.UTC(y, mo - 1, d);
  const sydneyHour = Number(
    new Date(utcMidnight).toLocaleString("en-AU", {
      timeZone: "Australia/Sydney",
      hour: "numeric",
      hour12: false,
    })
  );
  return utcMidnight / 1000 - sydneyHour * 3600;
}

function minutesToUnix(totalMinutes, midnightUnix) {
  return midnightUnix + totalMinutes * 60;
}

function formatDuration(startMinutes, endMinutes) {
  let diff = endMinutes - startMinutes;
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (mins === 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  return `${hours}h ${mins}m`;
}

function minutesToLabel(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:${m === 0 ? "00" : "30"} ${ampm}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function copyToClipboard(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.top = "-9999px";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Copy failed:", err);
  }
  document.body.removeChild(el);
}

const state = {
  roundNumber: 4,
  trackName: "Virginia",
  selectedFlag: FLAG_EMOJIS[0],
  flagSearch: "",
  flagDropdownOpen: false,
  sessionDate: getTodaySydney(),
  startMinutes: 1110,
  endMinutes: 1350,
  bodyText: "Track conditions are static with 100% track usage and set to match race conditions, so all times over the 4 hours are comparable.",
};

function buildDiscordOutput(startUnix, endUnix, duration) {
  const { roundNumber, trackName, selectedFlag, bodyText } = state;
  return (
    `** :fdllogo: SFL Round ${roundNumber} Official Practice Session @ ${trackName} ${selectedFlag.code}   **\n\n` +
    `@sfl , official practice server for round ${roundNumber} is going live tonight!\n\n` +
    `**Session Time**\n` +
    `- Practice: <t:${startUnix}:t> - <t:${endUnix}:t> (${duration})\n\n` +
    `${bodyText}\n\n` +
    `See you on track!`
  );
}

function renderFlagList() {
  const list = document.getElementById("flag-list");
  const query = state.flagSearch.toLowerCase();
  const filtered = query
    ? FLAG_EMOJIS.filter(f => f.name.toLowerCase().includes(query) || f.search.includes(query))
    : FLAG_EMOJIS;

  if (filtered.length === 0) {
    list.innerHTML = '<div class="flag-no-results">No results</div>';
    return;
  }

  list.innerHTML = filtered
    .map(f => `
      <div class="flag-item${f.code === state.selectedFlag.code ? " flag-item--active" : ""}" data-idx="${FLAG_EMOJIS.indexOf(f)}" role="option">
        <span class="flag-item__code">${f.code}</span>
        <span>${escapeHtml(f.name)}</span>
      </div>`)
    .join("");

  list.querySelectorAll(".flag-item").forEach(item => {
    item.addEventListener("click", e => {
      e.stopPropagation();
      const flag = FLAG_EMOJIS[parseInt(item.dataset.idx, 10)];
      if (flag) {
        state.selectedFlag = flag;
        state.flagDropdownOpen = false;
        state.flagSearch = "";
        document.getElementById("flag-search").value = "";
        render();
      }
    });
  });
}

function renderPreview(duration) {
  const { roundNumber, trackName, selectedFlag, bodyText } = state;
  const startLabel = minutesToLabel(state.startMinutes);
  const endLabel = minutesToLabel(state.endMinutes);

  document.getElementById("preview-box").innerHTML = `
    <div style="margin-bottom:12px">
      <span class="preview-bold">:fdllogo: SFL Round ${roundNumber} Official Practice Session @ ${escapeHtml(trackName)} ${selectedFlag.code}</span>
    </div>
    <div style="margin-bottom:12px">
      <span class="preview-mention">@sfl</span>, official practice server for round ${roundNumber} is going live tonight!
    </div>
    <div style="margin-bottom:4px"><span class="preview-bold">Session Time</span></div>
    <div style="margin-bottom:12px">
      - Practice: <span class="preview-timestamp">🕕 ${startLabel}</span> - <span class="preview-timestamp">🕙 ${endLabel}</span> (${escapeHtml(duration)})
    </div>
    <div style="margin-bottom:12px" class="preview-body">${escapeHtml(bodyText)}</div>
    <div><span class="preview-bold">See you on track!</span></div>
  `;
}

function render() {
  const midnightUnix = getSydneyMidnightUnix(state.sessionDate);
  const startUnix = minutesToUnix(state.startMinutes, midnightUnix);
  const endUnix = minutesToUnix(state.endMinutes, midnightUnix);
  const duration = formatDuration(state.startMinutes, state.endMinutes);

  document.getElementById("info-duration").textContent = duration;
  document.getElementById("info-start-unix").textContent = startUnix;
  document.getElementById("info-end-unix").textContent = endUnix;

  document.getElementById("raw-output").textContent = buildDiscordOutput(startUnix, endUnix, duration);

  renderPreview(duration);

  document.getElementById("flag-trigger-code").textContent = state.selectedFlag.code;
  document.getElementById("flag-trigger-name").textContent = state.selectedFlag.name;

  const panel = document.getElementById("flag-panel");
  if (state.flagDropdownOpen) {
    panel.classList.add("open");
    renderFlagList();
  } else {
    panel.classList.remove("open");
  }
}

function init() {
  const startSelect = document.getElementById("start-time");
  const endSelect = document.getElementById("end-time");

  TIME_OPTIONS.forEach(opt => {
    const a = new Option(opt.label, String(opt.totalMinutes));
    const b = new Option(opt.label, String(opt.totalMinutes));
    if (opt.totalMinutes === state.startMinutes) a.selected = true;
    if (opt.totalMinutes === state.endMinutes) b.selected = true;
    startSelect.appendChild(a);
    endSelect.appendChild(b);
  });

  document.getElementById("round-number").value = state.roundNumber;
  document.getElementById("track-name").value = state.trackName;
  document.getElementById("session-date").value = state.sessionDate;
  document.getElementById("body-text").value = state.bodyText;

  document.getElementById("round-number").addEventListener("input", e => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 20) val = 20;
    state.roundNumber = val;
    render();
  });

  document.getElementById("track-name").addEventListener("input", e => {
    state.trackName = e.target.value;
    render();
  });

  document.getElementById("session-date").addEventListener("change", e => {
    if (e.target.value) {
      state.sessionDate = e.target.value;
      render();
    }
  });

  document.getElementById("start-time").addEventListener("change", e => {
    state.startMinutes = parseInt(e.target.value, 10);
    render();
  });

  document.getElementById("end-time").addEventListener("change", e => {
    state.endMinutes = parseInt(e.target.value, 10);
    render();
  });

  document.getElementById("body-text").addEventListener("input", e => {
    state.bodyText = e.target.value;
    render();
  });

  const flagDropdown = document.getElementById("flag-dropdown");
  const flagTrigger = document.getElementById("flag-trigger");
  const flagSearch = document.getElementById("flag-search");

  flagTrigger.addEventListener("click", e => {
    e.stopPropagation();
    state.flagDropdownOpen = !state.flagDropdownOpen;
    render();
    if (state.flagDropdownOpen) flagSearch.focus();
  });

  flagSearch.addEventListener("click", e => e.stopPropagation());

  flagSearch.addEventListener("input", e => {
    state.flagSearch = e.target.value;
    renderFlagList();
  });

  document.addEventListener("click", e => {
    if (state.flagDropdownOpen && !flagDropdown.contains(e.target)) {
      state.flagDropdownOpen = false;
      render();
    }
  });

  const copyBtn = document.getElementById("copy-btn");
  copyBtn.addEventListener("click", () => {
    copyToClipboard(document.getElementById("raw-output").textContent);
    copyBtn.textContent = "✓ Copied!";
    copyBtn.classList.add("success");
    setTimeout(() => {
      copyBtn.textContent = "Copy to Clipboard";
      copyBtn.classList.remove("success");
    }, 2000);
  });

  render();
}

init();
