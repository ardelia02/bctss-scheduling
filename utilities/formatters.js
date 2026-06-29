/* ================================================================
   3. UTILITY HELPERS
   ================================================================ */

/** Generate a random short ID */
const uid = () => Math.random().toString(36).slice(2, 9);

/** Parse "HH:MM" → minutes from midnight */
const timeToMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Format minutes to "H:MM AM/PM" */
const minToDisplay = (m) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
};

/** Format "HH:MM" time string to display */
const fmtTime = (t) => minToDisplay(timeToMin(t));

/** Format date string "YYYY-MM-DD" to locale string */
const fmtDate = (d) => {
  if (!d) return 'TBD';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

/** Get today as "YYYY-MM-DD" */
const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};

const isCurrentMonth = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

/** Safe Date constructor to prevent timezone UTC rollovers on "YYYY-MM-DD" */
const safeDate = (d) => {
  if (!d) return new Date(0);
  if (d instanceof Date) return new Date(d);
  const s = String(d);
  return new Date(s.includes('T') ? s : s + 'T00:00:00');
};

/** XSS Protection: Escape HTML tags from user input */
const escapeHTML = (str) => {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>'"]/g, match => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[match];
  });
};

/** Hash a string (e.g. password) asynchronously using SHA-256 */
const hashPassword = (pwd) => {
  if (!pwd) return Promise.resolve('');
  const msgUint8 = new TextEncoder().encode(pwd);
  return crypto.subtle.digest('SHA-256', msgUint8).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
};

/** Safe Base64 Encoding for Unicode */
const encodeBase64 = (str) => btoa(unescape(encodeURIComponent(str)));
const decodeBase64 = (str) => decodeURIComponent(escape(atob(str)));

/** "YYYY-MM-DD" from a Date object */
const dateToStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/** Colour palette for events */
const EVENT_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e'];
const EVENT_COLORS_LIGHT = ['#e0e7ff','#ede9fe','#cffafe','#d1fae5','#fef3c7','#ffe4e6'];
const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b',
  '#7f1d1d', '#7c2d12', '#78350f', '#713f12', '#3f6212', '#14532d', '#064e3b', '#134e4a', '#164e63',
  '#0c4a6e', '#1e3a8a', '#312e81', '#4c1d95', '#581c87', '#701a75', '#831843', '#881337', '#0f172a'
];
let colorCounter = 0;
const nextColor = () => colorCounter++ % EVENT_COLORS.length;

const PUBLIC_HOLIDAYS = [
  '2026-01-01', // New Year's Day
  '2026-02-17', // Chinese New Year
  '2026-02-18', // Chinese New Year
  '2026-04-03', // Good Friday
  '2026-05-01', // Labour Day
  '2026-05-31', // Vesak Day
  '2026-08-09', // National Day
  '2026-10-31', // Deepavali
  '2026-12-25'  // Christmas Day
];

// --- Auto-generated globals for Vite migration ---
window.todayStr = todayStr;
window.isCurrentMonth = isCurrentMonth;
window.timeToMin = timeToMin;
window.hashPassword = hashPassword;
window.PRESET_COLORS = PRESET_COLORS;
window.EVENT_COLORS = EVENT_COLORS;
window.EVENT_COLORS_LIGHT = EVENT_COLORS_LIGHT;
window.fmtDate = fmtDate;
window.decodeBase64 = decodeBase64;
window.safeDate = safeDate;
window.minToDisplay = minToDisplay;
window.colorCounter = colorCounter;
window.nextColor = nextColor;
window.dateToStr = dateToStr;
window.PUBLIC_HOLIDAYS = PUBLIC_HOLIDAYS;
window.encodeBase64 = encodeBase64;
window.fmtTime = fmtTime;
window.uid = uid;
window.escapeHTML = escapeHTML;
