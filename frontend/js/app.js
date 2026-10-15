/**
 * Zenith '26 - Student Event Portal
 * Hand-Drawn Sketchbook Theme
 * Content-first, warm earthy palette, authentic API query integration
 */

const API_BASE = '/api';

// Current filter states
let currentCategory = 'All';
let currentSearch = '';
let debounceTimer = null;

// Category colour lookup matching exact palette specifications
const CATEGORY_COLORS = {
  Technical: '#F2B84B', // mustard
  Cultural: '#F28B82',  // coral
  Sports: '#8DB580',    // sage
  Gaming: '#F08A3C',    // tangerine
  Workshop: '#D9A58F'   // clay
};

// DOM Elements
const eventsGrid = document.getElementById('events-grid');
const searchInput = document.getElementById('search-input');
const categoryButtons = document.querySelectorAll('.filter-btn');
const statusContainer = document.getElementById('status-container');

// Modal Elements
const eventModal = document.getElementById('event-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalEventId = document.getElementById('modal-event-id');
const modalEventIcon = document.getElementById('modal-event-icon');
const modalEventCategory = document.getElementById('modal-event-category');
const modalEventTitle = document.getElementById('modal-event-title');
const modalEventDateTime = document.getElementById('modal-event-datetime');
const modalEventVenue = document.getElementById('modal-event-venue');
const modalEventFee = document.getElementById('modal-event-fee');
const modalEventSeats = document.getElementById('modal-event-seats');
const modalEventDesc = document.getElementById('modal-event-description');
const registrationForm = document.getElementById('registration-form');
const modalAlert = document.getElementById('modal-alert');
const submitRegisterBtn = document.getElementById('submit-register-btn');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  fetchEvents();
  setupEventListeners();
});

function setupEventListeners() {
  // Search input with debounce (re-fetches GET /api/events with search param)
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = e.target.value.trim();
      fetchEvents();
    }, 280);
  });

  // Category filter buttons (re-fetches GET /api/events with category param)
  categoryButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach((b) => {
        b.classList.remove('bg-tomato', 'text-white');
        b.classList.add('bg-white', 'text-ink');
      });
      btn.classList.remove('bg-white', 'text-ink');
      btn.classList.add('bg-tomato', 'text-white');

      currentCategory = btn.dataset.category;
      fetchEvents();
    });
  });

  // Modal Close
  closeModalBtn.addEventListener('click', closeModal);
  eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) closeModal();
  });

  // Registration Form Submission
  registrationForm.addEventListener('submit', handleRegistration);
}

/**
 * Fetch events matching current query parameters from backend
 */
async function fetchEvents() {
  showLoading();

  try {
    const params = new URLSearchParams();
    if (currentCategory && currentCategory !== 'All') {
      params.append('category', currentCategory);
    }
    if (currentSearch) {
      params.append('search', currentSearch);
    }

    const url = `${API_BASE}/events${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load events (Status: ${response.status})`);
    }

    const events = await response.json();
    renderEvents(events);
  } catch (err) {
    showError(`Could not load events: ${err.message}. Make sure the backend server is running.`);
  }
}

/**
 * Date formatting helper: '2026-11-14' + '10:00 AM' -> 'Sat, 14 Nov · 10:00 AM'
 */
function formatEventDate(dateStr, timeStr) {
  if (!dateStr) return timeStr || '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = days[d.getDay()];
      const monthName = months[d.getMonth()];
      const formattedDate = `${dayName}, ${day} ${monthName}`;
      return timeStr ? `${formattedDate} · ${timeStr}` : formattedDate;
    }
  } catch (e) {
    // fallback
  }
  return timeStr ? `${dateStr} · ${timeStr}` : dateStr;
}

/**
 * Render cards into #events-grid
 */
