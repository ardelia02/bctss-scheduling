/**
 * API Compatibility Layer
 * Now that we use a single-document Firebase sync in state.js, 
 * these methods just modify AppState and call window.saveState()
 */
export const API = {
  createEvent: async (ev) => {
    return new Promise(resolve => {
      ev.id = 'ev_' + Date.now() + Math.random().toString(36).substr(2,5);
      window.AppState.events.push(ev);
      window.saveState();
      resolve(ev);
    });
  },

  updateEvent: async (eventId, updates) => {
    return new Promise(resolve => {
      const idx = window.AppState.events.findIndex(e => e.id === eventId);
      if (idx !== -1) {
        window.AppState.events[idx] = { ...window.AppState.events[idx], ...updates };
        window.saveState();
        resolve(window.AppState.events[idx]);
      } else {
        resolve(null);
      }
    });
  },

  deleteEvent: async (eventId) => {
    return new Promise(resolve => {
      window.AppState.events = window.AppState.events.filter(e => e.id !== eventId);
      window.saveState();
      resolve(true);
    });
  },

  createUnavailability: async (uv) => {
    return new Promise(resolve => {
      uv.id = 'unav_' + Date.now() + Math.random().toString(36).substr(2,5);
      window.AppState.unavailabilities.push(uv);
      window.saveState();
      resolve(uv);
    });
  },

  deleteUnavailability: async (id) => {
    return new Promise(resolve => {
      window.AppState.unavailabilities = window.AppState.unavailabilities.filter(u => u.id !== id);
      window.saveState();
      resolve(true);
    });
  }
};

window.API = API;
