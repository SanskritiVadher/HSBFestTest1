/**
 * Zenith '26 - Student Event Portal
 * Dynamic cards, live search, category filtering, interactive campus map,
 * fest passport, cartoon character reactions, and obsidian spatial flow.
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
const venueButtons = document.querySelectorAll('.venue-node-btn');
const resetMapFilterBtn = document.getElementById('reset-map-filter-btn');
const passportContainer = document.getElementById('passport-container');
const passportBadgeCount = document.getElementById('passport-badge-count');
const greetingText = document.getElementById('greeting-text');

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
    }, 280);
  });

  // Category filter buttons
  categoryButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach((b) => {
        b.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm', 'shadow-indigo-500/50');
        b.classList.add('bg-white/5', 'text-slate-300', 'border', 'border-white/10');
      });
      btn.classList.remove('bg-white/5', 'text-slate-300', 'border-white/10');
      btn.classList.add('bg-indigo-600', 'text-white', 'shadow-sm', 'shadow-indigo-500/50');

      currentCategory = btn.dataset.category;
      fetchEvents();
    });
  });

  // Campus map venue clicks
  venueButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      venueButtons.forEach(b => b.classList.remove('ring-2', 'ring-indigo-400', 'bg-indigo-900/40'));
      btn.classList.add('ring-2', 'ring-indigo-400', 'bg-indigo-900/40');
      currentVenue = btn.dataset.venue;
      applyClientVenueFilter();
    });
  });

  resetMapFilterBtn.addEventListener('click', () => {
    venueButtons.forEach(b => b.classList.remove('ring-2', 'ring-indigo-400', 'bg-indigo-900/40'));
    currentVenue = '';
    renderEvents(allEventsCache);
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
    greetingText.textContent = `Welcome back, ${rememberedName}! 🎈`;
  }
}

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
    if (currentVenue) {
      applyClientVenueFilter();
    } else {
      renderEvents(events);
    }
  } catch (err) {
    showError(`Error connecting to server: ${err.message}. Make sure the backend server is running.`);
  }
}

function applyClientVenueFilter() {
  if (!currentVenue) {
    renderEvents(allEventsCache);
    return;
  }
  const filtered = allEventsCache.filter(e => 
    e.venue.toLowerCase().includes(currentVenue.toLowerCase())
  );
  renderEvents(filtered);
}

/**
 * Render cards into #events-grid with Cartoon Mascots & Obsidian Styling
 */
