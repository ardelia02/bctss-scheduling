/* ================================================================
   12. CLASSROOMS RENDER
   ================================================================ */
const renderClassrooms = () => {
  const grid = document.getElementById('classroomsGrid');
  const searchDate = (() => { const el = document.getElementById('classroomSearchDate'); return el ? el.value : ''; })()
  
  if (searchDate) {
    document.getElementById('classroomSearchClearBtn').style.display = 'inline-block';
  } else {
    const clearBtn = document.getElementById('classroomSearchClearBtn');
    if (clearBtn) clearBtn.style.display = 'none';
  }
  
  grid.innerHTML = AppState.classrooms.map(c => {
    let statusHtml = '';
    
    if (searchDate) {
      // Find events in this classroom on this date
      const dayEvs = AppState.events.filter(ev => 
        (ev.classroomIds || []).includes(c.id) && 
        ev.date === searchDate &&
        ev.status !== 'cancelled'
      ).sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      if (dayEvs.length === 0) {
        statusHtml = `<div style="margin-top:12px; font-size:12px; color:var(--success); font-weight:500;">✅ Available all day</div>`;
      } else {
        const times = dayEvs.map(ev => `${fmtTime(ev.startTime)}–${fmtTime(ev.endTime)}`).join(', ');
        statusHtml = `<div style="margin-top:12px; font-size:12px; color:var(--danger); font-weight:500;">❌ Occupied: ${times}</div>`;
      }
    } else {
      // Default: Count upcoming events
      const upcomingEvs = AppState.events.filter(ev => 
        (ev.classroomIds || []).includes(c.id) && safeDate(ev.date) >= new Date(todayStr()) && ev.status !== 'cancelled'
      ).length;
      statusHtml = `<div style="margin-top:12px; font-size:12px; color:var(--brand-600); font-weight:500;">📅 ${upcomingEvs} upcoming lesson(s) — Click to view schedule</div>`;
    }

    return `
      <div class="classroom-card clickable" tabindex="0" role="button" data-crid="${c.id}" style="cursor:pointer; transition:transform 0.2s, box-shadow 0.2s;">
        <div class="classroom-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <div class="classroom-info" style="width: 100%; min-width: 0;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div class="classroom-name">${escapeHTML(c.name)}</div>
              <div class="classroom-meta">${c.type || 'Classroom'} • ${c.pax || c.capacity || 0} pax</div>
            </div>
            <button class="btn btn-ghost btn-sm edit-classroom-btn" data-crid="${c.id}" style="padding:2px 6px; font-size:10px;">Edit</button>
          </div>
          ${statusHtml}
        </div>
      </div>`;
  }).join('');
};

