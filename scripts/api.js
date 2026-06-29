/**
 * Mock API Layer
 * 
 * This simulates a relational database backend. 
 * When a real backend (e.g., Node.js/PostgreSQL) is ready, 
 * swap these mock functions with `fetch()` calls.
 */

export const API = {
  // --- Queries ---
  
  /** Fetch all initial data needed to boot the app */
  getInitialState: async () => {
    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(window.AppState);
      }, 50);
    });
  },

  getEvents: async (filters = {}) => {
    // Later: fetch(`/api/events?date=${filters.date}`)
    return window.AppState.events;
  },

  // --- Mutations ---
  
  createEvent: async (eventData) => {
    // Later: fetch('/api/events', { method: 'POST', body: JSON.stringify(eventData) })
    return new Promise(resolve => {
      setTimeout(() => {
        eventData.id = 'ev_' + Date.now();
        window.AppState.events.push(eventData);
        window.saveState();
        resolve(eventData);
      }, 100);
    });
  },

  updateEvent: async (eventId, updates) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const idx = window.AppState.events.findIndex(e => e.id === eventId);
        if (idx !== -1) {
          window.AppState.events[idx] = { ...window.AppState.events[idx], ...updates };
          window.saveState();
          resolve(window.AppState.events[idx]);
        } else {
          resolve(null);
        }
      }, 100);
    });
  },

  deleteEvent: async (eventId) => {
    return new Promise(resolve => {
      setTimeout(() => {
        window.AppState.events = window.AppState.events.filter(e => e.id !== eventId);
        window.saveState();
        resolve(true);
      }, 100);
    });
  },

  createUnavailability: async (leaveData) => {
    return new Promise(resolve => {
      setTimeout(() => {
        leaveData.id = 'unav_' + Date.now();
        window.AppState.unavailabilities.push(leaveData);
        window.saveState();
        resolve(leaveData);
      }, 100);
    });
  },

  deleteUnavailability: async (id) => {
    return new Promise(resolve => {
      setTimeout(() => {
        window.AppState.unavailabilities = window.AppState.unavailabilities.filter(u => u.id !== id);
        window.saveState();
        resolve(true);
      }, 100);
    });
  }
};

window.API = API;
