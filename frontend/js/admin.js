/**
 * Zenith '26 - Admin Coordinator Dashboard
 * Real-time stats, category breakdown, utilization-sorted events table, and registration roster.
 */

const API_BASE = '/api';

// Cached events for filtering registrations
let allEvents = [];

// DOM Elements
const statTotalEvents = document.getElementById('stat-total-events');
const statTotalRegistrations = document.getElementById('stat-total-registrations');
const statOverallUtilization = document.getElementById('stat-overall-utilization');
const statUpcomingEvents = document.getElementById('stat-upcoming-events');
const categoryDistribution = document.getElementById('category-distribution');
const eventsTableBody = document.getElementById('events-table-body');
const registrationsTableBody = document.getElementById('registrations-table-body');
const tableEventCount = document.getElementById('table-event-count');
const filterRegEvent = document.getElementById('filter-reg-event');
const adminStatus = document.getElementById('admin-status');
const refreshBtn = document.getElementById('refresh-btn');

// Tab toggles
const tabEventsBtn = document.getElementById('tab-events-btn');
const tabRegistrationsBtn = document.getElementById('tab-registrations-btn');
const tabEventsContent = document.getElementById('tab-events-content');
const tabRegistrationsContent = document.getElementById('tab-registrations-content');

// Stretch Goal Modal Elements
const openAddEventBtn = document.getElementById('open-add-event-btn');
const closeAddEventBtn = document.getElementById('close-add-event-btn');
const addEventModal = document.getElementById('add-event-modal');
const addEventForm = document.getElementById('add-event-form');
const addEventAlert = document.getElementById('add-event-alert');

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  setupEventListeners();
});

function setupEventListeners() {
  refreshBtn.addEventListener('click', loadDashboardData);

  // Tab switching
  tabEventsBtn.addEventListener('click', () => {
    tabEventsBtn.className = 'px-4 py-2 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 transition';
    tabRegistrationsBtn.className = 'px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 border-b-2 border-transparent transition';
    tabEventsContent.classList.remove('hidden');
    tabRegistrationsContent.classList.add('hidden');
  });

  tabRegistrationsBtn.addEventListener('click', () => {
    tabRegistrationsBtn.className = 'px-4 py-2 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 transition';
    tabEventsBtn.className = 'px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 border-b-2 border-transparent transition';
    tabRegistrationsContent.classList.remove('hidden');
    tabEventsContent.classList.add('hidden');
    loadRegistrations();
  });

  // Dropdown filter for registrations
  filterRegEvent.addEventListener('change', (e) => {
    loadRegistrations(e.target.value);
  });

  // Add event modal triggers
  openAddEventBtn.addEventListener('click', () => {
    addEventForm.reset();
    addEventAlert.classList.add('hidden');
    addEventModal.classList.remove('hidden');
  });

  closeAddEventBtn.addEventListener('click', () => {
    addEventModal.classList.add('hidden');
  });

  addEventModal.addEventListener('click', (e) => {
    if (e.target === addEventModal) addEventModal.classList.add('hidden');
  });

  addEventForm.addEventListener('submit', handleCreateEvent);
}

/**
 * Loads both stats and events in parallel
 */
async function loadDashboardData() {
  hideStatus();
  try {
    await Promise.all([loadStats(), loadEvents()]);
    if (!tabRegistrationsContent.classList.contains('hidden')) {
      await loadRegistrations(filterRegEvent.value);
    }
  } catch (err) {
    showStatusError(`Failed to load dashboard metrics: ${err.message}. Is backend running on http://localhost:8000?`);
  }
}

/**
 * Fetch and render GET /api/stats
 */
