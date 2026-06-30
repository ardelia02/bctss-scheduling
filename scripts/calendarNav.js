/* ================================================================
   20. CALENDAR NAVIGATION
   ================================================================ */
const navigateCalendar = (direction) => {
  const d = safeDate(AppState.calendarDate);
  if (AppState.calendarView === 'month') {
    d.setMonth(d.getMonth() + direction);
  } else if (AppState.calendarView === 'week') {
    d.setDate(d.getDate() + direction * 7);
  } else {
    d.setDate(d.getDate() + direction);
  }
  AppState.calendarDate = d;
  window.renderCalendar();
};