function renderEvents(events) {
  eventsGrid.innerHTML = '';
  hideStatus();

  if (!events || events.length === 0) {
    showEmpty();
    return;
  }

  const tilts = ['card-tilt-left', 'card-tilt-flat', 'card-tilt-right'];

  events.forEach((event, index) => {
    const isFull = event.available_seats <= 0;
    const feeText = event.fee === 0 ? 'Free' : `₹${event.fee}`;
    const categoryBg = CATEGORY_COLORS[event.category] || '#D9A58F';
    const tiltClass = tilts[index % 3];
    const isTape = index % 2 === 0;

    // Progress bar math & color thresholds:
    // sage under 70%, mustard 70-90%, tomato over 90%
    const capacity = event.capacity || 100;
    const available = Math.max(0, event.available_seats);
    const booked = Math.max(0, capacity - available);
    const pct = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 100;
    
    let barColor = '#8DB580'; // sage (<70%)
    if (pct >= 90 || isFull) {
      barColor = '#E5533D'; // tomato (>90% or full)
    } else if (pct >= 70) {
      barColor = '#F2B84B'; // mustard (70-90%)
    }

    const formattedDate = formatEventDate(event.event_date, event.event_time);

    const card = document.createElement('div');
    card.className = `sketch-card p-5 flex flex-col justify-between ${tiltClass} ${isFull ? 'opacity-85 bg-[#fbf8f2]' : 'bg-white'}`;

    card.innerHTML = `
      ${isTape ? '<div class="card-tape"></div>' : '<div class="card-clip"></div>'}
      
      <!-- Category top band tint -->
      <div class="h-2.5 -mx-5 -mt-5 mb-3.5 rounded-t-[12px] border-b-2 border-ink" style="background-color: ${categoryBg};"></div>

      <div>
        <!-- Card Top Bar: Icon, Title & Category Badge -->
        <div class="flex items-start justify-between gap-2.5 mb-2.5">
          <div class="flex items-center gap-2.5">
            <span class="text-3xl p-1.5 rounded-lg border-2 border-ink bg-paper flex-shrink-0" aria-hidden="true">
              ${event.icon || '⚡'}
            </span>
            <div>
              <span 
                class="inline-block text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-ink text-ink font-sans"
                style="background-color: ${categoryBg};"
              >
                ${event.category}
              </span>
              <h3 class="font-brush text-2xl font-bold text-ink leading-snug line-clamp-1 mt-0.5" title="${event.title}">
                ${event.title}
              </h3>
            </div>
          </div>
          ${isFull 
            ? `<span class="px-2 py-0.5 rounded text-xs uppercase bg-tomato text-white font-bold border-2 border-ink font-sans shadow-sm flex-shrink-0">FULL</span>`
            : `<span class="px-2 py-0.5 rounded text-sm font-bold bg-white text-ink border-2 border-ink font-sans flex-shrink-0">${feeText}</span>`
          }
        </div>

        <!-- Description -->
        <p class="text-base text-ink/80 line-clamp-2 mb-3.5 leading-relaxed font-hand">
          ${event.description || 'Join this exciting college fest event! Register today.'}
        </p>

        <!-- Icon Chips (No grey box, one line each for calendar, pin, seats) -->
        <div class="space-y-1.5 mb-4 font-sans text-xs sm:text-sm text-ink">
          <!-- Date Chip -->
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-ink/40 bg-paper">
            <span class="text-base flex-shrink-0" aria-hidden="true">📅</span>
            <span class="font-semibold truncate">${formattedDate}</span>
          </div>

          <!-- Venue Chip -->
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-ink/40 bg-paper">
            <span class="text-base flex-shrink-0" aria-hidden="true">📍</span>
            <span class="font-semibold truncate">${event.venue}</span>
          </div>

          <!-- Seat Progress Bar Chip -->
          <div class="p-2 rounded-lg border border-ink/40 bg-paper">
            <div class="flex items-center justify-between text-xs font-bold mb-1">
              <span class="flex items-center gap-1.5">
                <span class="text-sm" aria-hidden="true">🎟️</span>
                <span class="text-ink/75 uppercase tracking-wide">Seats</span>
              </span>
              <span class="${isFull ? 'text-tomato font-bold' : 'text-ink font-semibold'}">
                ${isFull ? '0 left' : `${event.available_seats} left`}
              </span>
            </div>
            <div class="w-full h-2.5 bg-white border border-ink rounded-full overflow-hidden p-[1px]">
              <div class="h-full rounded-full transition-all duration-300" style="width: ${pct}%; background-color: ${barColor};"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <button 
        onclick="openEventDetails(${event.id})"
        class="sketch-btn w-full py-2 px-4 rounded-xl text-lg font-brush font-bold transition flex items-center justify-center gap-1.5 ${
          isFull
            ? 'bg-paper text-ink/70 hover:bg-white'
            : 'bg-tomato text-white hover:bg-[#d4432d]'
        }"
      >
        <span>${isFull ? 'View Details ✏️' : 'Register ✏️'}</span>
      </button>
    `;

    eventsGrid.appendChild(card);
  });
}