function renderEvents(events) {
  eventsGrid.innerHTML = '';
  hideStatus();

  if (!events || events.length === 0) {
    showEmpty();
    return;
  }

  // Cartoon Character buddy roster
  const cartoonBuddies = [
    { name: "Ord (Dragon Tales)", icon: "🐲", quote: "Dragon scale power!", anim: "anim-dragon" },
    { name: "Popeye the Sailor", icon: "💪", quote: "Strong to the finich with spinach!", anim: "anim-popeye" },
    { name: "Oswald the Octopus", icon: "🐙", quote: "Have a calm, wonderful day!", anim: "anim-oswald" },
    { name: "Mr. Bean & Teddy", icon: "🧸", quote: "Brilliant, absolutely brilliant!", anim: "anim-bean" },
    { name: "Cassie (Dragon Tales)", icon: "✨", quote: "I wish with all my heart!", anim: "anim-dragon" },
    { name: "Olive Oyl & Popeye", icon: "⚓", quote: "Ahoy there fest mates!", anim: "anim-popeye" }
  ];

  events.forEach((event) => {
    const isFull = event.available_seats <= 0;
    const feeText = event.fee === 0 ? 'Free' : `₹${event.fee}`;
    const seatsBadgeClass = isFull 
      ? 'bg-rose-950/70 text-rose-300 font-bold border border-rose-500/40' 
      : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-semibold';

    const buddy = cartoonBuddies[(event.id - 1) % cartoonBuddies.length];

    const card = document.createElement('div');
    card.className = `obsidian-card rounded-2xl p-5 hover:-translate-y-1 transition duration-300 flex flex-col justify-between group`;

    card.innerHTML = `
      <div>
        <!-- Node Header & Cartoon Buddy -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-2.5">
            <span class="text-3xl p-2.5 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition ${buddy.anim}" title="${buddy.name}: ${buddy.quote}">
              ${event.icon || '⚡'}
            </span>
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  ${event.category}
                </span>
                <span class="text-[10px] bg-white/5 text-purple-300 px-1.5 py-0.5 rounded-md border border-white/10 inline-flex items-center gap-1 cursor-default" title="${buddy.quote}">
                  <span>${buddy.icon}</span> ${buddy.name.split(' ')[0]}
                </span>
              </div>
              <h3 class="font-bold text-white text-base leading-snug line-clamp-1 mt-1 group-hover:text-indigo-300 transition" title="${event.title}">
                ${event.title}
              </h3>
            </div>
          </div>
          ${isFull 
            ? `<span class="px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wide bg-rose-600/90 text-white font-extrabold shadow-sm shadow-rose-900 border border-rose-500/40">FULL</span>`
            : `<span class="px-2 py-0.5 rounded-md text-xs font-semibold ${event.fee === 0 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'}">${feeText}</span>`
          }
        </div>

        <p class="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          ${event.description || 'Join this exciting fest event! Click details to read more.'}
        </p>

        <div class="space-y-1.5 text-xs text-slate-300 mb-5 bg-white/5 p-3 rounded-xl border border-white/10">
          <div class="flex items-center justify-between">
            <span class="text-slate-400">📅 Date & Time:</span>
            <span class="font-medium text-slate-200">${event.event_date} · ${event.event_time}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">📍 Venue:</span>
            <span class="font-medium text-indigo-300 truncate max-w-[170px]">${event.venue}</span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-white/10">
            <span class="text-slate-400">🎟️ Seats Left:</span>
            <span class="px-2 py-0.5 rounded text-[11px] ${seatsBadgeClass}">
              ${isFull ? '0 Seats Left' : `${event.available_seats} / ${event.capacity}`}
            </span>
          </div>
        </div>
      </div>

      <button 
        onclick="openEventDetails(${event.id})"
        class="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
          isFull
            ? 'bg-white/10 hover:bg-white/15 text-slate-400 border border-white/10'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-900/50 hover:scale-[1.02]'
        }"
      >
        <span>Open Node & Register</span>
        <span class="anim-float">→</span>
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
      modalEventSeats.innerHTML = `<span class="text-rose-400 font-bold">FULL (0 / ${event.capacity})</span>`;
      submitRegisterBtn.disabled = true;
      submitRegisterBtn.classList.add('opacity-50', 'cursor-not-allowed');
      submitRegisterBtn.innerHTML = '<span>Event Node is Full</span>';
    } else {
      modalEventSeats.innerHTML = `<span class="text-indigo-400 font-bold">${event.available_seats} of ${event.capacity} left</span>`;
      submitRegisterBtn.disabled = false;
      submitRegisterBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitRegisterBtn.innerHTML = '<span>Confirm Registration & Collect Stamp 🎉</span>';
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

  // Client-side validations
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

  // Save for personalized returning experience
  localStorage.setItem('zenith_student_name', studentName);
  localStorage.setItem('zenith_roll_number', rollNumber);
  localStorage.setItem('zenith_email', email);
  setupPersonalizedGreeting();

  // Submit to POST /api/events/{event_id}/register
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
      // Success celebration with cartoon sound/vibe reaction
      showModalAlert(
        `🎉 Stamp Earned! Registered for ${modalEventTitle.textContent}! Pass ID: #${data.id}`,
        'success'
      );
      registrationForm.reset();

      // Refresh event count & passport
      await fetchEvents();
      await loadUserPassport();

      // Close modal automatically after 1.8 seconds
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
    submitRegisterBtn.innerHTML = '<span>Confirm Registration & Collect Stamp 🎉</span>';
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

    // If user has registered before, match by email or show recent registrations
    const myRegistrations = email 
      ? registrations.filter(r => r.email.toLowerCase() === email.toLowerCase())
      : registrations.slice(0, 3); // preview if no email yet

    passportBadgeCount.textContent = `${myRegistrations.length} Badges Earned`;

    if (myRegistrations.length === 0) {
      passportContainer.innerHTML = `
        <div class="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-slate-400 col-span-full py-10">
          <span class="text-3xl block mb-2 anim-float">🐙</span>
          <p class="text-sm font-bold text-slate-300">Your Fest Passport is ready for adventure!</p>
          <p class="text-xs text-slate-500 mt-1">Register for any event above to collect verified digital passport stamps.</p>
        </div>
      `;
      return;
    }

    passportContainer.innerHTML = '';
    myRegistrations.forEach((reg) => {
      const stampCard = document.createElement('div');
      stampCard.className = 'obsidian-card p-4 rounded-2xl border border-indigo-500/30 flex items-center justify-between gap-3 group relative overflow-hidden';
      stampCard.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center text-2xl anim-stamp">
            🎖️
          </div>
          <div>
            <span class="text-[10px] font-mono uppercase text-indigo-400 font-bold">Verified Registration</span>
            <h4 class="font-bold text-white text-sm line-clamp-1">${reg.event_title}</h4>
            <p class="text-[11px] text-slate-400 font-mono">${reg.student_name} (${reg.roll_number})</p>
          </div>
        </div>
        <div class="text-right">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            PASS #${reg.id}
          </span>
          <span class="block text-[10px] text-slate-500 mt-1">Confirmed</span>
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
  modalAlert.classList.remove('hidden', 'bg-emerald-950/80', 'text-emerald-300', 'border-emerald-500/40', 'bg-rose-950/80', 'text-rose-300', 'border-rose-500/40');

  if (type === 'success') {
    modalAlert.classList.add('bg-emerald-950/80', 'text-emerald-300', 'border', 'border-emerald-500/40', 'anim-stamp');
  } else {
    modalAlert.classList.add('bg-rose-950/80', 'text-rose-300', 'border', 'border-rose-500/40');
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
  statusContainer.className = 'flex items-center justify-center py-16 text-slate-400';
  statusContainer.innerHTML = `
    <div class="flex flex-col items-center gap-3">
      <div class="text-4xl anim-dragon">🐲</div>
      <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm font-medium">Connecting to fest knowledge canvas...</p>
    </div>
  `;
  statusContainer.classList.remove('hidden');
}

function showError(msg) {
  statusContainer.className = 'p-6 bg-rose-950/50 border border-rose-500/30 rounded-2xl text-center text-rose-300';
  statusContainer.innerHTML = `
    <div class="text-3xl mb-2 anim-bean">🧸</div>
    <h4 class="font-bold text-sm mb-1">Canvas Connection Failed</h4>
    <p class="text-xs text-rose-400">${msg}</p>
    <button onclick="fetchEvents()" class="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Try Again</button>
  `;
  statusContainer.classList.remove('hidden');
  eventsGrid.innerHTML = '';
}

function showEmpty() {
  statusContainer.className = 'py-16 text-center text-slate-400 obsidian-card rounded-2xl';
  statusContainer.innerHTML = `
    <div class="text-4xl mb-2 anim-oswald">🐙</div>
    <h4 class="font-bold text-white text-base mb-1">No event nodes match your criteria</h4>
    <p class="text-xs text-slate-400">Try adjusting your search query, selecting another category, or resetting the campus map.</p>
  `;
  statusContainer.classList.remove('hidden');
}

function hideStatus() {
  statusContainer.classList.add('hidden');
}
