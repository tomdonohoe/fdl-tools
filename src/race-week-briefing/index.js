// ── Defaults ────────────────────────────────────────────────────────────────

function defaultFeature() {
  return [
    { id:"prac", label:"PRACTICE",   icon:"🏎️", durMin:60, qtype:null,   laps:2 },
    { id:"qual", label:"QUALIFYING", icon:"⏱️", durMin:15, qtype:"OPEN", laps:2 },
    { id:"grid", label:"GRIDDING",   icon:"🏁", durMin:2,  qtype:null,   laps:2 },
    { id:"race", label:"RACE",       icon:"🏆", durMin:45, qtype:null,   laps:2 },
    { id:"intv", label:"INTERVIEWS", icon:"🎤", durMin:10, qtype:null,   laps:2 },
    { id:"fin",  label:"FINISH",     icon:"🎉", durMin:0,  qtype:null,   laps:2 },
  ];
}

function defaultEndurance() {
  return [
    { id:"prac", label:"PRACTICE",   icon:"🏎️", durMin:60, qtype:null,   laps:2 },
    { id:"qual", label:"QUALIFYING", icon:"⏱️", durMin:20, qtype:"OPEN", laps:2 },
    { id:"grid", label:"GRIDDING",   icon:"🏁", durMin:2,  qtype:null,   laps:2 },
    { id:"race", label:"RACE",       icon:"🏆", durMin:90, qtype:null,   laps:2 },
    { id:"intv", label:"INTERVIEWS", icon:"🎤", durMin:10, qtype:null,   laps:2 },
    { id:"fin",  label:"FINISH",     icon:"🎉", durMin:0,  qtype:null,   laps:2 },
  ];
}

function defaultSprintS1() {
  return [
    { id:"s1_prac", label:"PRACTICE",    icon:"🏎️", durMin:60, qtype:null,   laps:2 },
    { id:"s1_qual", label:"QUALIFYING",  icon:"⏱️", durMin:7,  qtype:"LONE", laps:2 },
    { id:"s1_grid", label:"GRIDDING",    icon:"🏁", durMin:2,  qtype:null,   laps:2 },
    { id:"s1_race", label:"SPRINT RACE", icon:"🏆", durMin:20, qtype:null,   laps:2 },
    { id:"s1_end",  label:"RACE END",    icon:"🏁", durMin:0,  qtype:null,   laps:2 },
  ];
}

function defaultSprintS2() {
  return [
    { id:"s2_qual", label:"QUALIFYING", icon:"⏱️", durMin:10, qtype:"OPEN", laps:2 },
    { id:"s2_grid", label:"GRIDDING",   icon:"🏁", durMin:2,  qtype:null,   laps:2 },
    { id:"s2_race", label:"RACE",       icon:"🏆", durMin:30, qtype:null,   laps:2 },
    { id:"s2_intv", label:"INTERVIEWS", icon:"🎤", durMin:10, qtype:null,   laps:2 },
    { id:"s2_fin",  label:"FINISH",     icon:"🎉", durMin:0,  qtype:null,   laps:2 },
  ];
}

// ── State ────────────────────────────────────────────────────────────────────

function today() {
  return new Date().toLocaleDateString("en-CA");
}

const state = {
  format: "Feature",
  round: 5,
  track: "Watkins Glen International - Boot",
  raceDate: today(),
  pracDay: today(),
  pracStart: "18:30",
  pracEnd: "22:30",
  raceDayStart: "19:00",
  s1Start: "19:00",
  s2Start: "20:30",
  featureSessions: defaultFeature(),
  enduranceSessions: defaultEndurance(),
  sprintS1: defaultSprintS1(),
  sprintS2: defaultSprintS2(),
  baseSetup: "watkinsglen.sto",
  squalTank: 6,
  sraceTank: 17,
  qualTank: 18.5,
  raceTank: 26,
  fuelRestriction: 100,
  fuelCapacity: 46,
  temp: 24,
  wordTemp: "Overcast",
  cloudCover: [40, 94],
  windSpeed: [15, 24],
  windDir: "SW",
  humidity: [19, 100],
  rainChance: 64,
};

// ── Utils ────────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toDiscordTs(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:t>`;
}