/**
 * Open detail & registration modal for an event
 */
window.openEventDetails = async function(eventId) {
  clearModalAlert();
  registrationForm.reset();
  hideInlineErrors();

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}`);
    if (!res.ok) throw new Error('Could not load event details');
    const event = await res.json();

    modalEventId.value = event.id;
    modalEventIcon.textContent = event.icon || '⚡';
    modalEventCategory.textContent = event.category;
    modalEventCategory.style.backgroundColor = CATEGORY_COLORS[event.category] || '#D9A58F';
    modalEventTitle.textContent = event.title;
    modalEventDateTime.textContent = formatEventDate(event.event_date, event.event_time);
    modalEventVenue.textContent = event.venue;
    modalEventFee.textContent = event.fee === 0 ? 'Free' : `₹${event.fee}`;
    
    if (event.available_seats <= 0) {
      modalEventSeats.innerHTML = `<span class="text-tomato font-bold">FULL (0 / ${event.capacity})</span>`;
      submitRegisterBtn.disabled = true;
      submitRegisterBtn.classList.add('opacity-50', 'cursor-not-allowed');
      submitRegisterBtn.innerHTML = '<span>Event is Full</span>';
    } else {
      modalEventSeats.innerHTML = `<span class="text-ink font-bold">${event.available_seats} / ${event.capacity} left</span>`;
      submitRegisterBtn.disabled = false;
      submitRegisterBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitRegisterBtn.innerHTML = '<span>Confirm Registration</span>';
    }

    modalEventDesc.textContent = event.description || 'No additional details provided.';
    eventModal.classList.remove('hidden');
  } catch (err) {
    alert(err.message);
  }
};

function closeModal() {
  eventModal.classList.add('hidden');
}

/**
 * Handle student registration submission
 */
async function handleRegistration(e) {
  e.preventDefault();
  clearModalAlert();
  hideInlineErrors();

  const eventId = modalEventId.value;
  const studentName = document.getElementById('reg-student-name').value.trim();
  const rollNumber = document.getElementById('reg-roll-number').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();

  // Basic client-side checks
  let hasError = false;
  if (!studentName) {
    document.getElementById('err-student-name').classList.remove('hidden');
    hasError = true;
  }
  if (!rollNumber) {
    document.getElementById('err-roll-number').classList.remove('hidden');
    hasError = true;
  }
  if (!email || !email.includes('@')) {
    document.getElementById('err-email').classList.remove('hidden');
    hasError = true;
  }

  if (hasError) return;

  // Submit to POST /api/events/{event_id}/register
  submitRegisterBtn.disabled = true;
  submitRegisterBtn.innerHTML = `<span>Registering...</span>`;

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name: studentName,
        roll_number: rollNumber,
        email: email,
        phone: phone || null
      })
    });

    const data = await res.json();

    if (res.status === 201) {
      showModalAlert(
        `Registered successfully for ${modalEventTitle.textContent}! Pass ID: #${data.id}`,
        'success'
      );
      registrationForm.reset();

      // Refresh event cards immediately
      await fetchEvents();

      // Close modal after a moment
      setTimeout(() => {
        closeModal();
      }, 1600);
    } else {
      const errorMsg = data.detail || 'Registration failed. Please check your details.';
      showModalAlert(errorMsg, 'error');
    }
  } catch (err) {
    showModalAlert(`Network error: ${err.message}`, 'error');
  } finally {
    submitRegisterBtn.disabled = false;
    submitRegisterBtn.innerHTML = '<span>Confirm Registration</span>';
  }
}