async function loadStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Could not fetch stats');
  const data = await res.json();

  statTotalEvents.textContent = data.total_events;
  statTotalRegistrations.textContent = data.total_registrations;
  statOverallUtilization.textContent = `${data.overall_utilization_pct}%`;
  statUpcomingEvents.textContent = data.upcoming_events_count;

  // Render Category Breakdown (Step 8.2)
  categoryDistribution.innerHTML = '';
  const categories = Object.entries(data.events_by_category || {});

  if (categories.length === 0) {
    categoryDistribution.innerHTML = `<span class="text-xs text-slate-400">No category data</span>`;
  } else {
    categories.forEach(([cat, count]) => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between';
      card.innerHTML = `
        <span class="text-xs font-semibold text-slate-500">${cat}</span>
        <div class="flex items-baseline justify-between mt-1">
          <span class="text-lg font-bold text-slate-800">${count}</span>
          <span class="text-[10px] text-slate-400 uppercase">events</span>
        </div>
      `;
      categoryDistribution.appendChild(card);
    });
  }
}

/**
 * Fetch and render GET /api/events sorted descending by utilization %
 */
async function loadEvents() {
  eventsTableBody.innerHTML = `
    <tr><td colspan="7" class="py-6 text-center text-xs text-slate-400">Loading events table...</td></tr>
  `;

  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error('Could not fetch events');
  const events = await res.json();
  allEvents = events;

  // Update Event Filter Dropdown
  const currentSelected = filterRegEvent.value;
  filterRegEvent.innerHTML = `<option value="">All Events (${events.length})</option>`;
  events.forEach((ev) => {
    const opt = document.createElement('option');
    opt.value = ev.id;
    opt.textContent = `${ev.title} (#${ev.id})`;
    if (String(ev.id) === String(currentSelected)) opt.selected = true;
    filterRegEvent.appendChild(opt);
  });

  tableEventCount.textContent = `${events.length} Events`;

  // Compute registered count and utilization % for sorting
  const enriched = events.map((ev) => {
    const registered = ev.capacity - ev.available_seats;
    const utilPct = ev.capacity > 0 ? (registered / ev.capacity) * 100 : 0;
    return { ...ev, registered, utilPct };
  });

  // Step 8.3: Sort by utilization percentage descending
  enriched.sort((a, b) => b.utilPct - a.utilPct);

  eventsTableBody.innerHTML = '';
  if (enriched.length === 0) {
    eventsTableBody.innerHTML = `
      <tr><td colspan="7" class="py-8 text-center text-xs text-slate-400">No events found in database.</td></tr>
    `;
    return;
  }

  enriched.forEach((ev) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/80 transition';

    // Step 8.4: Highlight over 90% in warning color
    const isCritical = ev.utilPct >= 90;
    const isHigh = ev.utilPct >= 75 && ev.utilPct < 90;

    let badgeClass = 'bg-slate-100 text-slate-600';
    if (isCritical) {
      badgeClass = 'bg-rose-100 text-rose-800 font-bold border border-rose-200 animate-pulse';
    } else if (isHigh) {
      badgeClass = 'bg-amber-100 text-amber-800 font-semibold border border-amber-200';
    }

    tr.innerHTML = `
      <td class="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
        <span>${ev.icon || '⚡'}</span>
        <span>${ev.title}</span>
      </td>
      <td class="py-3 px-4">
        <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">${ev.category}</span>
      </td>
      <td class="py-3 px-4 text-xs">${ev.event_date} <br><span class="text-slate-400">${ev.event_time}</span></td>
      <td class="py-3 px-4 text-xs font-medium text-slate-700">${ev.venue}</td>
      <td class="py-3 px-4 text-xs font-mono font-medium">${ev.registered} / ${ev.capacity}</td>
      <td class="py-3 px-4">
        <span class="text-xs px-2.5 py-1 rounded-md ${badgeClass}">
          ${ev.utilPct.toFixed(1)}% ${isCritical ? '⚠️ Warning' : ''}
        </span>
      </td>
      <td class="py-3 px-4 text-xs text-right font-medium">${ev.fee === 0 ? '<span class="text-emerald-600">Free</span>' : `₹${ev.fee}`}</td>
    `;
    eventsTableBody.appendChild(tr);
  });
}

/**
 * Fetch and render GET /api/registrations (Step 8.5)
 */