function timeToDate(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`);
}

function addMins(date, mins) {
  return new Date(date.getTime() + mins * 60000);
}

function timeToMins(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatDuration(mins) {
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h} hour${h !== 1 ? "s" : ""}`;
  return `${h}h ${m}m`;
}

function pracDuration() {
  const start = timeToMins(state.pracStart);
  const end = timeToMins(state.pracEnd);
  if (end <= start) return null;
  return formatDuration(end - start);
}

function computeTimes(sessions, startDate) {
  let cursor = startDate;
  return sessions.map(s => {
    const time = new Date(cursor);
    if (s.durMin > 0) cursor = addMins(cursor, s.durMin);
    return { ...s, time };
  });
}

function raceDisplayDate(dateStr) {
  return new Date(`${dateStr}T12:00`).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ── Post builder ─────────────────────────────────────────────────────────────

function sessionLine(s) {
  const ts = toDiscordTs(s.time);
  const label = s.qtype ? `${s.qtype} ${s.label}` : s.label;
  if (s.durMin === 0) return `- ${ts} - ${label} ${s.icon}`;
  const dur = s.qtype === "LONE" ? `${s.laps}L, ${s.durMin}m` : `${s.durMin}m`;
  return `- ${ts} - ${label} (${dur}) ${s.icon}`;
}

function buildScheduleBlock() {
  const { format, raceDate, raceDayStart, s1Start, s2Start } = state;

  if (format === "Feature" || format === "Endurance") {
    const sessions = computeTimes(
      format === "Feature" ? state.featureSessions : state.enduranceSessions,
      timeToDate(raceDate, raceDayStart)
    );
    return [
      `**Race Day - ${format} (Tuesday):**`,
      ...sessions.map(sessionLine),
    ].join("\n");
  }

  const s1 = computeTimes(state.sprintS1, timeToDate(raceDate, s1Start));
  const s2 = computeTimes(state.sprintS2, timeToDate(raceDate, s2Start));
  return [
    `**Race Day - Sprint (Tuesday):**`,
    `*Sprint Server:*`,
    ...s1.map(sessionLine),
    ``,
    `*Feature Server:*`,
    ...s2.map(sessionLine),
  ].join("\n");
}

function buildFuelBlock() {
  const { format, squalTank, sraceTank, qualTank, raceTank, fuelRestriction, fuelCapacity } = state;
  const lines = [`**:fuelpump: Fuel Rules:**`];
  if (format === "Sprint") {
    lines.push(`- **Sprint Qualifying Tank:** ${squalTank}L`);
    lines.push(`- **Sprint Race Tank:** ${sraceTank}L`);
  }
  const raceLabel = format === "Sprint" ? "Feature Race Tank" : "Race Start Tank";
  lines.push(`- **Qualifying Tank:** ${qualTank}L`);
  lines.push(`- **${raceLabel}:** ${raceTank}L`);
  lines.push(`- **Fuel Restriction:** ${fuelRestriction}% (${fuelCapacity}L)`);
  return lines.join("\n");
}

function buildPost() {
  const { round, track, raceDate, pracDay, pracStart, pracEnd,
          temp, wordTemp, cloudCover, windSpeed, windDir, humidity, rainChance, baseSetup } = state;

  const pracStart_ = timeToDate(pracDay, pracStart);
  const pracEnd_   = timeToDate(pracDay, pracEnd);
  const dur        = pracDuration() || "?";

  return [
    `## :fdllogo: SFL Championship - Round ${round} :checkered_flag:`,
    `*Brought to you by Gripline & Everything Simulated*`,
    ``,
    `:earth_africa: **Track:** ${track}`,
    ``,
    `:date: **Date:** ${raceDisplayDate(raceDate)}`,
    ``,
    `:clock3: **Schedule**`,
    ``,
    `**Official Practice (Monday):**`,
    `- ${toDiscordTs(pracStart_)} - ${toDiscordTs(pracEnd_)} (${dur}) :race_car:`,
    ``,
    buildScheduleBlock(),
    ``,
    `*Times auto-adjust to your timezone*`,
    ``,
    `:tools: **Setup:** `,
    `- **Base:** \`${baseSetup}\``,
    ``,
    buildFuelBlock(),
    ``,
    `**:white_sun_rain_cloud: Weather Conditions:**`,
    `- **Temperature:** ${temp}°C | ${wordTemp}`,
    `- **Cloud Cover:** ${cloudCover[0]}% - ${cloudCover[1]}%`,
    `- **Wind:** ${windSpeed[0]} - ${windSpeed[1]} kph ${windDir}`,
    `- **Humidity:** ${humidity[0]}% - ${humidity[1]}%`,
    `- **Chance of Rain:** ${rainChance}%`,
    ``,
    `@sfl , see you on track :rocket:`,
  ].join("\n");
}

// ── HTML builders ────────────────────────────────────────────────────────────

function card(title, body) {
  return `<div class="section-card"><div class="section-card__title">${title}</div>${body}</div>`;
}

function field(label, inputHtml, extraClass) {
  return `<div class="field-group${extraClass ? " " + extraClass : ""}">
    <label class="field-label">${label}</label>
    ${inputHtml}
  </div>`;
}

function input(attrs, dataField) {
  return `<input class="input-field" data-field="${dataField}" ${attrs}>`;
}

function buildFormatSection() {
  const btns = ["Feature", "Sprint", "Endurance"].map(f =>
    `<button class="format-btn${state.format === f ? " format-btn--active" : ""}" data-action="setFormat" data-format="${f}">${f}</button>`
  ).join("");
  return card("RACE FORMAT", `<div class="format-btns">${btns}</div>`);
}

function buildEventSection() {
  return card("EVENT INFO", `
    <div class="field-grid-2">
      ${field("Round #", input('type="number" min="1" max="99" value="' + state.round + '"', "round"))}
      ${field("Race Date", input('type="date" value="' + state.raceDate + '"', "raceDate"))}
    </div>
    ${field("Track Name", input('type="text" value="' + esc(state.track) + '"', "track"), "mt-sm")}
  `);
}

function buildPracticeSection() {
  const dur = pracDuration();
  return card("OFFICIAL PRACTICE", `
    ${field("Practice Day", input('type="date" value="' + state.pracDay + '"', "pracDay"))}
    <div class="field-grid-2 mt-sm">
      ${field("Start Time", input('type="time" value="' + state.pracStart + '"', "pracStart"))}
      ${field("End Time",   input('type="time" value="' + state.pracEnd + '"', "pracEnd"))}
    </div>
    ${dur ? `<div class="prac-duration">Duration: <span>${dur}</span></div>` : ""}
  `);
}

function sessionRow(s, arrayKey) {
  const qtypeSel = s.qtype !== null ? `
    <select class="session-qtype-select" data-action="setQtype" data-array="${arrayKey}" data-id="${s.id}">
      <option value="OPEN"${s.qtype === "OPEN" ? " selected" : ""}>OPEN</option>
      <option value="LONE"${s.qtype === "LONE" ? " selected" : ""}>LONE</option>
    </select>` : "";

  let durArea = `<span class="session-term">—</span>`;
  if (s.durMin !== 0) {
    durArea = "";
    if (s.qtype === "LONE") {
      durArea += `<input class="session-num-input session-num-input--laps" type="number" min="1"
        data-action="setLaps" data-array="${arrayKey}" data-id="${s.id}" value="${s.laps}">
        <span class="session-unit">L</span>`;
    }
    durArea += `<input class="session-num-input session-num-input--dur" type="number" min="0"
      data-action="setDur" data-array="${arrayKey}" data-id="${s.id}" value="${s.durMin}">
      <span class="session-unit">m</span>`;
  }

  return `<div class="session-row">
    <span class="session-icon">${s.icon}</span>
    <div class="session-label">${qtypeSel}<span class="session-name">${s.label}</span></div>
    <div class="session-duration">${durArea}</div>
  </div>`;
}

function buildScheduleSection() {
  const { format, raceDayStart, s1Start, s2Start } = state;

  if (format === "Feature" || format === "Endurance") {
    const key = format === "Feature" ? "featureSessions" : "enduranceSessions";
    return card("RACE DAY SCHEDULE", `
      ${field("Session Start Time", input('type="time" value="' + raceDayStart + '"', "raceDayStart"))}
      <div class="session-list mt-sm">
        ${state[key].map(s => sessionRow(s, key)).join("")}
      </div>
    `);
  }

  return card("RACE DAY SCHEDULE", `
    <div class="sprint-sub-label">Sprint Server (Server 1)</div>
    ${field("Server Start Time", input('type="time" value="' + s1Start + '"', "s1Start"))}
    <div class="session-list mt-sm">
      ${state.sprintS1.map(s => sessionRow(s, "sprintS1")).join("")}
    </div>
    <div class="sprint-sub-label mt-md">Feature Server (Server 2)</div>
    ${field("Server Start Time", input('type="time" value="' + s2Start + '"', "s2Start"))}
    <div class="session-list mt-sm">
      ${state.sprintS2.map(s => sessionRow(s, "sprintS2")).join("")}
    </div>
  `);
}

function buildSetupSection() {
  const { format, baseSetup, squalTank, sraceTank, qualTank, raceTank, fuelRestriction, fuelCapacity } = state;
  const qualLabel = format === "Sprint" ? "Qual Tank (L)"         : "Qualifying Tank (L)";
  const raceLabel = format === "Sprint" ? "Feature Race Tank (L)" : "Race Start Tank (L)";

  const sprintTanks = format === "Sprint" ? `
    <div class="field-grid-2 mt-sm">
      ${field("Sprint Qual Tank (L)", input('type="number" step="0.5" value="' + squalTank + '"', "squalTank"))}
      ${field("Sprint Race Tank (L)", input('type="number" step="0.5" value="' + sraceTank + '"', "sraceTank"))}
    </div>` : "";

  return card("SETUP & FUEL", `
    ${field("Base Setup File", input('type="text" value="' + esc(baseSetup) + '"', "baseSetup"))}
    ${sprintTanks}
    <div class="field-grid-2 mt-sm">
      ${field(qualLabel, input('type="number" step="0.5" value="' + qualTank + '"', "qualTank"))}
      ${field(raceLabel, input('type="number" step="0.5" value="' + raceTank + '"', "raceTank"))}
    </div>
    <div class="field-grid-2 mt-sm">
      ${field("Fuel Restriction (%)", input('type="number" min="0" max="100" value="' + fuelRestriction + '"', "fuelRestriction"))}
      ${field("Fuel Capacity (L)",    input('type="number" step="0.5" value="' + fuelCapacity + '"', "fuelCapacity"))}
    </div>
  `);
}

function rangeRow(f0, f1, unit) {
  return `<div class="range-row">
    ${input('type="number" value="' + f0.val + '" min="' + (f0.min ?? 0) + '" max="' + (f0.max ?? 9999) + '"', f0.field)}
    <span class="range-sep">—</span>
    ${input('type="number" value="' + f1.val + '" min="' + (f1.min ?? 0) + '" max="' + (f1.max ?? 9999) + '"', f1.field)}
    ${unit ? `<span class="range-unit">${unit}</span>` : ""}
  </div>`;
}

function buildWeatherSection() {
  const { temp, wordTemp, cloudCover, windSpeed, windDir, humidity, rainChance } = state;
  const condOpts = ["Clear","Partly Cloudy","Mostly Cloudy","Overcast"].map(c =>
    `<option value="${c}"${wordTemp === c ? " selected" : ""}>${c}</option>`).join("");

  return card("WEATHER", `
    <div class="field-grid-2">
      ${field("Temperature (°C)", input('type="number" value="' + temp + '"', "temp"))}
      ${field("Conditions", `<select class="input-field" data-field="wordTemp">${condOpts}</select>`)}
    </div>
    ${field("Cloud Cover", rangeRow(
      { field:"cloudCover.0", val:cloudCover[0], min:0, max:100 },
      { field:"cloudCover.1", val:cloudCover[1], min:0, max:100 }, "%"), "mt-sm")}
    <div class="field-grid-2 mt-sm">
      ${field("Wind Speed (kph)", rangeRow(
        { field:"windSpeed.0", val:windSpeed[0], min:0, max:200 },
        { field:"windSpeed.1", val:windSpeed[1], min:0, max:200 }))}
      ${field("Wind Direction", input('type="text" value="' + esc(windDir) + '"', "windDir"))}
    </div>
    ${field("Humidity", rangeRow(
      { field:"humidity.0", val:humidity[0], min:0, max:100 },
      { field:"humidity.1", val:humidity[1], min:0, max:100 }, "%"), "mt-sm")}
    ${field("Chance of Rain (%)", input('type="number" min="0" max="100" value="' + rainChance + '"', "rainChance"), "mt-sm")}
  `);
}

function buildApp() {
  const post = buildPost();
  return `
    <nav class="topnav">
      <a href="../../index.html" class="home-btn">FDL Tools</a>
    </nav>
    <header class="app-header">
      <div class="app-header__logo">🏁</div>
      <div class="app-header__text">
        <div class="app-header__title">SFL POST GENERATOR</div>
        <div class="app-header__subtitle">Championship Discord Announcements</div>
      </div>
    </header>
    <div class="panels">
      <div class="left-panel">
        ${buildFormatSection()}
        ${buildEventSection()}
        ${buildPracticeSection()}
        ${buildScheduleSection()}
        ${buildSetupSection()}
        ${buildWeatherSection()}
      </div>
      <div class="right-panel">
        <div class="preview-header">
          <span class="preview-title">DISCORD POST PREVIEW</span>
          <button class="copy-btn" id="copy-btn" data-action="copy">⎘ Copy Post</button>
        </div>
        <pre class="preview-pre" id="preview-pre">${esc(post)}</pre>
      </div>
    </div>
  `;
}

// ── Render ───────────────────────────────────────────────────────────────────

function saveFocus() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  return {
    field:  el.dataset.field,
    action: el.dataset.action,
    array:  el.dataset.array,
    id:     el.dataset.id,
    ss:     el.selectionStart,
    se:     el.selectionEnd,
  };
}