// Helpers for inline alerts and UI states
function showModalAlert(message, type) {
  modalAlert.textContent = message;
  modalAlert.classList.remove('hidden', 'bg-sage/30', 'text-ink', 'bg-tomato/20', 'text-tomato');

  if (type === 'success') {
    modalAlert.classList.add('bg-sage/30', 'text-ink');
  } else {
    modalAlert.classList.add('bg-tomato/20', 'text-tomato');
  }
}

function clearModalAlert() {
  modalAlert.classList.add('hidden');
  modalAlert.textContent = '';
}

function hideInlineErrors() {
  document.getElementById('err-student-name').classList.add('hidden');
  document.getElementById('err-roll-number').classList.add('hidden');
  document.getElementById('err-email').classList.add('hidden');
}

/**
 * Loading state with decorative character & sketch loading indicator
 */
function showLoading() {
  statusContainer.className = 'sketch-card p-8 text-center bg-white my-6 max-w-md mx-auto relative';
  statusContainer.innerHTML = `
    <div class="flex flex-col items-center justify-center">
      <img src="/assets/characters/character5.svg" alt="" class="w-24 h-24 object-contain mb-3 anim-hero-bob pointer-events-none" aria-hidden="true" />
      <h3 class="font-brush text-2xl font-bold text-ink mb-1">Sketching festival events...</h3>
      <p class="text-base text-ink/70 font-hand">Connecting to the live schedule</p>
    </div>
  `;
  statusContainer.classList.remove('hidden');
  eventsGrid.innerHTML = '';
}

/**
 * Empty state: Friendly character beside "No events match" + Clear button
 */
function showEmpty() {
  statusContainer.className = 'sketch-card p-6 sm:p-8 bg-white my-6 max-w-xl mx-auto';
  statusContainer.innerHTML = `
    <div class="flex flex-col sm:flex-row items-center gap-6 justify-center">
      <img src="/assets/characters/character6.svg" alt="" class="w-28 h-28 sm:w-32 sm:h-32 object-contain flex-shrink-0 pointer-events-none" aria-hidden="true" />
      <div class="text-center sm:text-left">
        <h3 class="font-brush text-2xl sm:text-3xl font-bold text-ink mb-1">No events match your search</h3>
        <p class="text-base text-ink/75 mb-4 font-hand">Try checking your spelling or selecting another category filter.</p>
        <button onclick="window.clearFilters()" class="sketch-btn px-4 py-1.5 bg-mustard hover:bg-[#e0a435] text-ink font-bold text-base">
          Clear Filters & Search
        </button>
      </div>
    </div>
  `;
  statusContainer.classList.remove('hidden');
  eventsGrid.innerHTML = '';
}

window.clearFilters = function() {
  currentCategory = 'All';
  currentSearch = '';
  searchInput.value = '';
  categoryButtons.forEach((b) => {
    b.classList.remove('bg-tomato', 'text-white');
    b.classList.add('bg-white', 'text-ink');
    if (b.dataset.category === 'All') {
      b.classList.remove('bg-white', 'text-ink');
      b.classList.add('bg-tomato', 'text-white');
    }
  });
  fetchEvents();
};

/**
 * Error state with retry button
 */
function showError(msg) {
  statusContainer.className = 'p-6 sketch-card bg-paper border-2 border-tomato text-center my-6';
  statusContainer.innerHTML = `
    <div class="text-3xl mb-1">⚠️</div>
    <h4 class="font-brush text-2xl font-bold text-tomato mb-1">Could not connect to fest database</h4>
    <p class="text-sm text-ink/80 mb-3">${msg}</p>
    <button onclick="fetchEvents()" class="sketch-btn px-4 py-1.5 bg-tomato text-white text-base font-bold">
      Try Again
    </button>
  `;
  statusContainer.classList.remove('hidden');
  eventsGrid.innerHTML = '';
}

function hideStatus() {
  statusContainer.classList.add('hidden');
}
