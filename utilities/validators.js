/* ================================================================
   5. CONFLICT DETECTION ENGINE
   ================================================================ */

const _timeCache = new Map();
const cachedTimeToMin = (t) => {
  if (!t) return 0;
  let val = _timeCache.get(t);
  if (val === undefined) {
    val = window.timeToMin(t);
    _timeCache.set(t, val);
  }
  return val;
};

/**
 * Check if two time intervals overlap.
 * Uses minutes representation; boundaries are exclusive (back-to-back is ok).
 */
const timesOverlap = (s1, e1, s2, e2) => s1 < e2 && e1 > s2;

/**
 * Find all conflicts for a proposed event.
 * Optionally pass excludeId to skip checking against an existing event (for edits).
 *
 * @param {string} date
 * @param {string} startTime  "HH:MM"
 * @param {string} endTime    "HH:MM"
 * @param {string[]} classroomIds
 * @param {string[]} trainerIds
 * @param {string|null} excludeId
 * @returns {{ classroomConflicts: Event[], trainerConflicts: {trainer, event}[] }}
 */
const detectConflicts = (date, startTime, endTime, classroomIds, trainerIds, batchIds = [], excludeId = null) => {
  const targetStartMin = cachedTimeToMin(startTime);
  const targetEndMin = cachedTimeToMin(endTime);

  const classroomConflicts = [];
  const trainerConflicts   = [];
  const batchConflicts     = [];

  for (const ev of AppState.events) {
    if (ev.id === excludeId) continue;
    if (ev.date !== date) continue;

    const eventStartMin = cachedTimeToMin(ev.startTime);
    const eventEndMin = cachedTimeToMin(ev.endTime);

    if (!timesOverlap(targetStartMin, targetEndMin, eventStartMin, eventEndMin)) continue;

    // Classroom conflict
    if (classroomIds && classroomIds.length > 0) {
      if (ev.classroomIds && ev.classroomIds.some(c => classroomIds.includes(c))) {
        classroomConflicts.push(ev);
      }
    }

    // Trainer conflict(s)
    for (const tid of trainerIds) {
      if ((ev.trainerIds && ev.trainerIds.includes(tid)) || (ev.understudyIds || []).includes(tid)) {
        trainerConflicts.push({ trainerId: tid, event: ev });
      }
    }

    // Batch conflict
    if (batchIds && batchIds.length > 0) {
      if (ev.batchIds && ev.batchIds.some(b => batchIds.includes(b))) {
        batchConflicts.push(ev);
      }
    }
  }

  // Trainer Unavailability conflicts
  if (AppState.unavailabilities) {
    for (const u of AppState.unavailabilities) {
      if (u.date !== date) continue;
      const unavailStartMin = cachedTimeToMin(u.startTime);
      const unavailEndMin = cachedTimeToMin(u.endTime);
      if (!timesOverlap(targetStartMin, targetEndMin, unavailStartMin, unavailEndMin)) continue;

      for (const tid of trainerIds) {
        if (u.trainerId === tid && u.type === 'leave') {
          trainerConflicts.push({ trainerId: tid, unavailability: u });
        }
      }
    }
  }

  return { classroomConflicts, trainerConflicts, batchConflicts };
};

/**
 * Get availability status for ALL classrooms and trainers on a given date/time range.
 */
const getAvailability = (date, startTime, endTime, excludeId = null) => {
  const targetStartMin = cachedTimeToMin(startTime);
  const targetEndMin = cachedTimeToMin(endTime);

  const bookedClassrooms = new Set();
  const bookedTrainers   = new Set();
  const warningTrainers  = new Map();

  for (const ev of AppState.events) {
    if (ev.id === excludeId) continue;
    if (ev.date !== date) continue;

    const eventStartMin = cachedTimeToMin(ev.startTime);
    const eventEndMin = cachedTimeToMin(ev.endTime);

    if (!timesOverlap(targetStartMin, targetEndMin, eventStartMin, eventEndMin)) continue;

    if (ev.classroomIds) {
      ev.classroomIds.forEach(c => bookedClassrooms.add(c));
    }
    if (ev.trainerIds) {
      ev.trainerIds.forEach(tid => bookedTrainers.add(tid));
    }
    if (ev.understudyIds) {
      ev.understudyIds.forEach(tid => bookedTrainers.add(tid));
    }
  }

  if (AppState.unavailabilities) {
    for (const u of AppState.unavailabilities) {
      if (u.date !== date) continue;
      const unavailStartMin = cachedTimeToMin(u.startTime);
      const unavailEndMin = cachedTimeToMin(u.endTime);
      if (!timesOverlap(targetStartMin, targetEndMin, unavailStartMin, unavailEndMin)) continue;
      
      if (u.type === 'leave') {
        bookedTrainers.add(u.trainerId);
      } else {
        if (!bookedTrainers.has(u.trainerId)) {
          warningTrainers.set(u.trainerId, u);
        }
      }
    }
  }

  return {
    classrooms: AppState.classrooms.map(c => Object.assign({}, c, {
      available: !bookedClassrooms.has(c.id),
    })),
    trainers: AppState.trainers.map(t => Object.assign({}, t, {
      available: !bookedTrainers.has(t.id),
      warning: warningTrainers.get(t.id) || null
    })),
  };
};



// --- Auto-generated globals for Vite migration ---
window.detectConflicts = detectConflicts;
window.getAvailability = getAvailability;
window.timesOverlap = timesOverlap;