async function loadRegistrations(eventIdFilter = '') {
  registrationsTableBody.innerHTML = `
    <tr><td colspan="8" class="py-6 text-center text-xs text-slate-400">Loading registrations...</td></tr>
  `;

  try {
    const url = eventIdFilter 
      ? `${API_BASE}/registrations?event_id=${eventIdFilter}` 
      : `${API_BASE}/registrations`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Could not fetch registrations');
    const list = await res.json();

    registrationsTableBody.innerHTML = '';
    if (list.length === 0) {
      registrationsTableBody.innerHTML = `
        <tr><td colspan="8" class="py-8 text-center text-xs text-slate-400">No student registrations found for this selection.</td></tr>
      `;
      return;
    }

    list.forEach((r) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/80 transition';
      tr.innerHTML = `
        <td class="py-3 px-4 font-mono text-xs text-slate-400">#${r.id}</td>
        <td class="py-3 px-4 font-semibold text-slate-800">${r.student_name}</td>
        <td class="py-3 px-4 font-mono text-xs text-indigo-700 font-medium">${r.roll_number}</td>
        <td class="py-3 px-4 text-xs">${r.email}</td>
        <td class="py-3 px-4 text-xs text-slate-500">${r.phone || '—'}</td>
        <td class="py-3 px-4 text-xs font-medium text-slate-700">${r.event_title}</td>
        <td class="py-3 px-4 text-[11px] text-slate-400 font-mono">${new Date(r.registered_at).toLocaleString()}</td>
        <td class="py-3 px-4 text-center">
          <button 
            onclick="handleCancelRegistration(${r.id}, '${r.student_name.replace(/'/g, "\\'")}')"
            class="text-[11px] px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium border border-rose-200 transition"
            title="Cancel Registration (Stretch Goal)"
          >
            Cancel
          </button>
        </td>
      `;
      registrationsTableBody.appendChild(tr);
    });
  } catch (err) {
    registrationsTableBody.innerHTML = `
      <tr><td colspan="8" class="py-6 text-center text-xs text-rose-500">Error: ${err.message}</td></tr>
    `;
  }
}

/**
 * Stretch Goal 1: Create a new event from admin modal
 */
async function handleCreateEvent(e) {
  e.preventDefault();
  addEventAlert.className = 'hidden';

  const title = document.getElementById('new-event-title').value.trim();
  const category = document.getElementById('new-event-category').value;
  const icon = document.getElementById('new-event-icon').value.trim() || '⚡';
  const event_date = document.getElementById('new-event-date').value.trim();
  const event_time = document.getElementById('new-event-time').value.trim();
  const venue = document.getElementById('new-event-venue').value.trim();
  const capacity = parseInt(document.getElementById('new-event-capacity').value, 10);
  const fee = parseInt(document.getElementById('new-event-fee').value, 10) || 0;
  const description = document.getElementById('new-event-desc').value.trim();

  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        icon,
        event_date,
        event_time,
        venue,
        capacity,
        fee,
        description
      })
    });

    const data = await res.json();
    if (res.status === 201) {
      addEventAlert.className = 'p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block';
      addEventAlert.textContent = `Event "${data.title}" added successfully!`;
      await loadDashboardData();
      setTimeout(() => {
        addEventModal.classList.add('hidden');
      }, 1200);
    } else {
      addEventAlert.className = 'p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 block';
      addEventAlert.textContent = data.detail || 'Could not create event';
    }
  } catch (err) {
    addEventAlert.className = 'p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 block';
    addEventAlert.textContent = err.message;
  }
}

/**
 * Stretch Goal 2: Cancel student registration
 */
window.handleCancelRegistration = async function(registrationId, studentName) {
  const confirmed = confirm(`Are you sure you want to cancel registration #${registrationId} for ${studentName}? This will immediately release their seat.`);
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/registrations/${registrationId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      await loadDashboardData();
    } else {
      const data = await res.json();
      alert(`Could not cancel registration: ${data.detail || res.statusText}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
};

function showStatusError(msg) {
  adminStatus.className = 'p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold block';
  adminStatus.textContent = msg;
}

function hideStatus() {
  adminStatus.className = 'hidden';
}
