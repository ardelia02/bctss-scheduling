/* ================================================================
   19. TOAST NOTIFICATIONS
   ================================================================ */
const showToast = (message, type = 'info') => {
  const container = document.getElementById('toastContainer');
  const icons = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
};



// --- Auto-generated globals for Vite migration ---
window.showToast = showToast;
