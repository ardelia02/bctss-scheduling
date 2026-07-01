/* ================================================================
   18. MODAL HELPERS
   ================================================================ */
const openModal  = (id) => {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
};
const closeModal = (id) => {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
};



// --- Auto-generated globals for Vite migration ---
window.openModal = openModal;
window.closeModal = closeModal;
