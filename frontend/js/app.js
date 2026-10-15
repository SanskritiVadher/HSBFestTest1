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
 * Render cards into #events-grid
 */
function renderEvents(events) {
  eventsGrid.innerHTML = '';
  hideStatus();

  if (!events || events.length === 0) {
    showEmpty();
    return;
  }

  events.forEach((event) => {
    const isFull = event.available_seats <= 0;
    const feeText = event.fee === 0 ? 'Free' : `₹${event.fee}`;
    const categoryBg = CATEGORY_COLORS[event.category] || '#D9A58F';

    const card = document.createElement('div');
    card.className = `sketch-card p-5 flex flex-col justify-between ${isFull ? 'opacity-75 bg-[#fbf8f2]' : 'bg-white'}`;

    card.innerHTML = `
      <div>
        <!-- Card Top Bar: Icon, Title & Category Badge -->
        <div class="flex items-start justify-between gap-2.5 mb-3">
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
        <p class="text-base text-ink/80 line-clamp-2 mb-4 leading-relaxed font-hand">
          ${event.description || 'Join this exciting college fest event! Click details to read more.'}
        </p>

        <!-- Meta Details Box (Quick scan numbers in clear font) -->
        <div class="space-y-1.5 text-sm bg-paper p-3 rounded-xl border border-ink/40 mb-4 font-sans text-ink">
          <div class="flex items-center justify-between">
            <span class="text-ink/65 text-xs font-bold">DATE & TIME:</span>
            <span class="font-semibold">${event.event_date} · ${event.event_time}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-ink/65 text-xs font-bold">VENUE:</span>
            <span class="font-semibold truncate max-w-[170px]">${event.venue}</span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-ink/20">
            <span class="text-ink/65 text-xs font-bold">AVAILABLE SEATS:</span>
            <span class="font-bold ${isFull ? 'text-tomato' : 'text-ink'}">
              ${isFull ? '0 seats left' : `${event.available_seats} / ${event.capacity} seats left`}
            </span>
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
        <span>${isFull ? 'Event Full — View Info' : 'View Details & Register'}</span>
        <span class="text-sm">→</span>
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
    modalEventDateTime.textContent = `${event.event_date} · ${event.event_time}`;
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
 * Loading state: 6 skeleton cards in sketch style
 */
function showLoading() {
  statusContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
  statusContainer.innerHTML = Array(6).fill(0).map(() => `
    <div class="sketch-card p-5 bg-white animate-pulse">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-ink/10 border-2 border-ink"></div>
        <div class="flex-1 space-y-1.5">
          <div class="w-20 h-4 bg-ink/10 rounded"></div>
          <div class="w-36 h-5 bg-ink/15 rounded"></div>
        </div>
      </div>
      <div class="w-full h-10 bg-ink/5 rounded mb-4"></div>
      <div class="w-full h-18 bg-paper rounded border border-ink/20 mb-4"></div>
      <div class="w-full h-9 bg-ink/15 rounded-xl border-2 border-ink"></div>
    </div>
  `).join('');
  statusContainer.classList.remove('hidden');
  eventsGrid.innerHTML = '';
}

/**
 * Empty state: Friendly doodle + Clear filters button
 */
function showEmpty() {
  statusContainer.className = 'p-8 sketch-card text-center bg-white my-6';
  statusContainer.innerHTML = `
    <div class="text-4xl mb-2">🔍</div>
    <h3 class="font-brush text-2xl font-bold text-ink mb-1">No events match your search</h3>
    <p class="text-base text-ink/75 mb-4">Try checking your spelling or selecting another category filter.</p>
    <button onclick="window.clearFilters()" class="sketch-btn px-4 py-1.5 bg-mustard hover:bg-[#e0a435] text-ink font-bold text-base">
      Clear Filters & Search
    </button>
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
