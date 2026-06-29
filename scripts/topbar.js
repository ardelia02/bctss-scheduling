/* ================================================================
   22. TOPBAR DATE DISPLAY
   ================================================================ */
const updateTopbarDate = () => {
  const el = document.getElementById('topbarDate');
  el.textContent = new Date().toLocaleDateString('en-SG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