/** Generic Week Calendar Grid Renderer */
const renderReusableWeekGrid = (containerId, anchor, events, onEmptyClick = null, numDays = 7) => {
  const HOUR_H    = 64;
  const START_H   = 7;
  const END_H     = 21;
  const N_HOURS   = END_H - START_H;
  const TOTAL_H   = N_HOURS * HOUR_H;
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const weekStart = safeDate(anchor);
  if (numDays === 7) {
    const dayOfWeek = anchor.getDay();
    weekStart.setDate(anchor.getDate() - dayOfWeek);
  }
  const weekDates = Array.from({ length: numDays }, (_, i) => {
    const d = safeDate(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const todayISO  = todayStr();
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'wk-wrap';
  wrap.style.height = '100%';

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
  body.style.height = 'calc(100% - 64px)';

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

  const daysArea = document.createElement('div');
  daysArea.className = 'wk-days-area';

  weekDates.forEach(d => {
    const dateStr = dateToStr(d);
    const isToday = dateStr === todayISO;

    const col = document.createElement('div');
    col.className = `wk-day-col${isToday ? ' wk-today-col' : ''}`;
    col.dataset.date = dateStr;
    col.style.height = `${TOTAL_H}px`;

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
    const bottomLine = document.createElement('div');
    bottomLine.className = 'wk-hline';
    bottomLine.style.top = `${TOTAL_H}px`;
    col.appendChild(bottomLine);

    const dayEvents = events.filter(ev => ev.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const overlapCols = [];
    const evColMap    = new Map();
    dayEvents.forEach(ev => {
      const evS = timeToMin(ev.startTime);
      let placed = false;
      for (let ci = 0; ci < overlapCols.length; ci++) {
        const last = overlapCols[ci][overlapCols[ci].length - 1];
        if (timeToMin(last.endTime) <= evS) {
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
      let color      = batch.colorHex || (EVENT_COLORS[batch.colorIndex % EVENT_COLORS.length] || EVENT_COLORS[0] || "#cccccc");
      let textColor  = '#fff';
      
      if (ev.isUnavailability) {
        color = '#e5e7eb'; // var(--gray-200)
        textColor = '#4b5563'; // var(--gray-600)
      }
      
      const trainers   = getEventTrainersText(ev);
      const classrooms = (ev.classroomIds || []).map(id => getClassroom(id).name).join(', ');

      const evVisCol = evColMap.get(ev.id) || 0;
      const colW     = 100 / numVisualCols;
      const leftPct  = evVisCol * colW;

      const block = document.createElement('div');
      block.className   = `wk-event ${ev.status === 'cancelled' ? 'cancelled' : ''}`;
      block.dataset.evid = ev.id;
      block.title = `${escapeHTML(getEventDisplayName(ev, lesson))}\n${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}\n${trainers}`;
      block.style.cssText =
        `top:${top}px;height:${height}px;` +
        `left:calc(${leftPct}% + 3px);width:calc(${colW}% - 6px);` +
        `background:${color};color:${textColor};cursor:pointer;`;

      let inner = `<div class="wk-ev-name">${escapeHTML(getEventDisplayName(ev, lesson))}</div>`;
      if (height >= 36) inner += `<div class="wk-ev-time">${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}</div>`;
      if (height >= 56) inner += `<div class="wk-ev-meta">${classrooms} · ${trainers}</div>`;
      if (height >= 76) inner += `<div class="wk-ev-batch">${batchNames}</div>`;
      block.innerHTML = inner;

      block.addEventListener('click', (e) => {
        e.stopPropagation();
        showEventDetail(ev.id);
      });

      col.appendChild(block);
    });

    if (onEmptyClick) {
      col.addEventListener('click', (e) => {
        if (e.target.closest('[data-evid]')) return;
        const rect     = col.getBoundingClientRect();
        const relY     = e.clientY - rect.top + (body.scrollTop || 0);
        const rawMin   = Math.round(relY / HOUR_H * 60 / 30) * 30 + START_H * 60;
        const startStr = `${String(Math.floor(rawMin/60)).padStart(2,'0')}:${String(rawMin%60).padStart(2,'0')}`;
        const endStr   = `${String(Math.floor(rawMin/60)+1).padStart(2,'0')}:${String(rawMin%60).padStart(2,'0')}`;
        onEmptyClick(dateStr, startStr, endStr);
      });
    }

    if (isToday) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (nowMin >= START_H * 60 && nowMin <= END_H * 60) {
        const nowTop = (nowMin - START_H * 60) / 60 * HOUR_H;
        const nowLine = document.createElement('div');
        nowLine.className = 'wk-now-line';
        nowLine.style.top = `${nowTop}px`;
        col.appendChild(nowLine);
      }
    }

    daysArea.appendChild(col);
  });

  body.appendChild(daysArea);
  wrap.appendChild(body);
  container.appendChild(wrap);

  setTimeout(() => { if (body) body.scrollTop = (8 - START_H) * HOUR_H - 16; }, 30);
};


const showClassroomSchedule = (crid) => {
  const c = getClassroom(crid);
  if (!c) return;

  AppState.currentModalClassroomId = crid;
  
  let anchor = AppState.calendarDate || new Date();
  if (isNaN(anchor.getTime())) anchor = new Date();
  
  const from = safeDate(anchor);
  const dayOfWeek = from.getDay();
  from.setDate(from.getDate() - dayOfWeek);
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  
  const fromStr = from.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
  const toStr   = to.toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' });

  document.getElementById('classroomModalTitle').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; width: 100%;">
      <span>Schedule: ${escapeHTML(c.name)}</span>
      <div style="display:flex; align-items:center; gap: 8px; font-size:14px; font-weight:500;">
        <button class="btn btn-ghost btn-sm" aria-label="Action" onclick="navClassroomModalCalendar(-1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span>${fromStr} – ${toStr}</span>
        <button class="btn btn-ghost btn-sm" aria-label="Action" onclick="navClassroomModalCalendar(+1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  `;
  
  const events = AppState.events.filter(e => (e.classroomIds || []).includes(crid));
  window.renderReusableWeekGrid('classroomModalCalendar', anchor, events, (dateStr, startStr, endStr) => {
    window.closeModal('classroomScheduleModal');
    window.switchView('schedule');
    setTimeout(() => {
      const formDate = document.getElementById('formDate');
      if (formDate) {
        formDate.value = dateStr;
        document.getElementById('formStartTime').value = startStr;
        document.getElementById('formEndTime').value = endStr;
        const cb = document.querySelector(`input[name="classroomIds"][value="${crid}"]`);
        if (cb) cb.checked = true;
        checkAvailability();
      }
    }, 50);
  });
  window.openModal('classroomScheduleModal');
};

window.navClassroomModalCalendar = (dir) => {
  if (!AppState.currentModalClassroomId) return;
  let anchor = AppState.calendarDate || new Date();
  if (isNaN(anchor.getTime())) anchor = new Date();
  const d = safeDate(anchor);
  d.setDate(d.getDate() + dir * 7);
  AppState.calendarDate = d;
  showClassroomSchedule(AppState.currentModalClassroomId);
  
  // Keep the main calendar in sync visually
  if (AppState.activeView === 'calendar') {
    window.renderCalendar();
  }
};

window.renderClassrooms = renderClassrooms;

window.showClassroomSchedule = showClassroomSchedule;
window.renderReusableWeekGrid = renderReusableWeekGrid;
