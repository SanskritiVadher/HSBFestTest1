/**
 * Zenith '26 - Student Event Portal
 * Hand-Drawn Sketch & Doodle Theme
 * Background Campus Map Interaction, Roaming Character SVGs, and Passport Flow
 */

const API_BASE = '/api';

// Current filter states
let currentCategory = 'All';
let currentSearch = '';
let currentVenue = '';
let debounceTimer = null;
let allEventsCache = [];

// DOM Elements
const eventsGrid = document.getElementById('events-grid');
const searchInput = document.getElementById('search-input');
const categoryButtons = document.querySelectorAll('.filter-btn');
const statusContainer = document.getElementById('status-container');
const passportContainer = document.getElementById('passport-container');
const passportBadgeCount = document.getElementById('passport-badge-count');
const greetingText = document.getElementById('greeting-text');
const activeVenuePill = document.getElementById('active-venue-pill');
const activeVenueName = document.getElementById('active-venue-name');

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
  loadUserPassport();
  setupEventListeners();
  setupPersonalizedGreeting();
});

function setupEventListeners() {
  // Search input with debounce
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = e.target.value.trim();
      fetchEvents();
    }, 250);
  });

  // Category filter buttons
  categoryButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach((b) => {
        b.classList.remove('bg-amber-300', 'text-slate-900');
        b.classList.add('bg-white', 'text-slate-800');
      });
      btn.classList.remove('bg-white', 'text-slate-800');
      btn.classList.add('bg-amber-300', 'text-slate-900');

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

function setupPersonalizedGreeting() {
  const rememberedName = localStorage.getItem('zenith_student_name');
  if (rememberedName) {
    greetingText.textContent = `Hi, ${rememberedName}! ✏️`;
  }
}

/**
 * Filter by clicking on the background campus map pins
 */
window.filterByVenue = function(venueName) {
  currentVenue = venueName;
  if (activeVenuePill && activeVenueName) {
    activeVenueName.textContent = venueName;
    activeVenuePill.classList.remove('hidden');
  }
  applyFilters();
  const eventsSec = document.getElementById('events-section');
  if (eventsSec) {
    eventsSec.scrollIntoView({ behavior: 'smooth' });
  }
};

window.resetVenueFilter = function() {
  currentVenue = '';
  if (activeVenuePill) {
    activeVenuePill.classList.add('hidden');
  }
  applyFilters();
};

window.scrollToBgMap = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Character Cheer Triggers
 */
window.characterCheer = function(type) {
  const cheers = {
    dragon: "Ord: 'I wish, I wish with all my heart to make great memories at this fest!' 🐲✨",
    popeye: "Popeye: 'I yam what I yam! Strong to the finich with fest energy!' 💪⚓",
    oswald: "Oswald: 'Hello friend! Let's have a calm and musical day together!' 🐙🎶",
    bean: "Teddy: 'Cheers and congratulations on joining the fest!' 🧸🚗"
  };
  alert(cheers[type] || "Fest cheer!");
};

/**
 * Fetch events matching current query parameters
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
    allEventsCache = events;
    applyFilters();
  } catch (err) {
    showError(`Error connecting to server: ${err.message}. Make sure backend is running.`);
  }
}

function applyFilters() {
  let filtered = allEventsCache;
  if (currentVenue) {
    filtered = filtered.filter(e => e.venue.toLowerCase().includes(currentVenue.toLowerCase()));
  }
  renderEvents(filtered);
}

/**
 * Render cards into #events-grid with Sketch & Doodle styling
 */
