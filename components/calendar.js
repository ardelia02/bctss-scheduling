/* ================================================================
   8. CALENDAR RENDER
   ================================================================ */
let isUpdatingFilter = false; // guard against re-entrant renderCalendar from batch filter

const renderCalendar = () => {
  try {
    let { calendarView, calendarDate } = AppState;
    if (isNaN(calendarDate.getTime())) {
      calendarDate = new Date();
      AppState.calendarDate = calendarDate;
    }
    const isMonth = calendarView === 'month';
    const isWeek  = calendarView === 'week';
    const isDay   = calendarView === 'day';

    // Populate batch filter dropdown, preserving current selection
    const batchSel = document.getElementById('calBatchFilter');
    if (batchSel) {
      isUpdatingFilter = true;
      const curVal = AppState.selectedBatch;
      batchSel.innerHTML = '<option value="all">All Batches</option>' +
        AppState.batches.filter(b => b.status === 'active' || b.status === 'upcoming')
          .map(b => `<option value="${b.id}">${escapeHTML(b.name)}</option>`).join('');
      batchSel.value = curVal;
      AppState.selectedBatch = batchSel.value;
      isUpdatingFilter = false;
    }

    document.getElementById('calendarMonthContainer').classList.toggle('hidden', !isMonth);
    document.getElementById('calendarWeekContainer').classList.toggle('hidden', !isWeek);
    document.getElementById('calendarDayContainer').classList.toggle('hidden', !isDay);

    if (isMonth) renderMonthCalendar(calendarDate);
    else if (isWeek) renderWeekCalendar(calendarDate);
    else window.renderDayCalendar(calendarDate);

    window.renderBatchSchedulePanel();
  } catch (err) {
    document.getElementById('mainContent').innerHTML = `<div style="padding:40px; color:red;"><h3>Calendar Render Error:</h3><pre>${escapeHTML(err.stack)}</pre></div>`;
  }
};

