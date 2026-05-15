(function () {

  let stops = 1;
  let cachedParams = null;

  // ── Lap time parser ───────────────────────────────────────────────
  function parseLapTime(str) {
    str = str.trim();
    const colonParts = str.split(':');
    if (colonParts.length === 2) {
      // m:ss.ms  e.g. "1:31.500"
      return parseInt(colonParts[0], 10) * 60 + parseFloat(colonParts[1]);
    }
    if (colonParts.length === 3) {
      // m:ss:ms  e.g. "1:31:500"
      return parseInt(colonParts[0], 10) * 60 + parseInt(colonParts[1], 10) + parseInt(colonParts[2], 10) / 1000;
    }
    return parseFloat(str); // bare seconds
  }

  function roundUp1(n)  { return Math.ceil(n * 10) / 10; }
  function roundUp05(n) { return Math.ceil(n * 2) / 2; }

  // ── Build result from adjustable params ──────────────────────────
  function buildResult(fuelPerLap, tankCapacity, totalLaps, numStops, startingFuel, restrictionPct) {
    const restrictionAmount = restrictionPct * tankCapacity / 100;
    const totalFuel  = totalLaps * fuelPerLap;
    const lap1Refuel = roundUp1(Math.max(0, restrictionAmount - startingFuel + fuelPerLap));

    if (numStops === 1) {
      const pit1Lap = Math.floor(startingFuel / fuelPerLap);

      return {
        totalLaps, totalFuel, startingFuel, restrictionAmount, restrictionPct, lap1Refuel,
        pits: [
          { label: 'Pit Stop 1', lap: pit1Lap, add: restrictionAmount },
        ],
        stints: [
          { label: 'Stint 1', lapStart: 1,          lapEnd: pit1Lap,   laps: pit1Lap,             fuel: pit1Lap * fuelPerLap },
          { label: 'Stint 2', lapStart: pit1Lap + 1, lapEnd: totalLaps, laps: totalLaps - pit1Lap, fuel: (totalLaps - pit1Lap) * fuelPerLap },
        ],
      };
    }

    // 2 stops — two equal stints + short final stint, reduced starting fuel.
    // Starting fuel = R - (stop2 - fuelPerLap): if a driver crashes on lap 1 and
    // tops up with ~stop2 litres, their tank reaches ~R so they only need one more stop.
    const s1       = Math.floor(startingFuel / fuelPerLap);
    const left1    = startingFuel - s1 * fuelPerLap;
    const tankPit1 = left1 + restrictionAmount;
    const s2       = Math.floor(tankPit1 / fuelPerLap);
    const s3       = totalLaps - s1 - s2;
    const left2    = tankPit1 - s2 * fuelPerLap;
    const stop2    = roundUp1(Math.max(0, s3 * fuelPerLap - left2));
    const pit1Lap  = s1;
    const pit2Lap  = s1 + s2;

    return {
      totalLaps, totalFuel, startingFuel, restrictionAmount, restrictionPct, lap1Refuel,
      pits: [
        { label: 'Pit Stop 1', lap: pit1Lap, add: restrictionAmount },
        { label: 'Pit Stop 2', lap: pit2Lap, add: stop2 },
      ],
      stints: [
        { label: 'Stint 1', lapStart: 1,           lapEnd: pit1Lap,   laps: s1, fuel: s1 * fuelPerLap },
        { label: 'Stint 2', lapStart: pit1Lap + 1,  lapEnd: pit2Lap,   laps: s2, fuel: s2 * fuelPerLap },
        { label: 'Stint 3', lapStart: pit2Lap + 1,  lapEnd: totalLaps, laps: s3, fuel: s3 * fuelPerLap },
      ],
    };
  }

  // ── Core calculation ──────────────────────────────────────────────
  function calculate(fuelPerLap, tankCapacity, lapTimeSecs, raceDurationMins, numStops) {
    const totalLaps = Math.ceil(raceDurationMins * 60 / lapTimeSecs);
    let restrictionPct, startingFuel;

    if (numStops === 1) {
      restrictionPct = Math.ceil(totalLaps * fuelPerLap / 2 / tankCapacity * 100);
      startingFuel   = roundUp05(restrictionPct * tankCapacity / 100);
    } else {
      const halfLaps     = Math.floor((totalLaps - 1) / 2);
      restrictionPct     = Math.ceil(halfLaps * fuelPerLap / tankCapacity * 100);
      const restrictionAmount = restrictionPct * tankCapacity / 100;

      // First pass: find stop2 with startingFuel = restrictionAmount
      const _s1    = Math.floor(restrictionAmount / fuelPerLap);
      const _tank2 = (restrictionAmount - _s1 * fuelPerLap) + restrictionAmount;
      const _s2    = Math.floor(_tank2 / fuelPerLap);
      const _s3    = totalLaps - _s1 - _s2;
      const _left2 = _tank2 - _s2 * fuelPerLap;
      const _stop2 = roundUp1(Math.max(0, _s3 * fuelPerLap - _left2));

      startingFuel = roundUp05(restrictionAmount - (_stop2 - fuelPerLap));
    }

    cachedParams = { fuelPerLap, tankCapacity, totalLaps, numStops, startingFuel, restrictionPct };
    return buildResult(fuelPerLap, tankCapacity, totalLaps, numStops, startingFuel, restrictionPct);
  }

  // ── Validation ────────────────────────────────────────────────────
  function validate(fuelPerLap, tankCapacity, lapTimeSecs, raceDurationMins) {
    if (isNaN(fuelPerLap)    || fuelPerLap <= 0)    return 'Enter a valid fuel per lap value.';
    if (isNaN(tankCapacity)  || tankCapacity <= 0)   return 'Enter a valid tank capacity.';
    if (isNaN(lapTimeSecs)   || lapTimeSecs <= 0)    return 'Enter a valid lap time (e.g. 1:31.500).';
    if (isNaN(raceDurationMins) || raceDurationMins <= 0) return 'Enter a valid race duration.';
    if (fuelPerLap >= tankCapacity) return 'Fuel per lap must be less than tank capacity.';
    return null;
  }

  // ── Render results ────────────────────────────────────────────────
  function renderResults(res) {
    document.getElementById('results-card').style.display = '';

    document.getElementById('r-laps').textContent        = res.totalLaps;
    document.getElementById('r-total-fuel').textContent  = res.totalFuel.toFixed(1) + ' L';
    document.getElementById('r-lap1-refuel').textContent = res.lap1Refuel.toFixed(1) + ' L';

    document.getElementById('r-starting-fuel').textContent      = res.startingFuel.toFixed(1) + ' L';
    document.getElementById('r-restriction-pct').textContent    = res.restrictionPct + '%';
    document.getElementById('r-restriction-amount').textContent = 'max ' + res.restrictionAmount.toFixed(1) + ' L per stop';

    const pitList = document.getElementById('r-pits');
    pitList.innerHTML = res.pits.map(p => `
      <div class="pit-row">
        <span class="pit-row__stop">${p.label}</span>
        <span class="pit-row__lap">Lap ${p.lap}</span>
        <span class="pit-row__add">+ ${p.add.toFixed(1)} L</span>
      </div>
    `).join('');

    const stintList = document.getElementById('r-stints');
    stintList.innerHTML = res.stints.map(s => `
      <div class="stint-row">
        <span class="stint-row__label">${s.label}</span>
        <span class="stint-row__laps">Laps ${s.lapStart}–${s.lapEnd} &nbsp;(${s.laps} laps)</span>
        <span class="stint-row__fuel">${s.fuel.toFixed(1)} L</span>
      </div>
    `).join('');

    document.getElementById('results-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Adjust helper ─────────────────────────────────────────────────
  function adjust(sfDelta, rpDelta) {
    if (!cachedParams) return;
    if (sfDelta) cachedParams.startingFuel   = Math.max(0.5, cachedParams.startingFuel + sfDelta);
    if (rpDelta) cachedParams.restrictionPct = Math.min(100, Math.max(1, cachedParams.restrictionPct + rpDelta));
    renderResults(buildResult(
      cachedParams.fuelPerLap, cachedParams.tankCapacity, cachedParams.totalLaps,
      cachedParams.numStops,   cachedParams.startingFuel,  cachedParams.restrictionPct
    ));
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    // Stop toggle
    document.querySelectorAll('.toggle-btn[data-stops]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.toggle-btn[data-stops]').forEach(b => b.classList.remove('toggle-btn--active'));
        btn.classList.add('toggle-btn--active');
        stops = parseInt(btn.dataset.stops, 10);
      });
    });

    // Lap time hint
    document.getElementById('lap-time').addEventListener('input', e => {
      const val = e.target.value.trim();
      const hint = document.getElementById('lap-time-hint');
      if (!val) { hint.textContent = ''; return; }
      const secs = parseLapTime(val);
      hint.textContent = isNaN(secs) || secs <= 0 ? 'Invalid format' : `= ${secs.toFixed(3)}s`;
    });

    // Calculate
    document.getElementById('calc-btn').addEventListener('click', () => {
      const fuelPerLap       = parseFloat(document.getElementById('fuel-per-lap').value);
      const tankCapacity     = parseFloat(document.getElementById('tank-capacity').value);
      const lapTimeSecs      = parseLapTime(document.getElementById('lap-time').value);
      const raceDurationMins = parseFloat(document.getElementById('race-duration').value);

      const errorEl = document.getElementById('error-msg');
      const err = validate(fuelPerLap, tankCapacity, lapTimeSecs, raceDurationMins);
      if (err) {
        errorEl.textContent = err;
        errorEl.style.display = '';
        document.getElementById('results-card').style.display = 'none';
        return;
      }
      errorEl.style.display = 'none';

      const result = calculate(fuelPerLap, tankCapacity, lapTimeSecs, raceDurationMins, stops);
      renderResults(result);
    });

    // Starting fuel adjustment
    document.getElementById('sf-minus').addEventListener('click', () => adjust(-0.5, 0));
    document.getElementById('sf-plus').addEventListener('click',  () => adjust(+0.5, 0));

    // Restriction % adjustment
    document.getElementById('rp-minus').addEventListener('click', () => adjust(0, -1));
    document.getElementById('rp-plus').addEventListener('click',  () => adjust(0, +1));
  }

  init();

})();