function renderEvents(events) {
  eventsGrid.innerHTML = '';
  hideStatus();

  if (!events || events.length === 0) {
    showEmpty();
    return;
  }

  // 4 Roaming Doodle Buddies
  const doodleMascots = [
    { icon: "🐲", quote: "Dragon Power", anim: "roam-dragon", badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-400" },
    { icon: "💪", quote: "Spinach Strength", anim: "roam-popeye", badgeColor: "bg-sky-100 text-sky-900 border-sky-400" },
    { icon: "🐙", quote: "Calm Rhythm", anim: "roam-oswald", badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-400" },
    { icon: "🧸", quote: "Teddy Approved", anim: "roam-bean", badgeColor: "bg-amber-100 text-amber-900 border-amber-400" }
  ];

  events.forEach((event) => {
    const isFull = event.available_seats <= 0;
    const feeText = event.fee === 0 ? 'Free Entry' : `₹${event.fee}`;
    const seatsBadgeClass = isFull 
      ? 'bg-rose-100 text-rose-800 font-bold border-2 border-rose-800' 
      : 'bg-emerald-100 text-emerald-900 border-2 border-slate-800 font-bold';

    const buddy = doodleMascots[(event.id - 1) % doodleMascots.length];

    const card = document.createElement('div');
    card.className = `doodle-card p-5 flex flex-col justify-between group`;

    card.innerHTML = `
      <div>
        <!-- Node Header & Hand-Drawn Mascot -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <span class="text-3xl p-2 bg-amber-50 rounded-xl border-2 border-slate-800 group-hover:scale-110 transition ${buddy.anim}">
              ${event.icon || '⚡'}
            </span>
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs uppercase font-black px-2 py-0.5 rounded bg-slate-100 border border-slate-800 font-sketch">
                  ${event.category}
                </span>
                <span class="text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 font-bold ${buddy.badgeColor}">
                  <span class="${buddy.anim}">${buddy.icon}</span> ${buddy.quote}
                </span>
              </div>
              <h3 class="font-black text-slate-900 text-xl leading-snug line-clamp-1 mt-1 font-sketch" title="${event.title}">
                ${event.title}
              </h3>
            </div>
          </div>
          ${isFull 
            ? `<span class="px-2.5 py-0.5 rounded text-xs uppercase bg-rose-500 text-white font-black border-2 border-slate-800 rotate-3">FULL</span>`
            : `<span class="px-2.5 py-0.5 rounded text-sm font-bold bg-amber-100 border-2 border-slate-800 -rotate-2">${feeText}</span>`
          }
        </div>

        <p class="text-base text-slate-600 line-clamp-2 mb-4 leading-relaxed font-doodle">
          ${event.description || 'Come join us for this exciting competition!'}
        </p>

        <div class="space-y-1.5 text-base text-slate-800 mb-5 bg-yellow-50/70 p-3 rounded-xl border-2 border-slate-800 font-doodle">
          <div class="flex items-center justify-between">
            <span class="text-slate-500">📅 When:</span>
            <span class="font-bold">${event.event_date} · ${event.event_time}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">📍 Where:</span>
            <span class="font-bold text-indigo-700 underline cursor-pointer" onclick="window.filterByVenue('${event.venue}')">${event.venue}</span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-slate-300">
            <span class="text-slate-500">🎟️ Seats Left:</span>
            <span class="px-2 py-0.5 rounded text-xs ${seatsBadgeClass}">
              ${isFull ? '0 Seats Left' : `${event.available_seats} / ${event.capacity}`}
            </span>
          </div>
        </div>
      </div>

      <button 
        onclick="openEventDetails(${event.id})"
        class="w-full py-2 px-4 rounded-xl text-lg font-sketch font-bold transition flex items-center justify-center gap-2 doodle-btn ${
          isFull
            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
            : 'bg-amber-300 hover:bg-amber-400 text-slate-900'
        }"
      >
        <span>Inspect & Register</span>
        <span class="roam-dragon">✏️</span>
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

  const savedName = localStorage.getItem('zenith_student_name');
  const savedRoll = localStorage.getItem('zenith_roll_number');
  const savedEmail = localStorage.getItem('zenith_email');

  if (savedName) document.getElementById('reg-student-name').value = savedName;
  if (savedRoll) document.getElementById('reg-roll-number').value = savedRoll;
  if (savedEmail) document.getElementById('reg-email').value = savedEmail;

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}`);
    if (!res.ok) throw new Error('Could not load event details');
    const event = await res.json();

    modalEventId.value = event.id;
    modalEventIcon.textContent = event.icon || '⚡';
    modalEventCategory.textContent = event.category;
    modalEventTitle.textContent = event.title;
    modalEventDateTime.textContent = `${event.event_date} · ${event.event_time}`;
    modalEventVenue.textContent = event.venue;
    modalEventFee.textContent = event.fee === 0 ? 'Free' : `₹${event.fee}`;
    
    if (event.available_seats <= 0) {
      modalEventSeats.innerHTML = `<span class="text-rose-600 font-bold">FULL (0 / ${event.capacity})</span>`;
      submitRegisterBtn.disabled = true;
      submitRegisterBtn.classList.add('opacity-50', 'cursor-not-allowed');
      submitRegisterBtn.innerHTML = '<span>Event Node is Full</span>';
    } else {
      modalEventSeats.innerHTML = `<span class="text-purple-700 font-bold">${event.available_seats} of ${event.capacity} left</span>`;
      submitRegisterBtn.disabled = false;
      submitRegisterBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitRegisterBtn.innerHTML = '<span>Confirm Registration 📌</span>';
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

  // Client validations
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

  localStorage.setItem('zenith_student_name', studentName);
  localStorage.setItem('zenith_roll_number', rollNumber);
  localStorage.setItem('zenith_email', email);
  setupPersonalizedGreeting();

  submitRegisterBtn.disabled = true;
  submitRegisterBtn.innerHTML = `<span class="animate-spin mr-1">🌀</span> Stamping Passport...`;

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
        `🎉 Stamp Earned! Registered for ${modalEventTitle.textContent}! Pass ID: #${data.id}`,
        'success'
      );
      registrationForm.reset();

      await fetchEvents();
      await loadUserPassport();

      setTimeout(() => {
        closeModal();
      }, 1800);
    } else {
      const errorMsg = data.detail || 'Registration failed. Please check your details.';
      showModalAlert(`⚠️ ${errorMsg}`, 'error');
    }
  } catch (err) {
    showModalAlert(`⚠️ Network error: ${err.message}`, 'error');
  } finally {
    submitRegisterBtn.disabled = false;
    submitRegisterBtn.innerHTML = '<span>Confirm Registration 📌</span>';
  }
}

/**
 * Load Fest Passport from GET /api/registrations
 */
async function loadUserPassport() {
  const email = localStorage.getItem('zenith_email');
  try {
    const res = await fetch(`${API_BASE}/registrations`);
    if (!res.ok) return;
    const registrations = await res.json();

    const myRegistrations = email 
      ? registrations.filter(r => r.email.toLowerCase() === email.toLowerCase())
      : registrations.slice(0, 3);

    passportBadgeCount.textContent = `${myRegistrations.length} Stamps Earned`;

    if (myRegistrations.length === 0) {
      passportContainer.innerHTML = `
        <div class="p-8 rounded-2xl bg-white border-2 border-dashed border-slate-400 text-center text-slate-500 col-span-full font-doodle">
          <span class="text-4xl block mb-2 roam-oswald">🐙</span>
          <p class="text-xl font-bold text-slate-800">Your passport page is empty right now!</p>
          <p class="text-base text-slate-600">Register for events above to collect official fest rubber-stamp passes.</p>
        </div>
      `;
      return;
    }

    passportContainer.innerHTML = '';
    myRegistrations.forEach((reg) => {
      const stampCard = document.createElement('div');
      stampCard.className = 'doodle-card p-4 bg-white flex items-center justify-between gap-3';
      stampCard.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-amber-100 border-2 border-slate-800 flex items-center justify-center text-2xl roam-dragon">
            🎖️
          </div>
          <div>
            <span class="text-xs uppercase font-bold text-indigo-700 font-sketch">Verified Stamp</span>
            <h4 class="font-black text-slate-900 text-base line-clamp-1 font-sketch">${reg.event_title}</h4>
            <p class="text-sm text-slate-600 font-doodle">${reg.student_name} (${reg.roll_number})</p>
          </div>
        </div>
        <div class="text-right">
          <span class="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-900 border border-slate-800 font-bold -rotate-3 inline-block">
            STAMP #${reg.id}
          </span>
          <span class="block text-xs text-slate-400 mt-1">Confirmed</span>
        </div>
      `;
      passportContainer.appendChild(stampCard);
    });

  } catch (err) {
    console.warn("Could not load passport:", err);
  }
}

// Helpers for inline alerts and UI states
function showModalAlert(message, type) {
  modalAlert.textContent = message;
  modalAlert.classList.remove('hidden', 'bg-emerald-100', 'text-emerald-900', 'border-emerald-600', 'bg-rose-100', 'text-rose-900', 'border-rose-600');

  if (type === 'success') {
    modalAlert.classList.add('bg-emerald-100', 'text-emerald-900', 'border-2', 'border-emerald-600');
  } else {
    modalAlert.classList.add('bg-rose-100', 'text-rose-900', 'border-2', 'border-rose-600');
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

function showLoading() {
  statusContainer.className = 'flex items-center justify-center py-12 text-slate-600 font-doodle';
  statusContainer.innerHTML = `
    <div class="flex flex-col items-center gap-2">
      <div class="text-4xl roam-dragon">✏️</div>
      <p class="text-xl font-bold">Sketching out event doodles...</p>
    </div>
  `;
  statusContainer.classList.remove('hidden');
}

function showError(msg) {
  statusContainer.className = 'p-5 bg-rose-50 border-2 border-rose-800 rounded-2xl text-center text-rose-800 font-doodle';
  statusContainer.innerHTML = `
    <div class="text-3xl mb-1 roam-bean">🧸</div>
    <h4 class="font-bold text-lg mb-1">Sketchbook Connection Failed</h4>
    <p class="text-sm">${msg}</p>
    <button onclick="fetchEvents()" class="mt-2 px-4 py-1 bg-amber-300 text-slate-900 rounded-lg text-sm font-bold doodle-btn">Try Again</button>
  `;
  statusContainer.classList.remove('hidden');
  eventsGrid.innerHTML = '';
}

function showEmpty() {
  statusContainer.className = 'py-12 text-center text-slate-500 doodle-card';
  statusContainer.innerHTML = `
    <div class="text-4xl mb-1 roam-oswald">🐙</div>
    <h4 class="font-bold text-slate-800 text-xl font-sketch">No doodles match your search</h4>
    <p class="text-base text-slate-600 font-doodle">Try another keyword or tap the map to reset the pin!</p>
  `;
  statusContainer.classList.remove('hidden');
}

function hideStatus() {
  statusContainer.classList.add('hidden');
}