function restoreFocus(saved) {
  if (!saved) return;
  let el = null;
  if (saved.field) {
    el = document.querySelector(`[data-field="${saved.field}"]`);
  } else if (saved.action && saved.array && saved.id) {
    el = document.querySelector(`[data-action="${saved.action}"][data-array="${saved.array}"][data-id="${saved.id}"]`);
  }
  if (!el) return;
  el.focus();
  if (saved.ss != null) try { el.setSelectionRange(saved.ss, saved.se); } catch {}
}

function render() {
  const focus = saveFocus();
  document.getElementById("app").innerHTML = buildApp();
  restoreFocus(focus);
}

// ── Copy ─────────────────────────────────────────────────────────────────────

function copyPost() {
  const text = document.getElementById("preview-pre")?.textContent ?? "";
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    navigator.clipboard?.writeText(text);
  }
  document.body.removeChild(ta);

  const btn = document.getElementById("copy-btn");
  if (btn) {
    btn.textContent = "✓ Copied!";
    btn.classList.add("success");
    setTimeout(() => {
      if (btn.isConnected) {
        btn.textContent = "⎘ Copy Post";
        btn.classList.remove("success");
      }
    }, 2000);
  }
}

// ── State mutations ──────────────────────────────────────────────────────────

function applyField(field, rawValue, inputType) {
  if (field.includes(".")) {
    const [key, idx] = field.split(".");
    state[key][parseInt(idx, 10)] = parseFloat(rawValue) || 0;
    return;
  }
  state[field] = inputType === "number" ? (parseFloat(rawValue) || 0) : rawValue;
}