/** Month calendar */
const renderMonthCalendar = (anchor) => {
  const year  = anchor.getFullYear();
  const month = anchor.getMonth();

  // Update period label
  document.getElementById('calPeriodLabel').textContent =
    anchor.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });

  // Weekday headers
  const wdHeaders = document.getElementById('calWeekdayHeaders');
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  wdHeaders.innerHTML = days.map(d => `<div class="wday">${d}</div>`).join('');

  // Build day cells
  const firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
  const lastDate  = new Date(year, month + 1, 0).getDate();
  const prevLast  = new Date(year, month, 0).getDate();
  const todayISO  = todayStr();

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  // Previous month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevLast - i;
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    grid.appendChild(createDayCell(d, dateStr, true, todayISO));
  }

  // Current month
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    grid.appendChild(createDayCell(d, dateStr, false, todayISO));
  }

  // Next month head
  const totalCells = firstDay + lastDate;
  const remaining  = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = `${year}-${String(month+2).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    grid.appendChild(createDayCell(d, dateStr, true, todayISO));
  }
};

const createDayCell = (dayNum, dateStr, otherMonth, todayISO) => {
  const cell = document.createElement('div');
  cell.className = `cal-day${otherMonth ? ' other-month' : ''}${dateStr === todayISO ? ' today' : ''}`;
  cell.dataset.date = dateStr;

  cell.innerHTML = `<div class="cal-day-num">${dayNum}</div>`;

  // Events on this day (filtered by selected batch and active/upcoming status)
  const dayEvents = AppState.events
    .filter(e => {
      if (e.date !== dateStr) return false;
      if (AppState.selectedBatch !== 'all' && !(e.batchIds || []).includes(AppState.selectedBatch)) return false;
      return (e.batchIds || []).some(id => {
        const b = getBatch(id);
        return b && (b.status === 'active' || b.status === 'upcoming');
      });
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const maxShow = 3;
  dayEvents.slice(0, maxShow).forEach(ev => {
    const lesson  = getLesson(ev.lessonId);
    const batches = (ev.batchIds || []).map(id => getBatch(id)).filter(Boolean);
    const batch   = batches[0] || {};
    const color   = batch.colorHex || (EVENT_COLORS[batch.colorIndex % EVENT_COLORS.length] || EVENT_COLORS[0] || "#cccccc");
    const evEl    = document.createElement('div');
    evEl.className   = 'cal-event';
    evEl.setAttribute('tabindex', '0');
    evEl.setAttribute('role', 'button');
    evEl.dataset.evid = ev.id;
    evEl.style.background = color;
    
    const lessonName = getEventDisplayName(ev, lesson);
    evEl.title = `${escapeHTML(lessonName)} · ${fmtTime(ev.startTime)}–${fmtTime(ev.endTime)}`;

    evEl.innerHTML = `
      <div class="cal-event-title">${escapeHTML(lessonName)}</div>
      <div class="cal-event-time">${fmtTime(ev.startTime)}</div>
    `;
    cell.appendChild(evEl);
  });

  if (dayEvents.length > maxShow) {
    const more = document.createElement('div');
    more.className   = 'cal-more';
    more.textContent = `+${dayEvents.length - maxShow} more`;
    cell.appendChild(more);
  }

  return cell;
};

/**
 * Week calendar – full hourly time-grid view.
 * Events are absolutely positioned by their real start/end times.
 * Overlapping events are placed in side-by-side sub-columns.
 */

/**
 * Shared utility to build the time grid and render events for a given array of dates.
 * Used by both week and day calendar views.
 */
const buildTimeGridAndEvents = (datesArray, body, daysArea, todayISO, START_H, END_H, HOUR_H) => {
  const N_HOURS = END_H - START_H;
  const TOTAL_H = N_HOURS * HOUR_H;

  // Time gutter (left column – hour labels)
  const gutterCol = document.createElement('div');
  gutterCol.className = 'wk-gutter-col';
  for (let h = START_H; h <= END_H; h++) {
    const lbl = document.createElement('div');
    lbl.className = 'wk-hour-lbl';
    if (h < END_H) {
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12  = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      lbl.textContent = `${h12}:00 ${ampm}`;
    }
    gutterCol.appendChild(lbl);
  }
  body.appendChild(gutterCol);

  datesArray.forEach(d => {
    const dateStr = dateToStr(d);
    const isToday = dateStr === todayISO;

    const col = document.createElement('div');
    col.className = `wk-day-col${isToday ? ' wk-today-col' : ''}`;
    col.dataset.date = dateStr;
    col.style.height = `${TOTAL_H}px`;
    if (datesArray.length === 1) col.style.flex = '1';

    // Hour and half-hour grid lines
    for (let i = 0; i < N_HOURS; i++) {
      const hline = document.createElement('div');
      hline.className = 'wk-hline';
      hline.style.top = `${i * HOUR_H}px`;
      col.appendChild(hline);

      const hfline = document.createElement('div');
      hfline.className = 'wk-hfline';
      hfline.style.top = `${i * HOUR_H + HOUR_H / 2}px`;
      col.appendChild(hfline);
    }
    // Final bottom line
    const bottomLine = document.createElement('div');
    bottomLine.className = 'wk-hline';
    bottomLine.style.top = `${TOTAL_H}px`;
    col.appendChild(bottomLine);

    // Events for this day (filtered by batch)
    const batchFilter = AppState.selectedBatch;
    const dayEvents = AppState.events
      .filter(ev => {
        if (ev.date !== dateStr) return false;
        if (batchFilter !== 'all' && !(ev.batchIds || []).includes(batchFilter)) return false;
        return (ev.batchIds || []).some(id => {
          const b = getBatch(id);
          return b && (b.status === 'active' || b.status === 'upcoming');
        });
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Overlap detection – assign visual sub-columns
    const overlapCols = [];
    const evColMap    = new Map();
    dayEvents.forEach(ev => {
      const eventStartMin = timeToMin(ev.startTime);
      let placed = false;
      for (let ci = 0; ci < overlapCols.length; ci++) {
        const last = overlapCols[ci][overlapCols[ci].length - 1];
        if (timeToMin(last.endTime) <= eventStartMin) {
          overlapCols[ci].push(ev);
          evColMap.set(ev.id, ci);
          placed = true;
          break;
        }
      }
      if (!placed) {
        evColMap.set(ev.id, overlapCols.length);
        overlapCols.push([ev]);
      }
    });
    const numVisualCols = Math.max(overlapCols.length, 1);

    // Render event blocks
    dayEvents.forEach(ev => {
      const startMin = timeToMin(ev.startTime);
      const endMin   = timeToMin(ev.endTime);
      if (startMin >= END_H * 60 || endMin <= START_H * 60) return;

      const top    = Math.max(0, (startMin - START_H * 60) / 60 * HOUR_H);
      const height = Math.max((endMin - startMin) / 60 * HOUR_H - 3, 18);

      const lesson     = getLesson(ev.lessonId);
      const batches    = (ev.batchIds || []).map(id => getBatch(id)).filter(Boolean);
      const batch      = batches[0] || {};
      const batchNames = batches.map(b => b.name).join(', ');
      const color      = batch.colorHex || (EVENT_COLORS[batch.colorIndex % EVENT_COLORS.length] || EVENT_COLORS[0] || "#cccccc");
      const classrooms = (ev.classroomIds || []).map(id => getClassroom(id).name).join(', ');
      const trainers   = getEventTrainersText(ev);

      const evVisCol = evColMap.get(ev.id) || 0;
      const colW     = 100 / numVisualCols;
      const leftPct  = evVisCol * colW;

      const block = document.createElement('div');
      block.className   = `wk-event ${ev.status === 'cancelled' ? 'cancelled' : ''}`;
      block.setAttribute('tabindex', '0');
      block.setAttribute('role', 'button');
      block.dataset.evid = ev.id;
      block.draggable   = true;
      const eventName = getEventDisplayName(ev, lesson);
      block.title = `${escapeHTML(eventName)}\n${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}\n${classrooms} · ${trainers}`;
      block.style.cssText =
        `top:${top}px;height:${height}px;` +
        `left:calc(${leftPct}% + 3px);width:calc(${colW}% - 6px);` +
        `background:${color};`;

      let inner = `<div class="wk-ev-name">${escapeHTML(eventName)}</div>`;
      if (height >= 36) inner += `<div class="wk-ev-time">${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}</div>`;
      if (height >= 56) inner += `<div class="wk-ev-meta">${classrooms} · ${trainers}</div>`;
      if (height >= 76) inner += `<div class="wk-ev-batch">${batchNames}</div>`;
      block.innerHTML = inner;

      col.appendChild(block);
    });

    // Click empty area → pre-fill schedule form at that time
    col.addEventListener('click', (e) => {
      if (e.target.closest('[data-evid]')) return;
      const rect     = col.getBoundingClientRect();
      const relY     = e.clientY - rect.top + (body ? body.scrollTop : 0);
      const rawMin   = Math.round(relY / HOUR_H * 60 / 30) * 30 + START_H * 60;
      const startStr = `${String(Math.floor(rawMin/60)).padStart(2,'0')}:${String(rawMin%60).padStart(2,'0')}`;
      const endStr   = `${String(Math.floor(rawMin/60)+1).padStart(2,'0')}:${String(rawMin%60).padStart(2,'0')}`;
      fillScheduleForm(dateStr, startStr, endStr);
    });

    daysArea.appendChild(col);
  });

  // Current-time indicator (red line + dot on today's column)
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMin - START_H * 60) / 60 * HOUR_H;
  if (nowTop >= 0 && nowTop <= TOTAL_H) {
    const todayColIdx = datesArray.findIndex(d => dateToStr(d) === todayISO);
    if (todayColIdx >= 0 && daysArea.children[todayColIdx]) {
      const nowLine = document.createElement('div');
      nowLine.className = 'wk-now-line';
      nowLine.style.top = `${nowTop}px`;
      daysArea.children[todayColIdx].appendChild(nowLine);
    }
  }
};

const renderWeekCalendar = (anchor) => {
  const HOUR_H    = 64;   // px per hour
  const START_H   = 7;    // 7 AM
  const END_H     = 21;   // 9 PM
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Week starts on Sunday
  const dayOfWeek = anchor.getDay();
  const weekStart = safeDate(anchor);
  weekStart.setDate(anchor.getDate() - dayOfWeek);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = safeDate(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // Update period label
  const from = weekDates[0].toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
  const to   = weekDates[6].toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('calPeriodLabel').textContent = `${from} – ${to}`;

  const todayISO  = todayStr();
  const container = document.getElementById('weekView');
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'wk-wrap';

  const hdr = document.createElement('div');
  hdr.className = 'wk-header';

  const gutterHdr = document.createElement('div');
  gutterHdr.className = 'wk-gutter-hdr';
  gutterHdr.textContent = 'GMT+8';
  hdr.appendChild(gutterHdr);

  weekDates.forEach(d => {
    const isToday = dateToStr(d) === todayISO;
    const cell = document.createElement('div');
    cell.className = `wk-day-hdr${isToday ? ' wk-today-hdr' : ''}`;
    cell.innerHTML = `
      <span class="wk-dname">${DAY_NAMES[d.getDay()]}</span>
      <span class="wk-dnum${isToday ? ' wk-dnum-today' : ''}">${d.getDate()}</span>`;
    hdr.appendChild(cell);
  });
  wrap.appendChild(hdr);

  const body = document.createElement('div');
  body.className = 'wk-body';
  body.id = 'wkBody';

  const daysArea = document.createElement('div');
  daysArea.className = 'wk-days-area';

  buildTimeGridAndEvents(weekDates, body, daysArea, todayISO, START_H, END_H, HOUR_H);
  body.appendChild(daysArea);
  
  wrap.appendChild(body);
  container.appendChild(wrap);

  // Auto-scroll to 8 AM (null-checked)
  setTimeout(() => { if (body) body.scrollTop = (8 - START_H) * HOUR_H - 16; }, 30);
};

const renderDayCalendar = (anchor) => {
  const HOUR_H    = 64;
  const START_H   = 7;
  const END_H     = 21;
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Update period label
  const from = anchor.toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('calPeriodLabel').textContent = from;

  const todayISO  = todayStr();
  const container = document.getElementById('dayView');
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'wk-wrap';

  const hdr = document.createElement('div');
  hdr.className = 'wk-header';
  const gutterHdr = document.createElement('div');
  gutterHdr.className = 'wk-gutter-hdr';
  gutterHdr.textContent = 'GMT+8';
  hdr.appendChild(gutterHdr);

  const isToday = dateToStr(anchor) === todayISO;
  const cell = document.createElement('div');
  cell.className = `wk-day-hdr${isToday ? ' wk-today-hdr' : ''}`;
  cell.innerHTML = `
    <span class="wk-dname">${DAY_NAMES[anchor.getDay()]}</span>
    <span class="wk-dnum${isToday ? ' wk-dnum-today' : ''}">${anchor.getDate()}</span>`;
  hdr.appendChild(cell);
  wrap.appendChild(hdr);

  const body = document.createElement('div');
  body.className = 'wk-body';
  body.id = 'dayBody';

  const daysArea = document.createElement('div');
  daysArea.className = 'wk-days-area';

  buildTimeGridAndEvents([anchor], body, daysArea, todayISO, START_H, END_H, HOUR_H);
  body.appendChild(daysArea);
  
  wrap.appendChild(body);
  container.appendChild(wrap);

  // Auto-scroll to 8 AM (null-checked)
  setTimeout(() => { if (body) body.scrollTop = (8 - START_H) * HOUR_H - 16; }, 30);
};