// ── Events (delegated — survives innerHTML rebuilds) ─────────────────────────

function init() {
  render();

  const app = document.getElementById("app");

  app.addEventListener("input", e => {
    const { field, action, array, id } = e.target.dataset;

    if (field) {
      applyField(field, e.target.value, e.target.type);
      render();
      return;
    }

    if (action === "setDur") {
      const s = state[array].find(s => s.id === id);
      if (s) { s.durMin = parseInt(e.target.value, 10) || 0; render(); }
      return;
    }

    if (action === "setLaps") {
      const s = state[array].find(s => s.id === id);
      if (s) { s.laps = parseInt(e.target.value, 10) || 1; render(); }
      return;
    }

    if (action === "setQtype") {
      const s = state[array].find(s => s.id === id);
      if (s) { s.qtype = e.target.value; render(); }
    }
  });

  app.addEventListener("click", e => {
    const { action, format } = e.target.dataset;

    if (action === "setFormat" && format !== state.format) {
      if (format === "Feature")   state.featureSessions   = defaultFeature();
      if (format === "Endurance") state.enduranceSessions = defaultEndurance();
      if (format === "Sprint") { state.sprintS1 = defaultSprintS1(); state.sprintS2 = defaultSprintS2(); }
      state.format = format;
      render();
      return;
    }

    if (action === "copy") copyPost();
  });
}

init();
