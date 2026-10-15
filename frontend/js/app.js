/**
 * Zenith '26 - Student Event Portal
 * Neon Cyber Theme (Neon Green, Cyan Blue, Purple)
 * Interactive Fullscreen Background Spatial Map & Dancing Cartoon Characters
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
        b.classList.remove('bg-gradient-to-r', 'from-neonGreen', 'to-neonCyan', 'text-black', 'shadow-lg');
        b.classList.add('bg-black/50', 'text-slate-300');
      });
      btn.classList.remove('bg-black/50', 'text-slate-300');
      btn.classList.add('bg-gradient-to-r', 'from-neonGreen', 'to-neonCyan', 'text-black', 'shadow-lg');

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
    greetingText.textContent = `Welcome back, ${rememberedName}! 🎈`;
  }
}

/**
 * Global function called when user clicks pins on the interactive background spatial map
 */
window.filterByVenue = function(venueName) {
  currentVenue = venueName;
  if (activeVenuePill && activeVenueName) {
    activeVenueName.textContent = venueName;
    activeVenuePill.classList.remove('hidden');
  }
  applyFilters();
  // Scroll down smoothly to events section
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
 * Interactive Character Cheer Click triggers
 */
window.characterCheer = function(type) {
  const cheers = {
    dragon: "Ord: 'I wish, I wish with all my heart to fly with friends in dragon land!' 🐉✨",
    popeye: "Popeye: 'I yam what I yam, an' that's all what I yam! Strong with fest spinach!' 💪⚓",
    oswald: "Oswald: 'Hello friend! Let's go on a calm, wonderful festival stroll with Weenie & Henry!' 🐙🎺",
    bean: "Mr. Bean: 'Brilliant! Teddy, look at all these competitions!' 🧸🚗"
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
    showError(`Error connecting to server: ${err.message}. Make sure backend is running on port 8000.`);
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
 * Render cards into #events-grid with Neon Cyber Accents & Dancing Characters
 */
function renderEvents(events) {
  eventsGrid.innerHTML = '';
  hideStatus();

  if (!events || events.length === 0) {
    showEmpty();
    return;
  }

  // 4 Animated Cartoon Buddies mapped to cards
  const cartoonBuddies = [
    { name: "Ord (Dragon Tales)", icon: "🐉", quote: "Dragon scale power!", anim: "dance-dragon", tagBg: "border-neonGreen/40 text-neonGreen bg-neonGreen/10" },
    { name: "Popeye the Sailor", icon: "💪", quote: "Spinach power boost!", anim: "dance-popeye", tagBg: "border-neonCyan/40 text-neonCyan bg-neonCyan/10" },
    { name: "Oswald the Octopus", icon: "🐙", quote: "Have a peaceful, groovy day!", anim: "dance-oswald", tagBg: "border-neonPurple/40 text-neonPurple bg-neonPurple/10" },
    { name: "Mr. Bean & Teddy", icon: "🧸", quote: "Brilliant!", anim: "dance-bean", tagBg: "border-neonPink/40 text-neonPink bg-neonPink/10" },
  ];

  events.forEach((event) => {
    const isFull = event.available_seats <= 0;
    const feeText = event.fee === 0 ? 'Free Entry' : `₹${event.fee}`;
    const seatsBadgeClass = isFull 
      ? 'bg-rose-950/80 text-rose-300 font-bold border border-rose-500/50' 
      : 'bg-neonGreen/10 text-neonGreen border border-neonGreen/40 font-bold font-mono';

    const buddy = cartoonBuddies[(event.id - 1) % cartoonBuddies.length];

    const card = document.createElement('div');
    card.className = `neon-glass rounded-2xl p-5 hover:-translate-y-1 transition duration-300 flex flex-col justify-between group`;

    card.innerHTML = `
      <div>
        <!-- Node Header & Animated Character Avatar -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <span class="text-3xl p-2.5 bg-black/60 rounded-xl border border-neonCyan/30 group-hover:scale-110 transition ${buddy.anim}" title="${buddy.name}">
              ${event.icon || '⚡'}
            </span>
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="inline-block text-[10px] font-bold uppercase tracking-wider text-neonCyan bg-neonCyan/10 px-2 py-0.5 rounded-full border border-neonCyan/30 font-mono">
                  ${event.category}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-md border inline-flex items-center gap-1 font-mono ${buddy.tagBg}">
                  <span class="${buddy.anim}">${buddy.icon}</span> ${buddy.name.split(' ')[0]}
                </span>
              </div>
              <h3 class="font-extrabold text-white text-base leading-snug line-clamp-1 mt-1 group-hover:text-neonGreen transition" title="${event.title}">
                ${event.title}
              </h3>
            </div>
          </div>
          ${isFull 
            ? `<span class="px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wide bg-rose-600 text-white font-extrabold shadow-sm shadow-rose-900 border border-rose-500">FULL</span>`
            : `<span class="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono ${event.fee === 0 ? 'bg-neonGreen/10 text-neonGreen border border-neonGreen/40' : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'}">${feeText}</span>`
          }
        </div>

        <p class="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
          ${event.description || 'Join this exciting fest competition! Click node to inspect details.'}
        </p>

        <div class="space-y-1.5 text-xs text-slate-300 mb-5 bg-black/40 p-3 rounded-xl border border-white/10 font-mono">
          <div class="flex items-center justify-between">
            <span class="text-slate-400">📅 Date & Time:</span>
            <span class="font-bold text-white">${event.event_date} · ${event.event_time}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">📍 Spatial Venue:</span>
            <span class="font-bold text-neonCyan truncate max-w-[170px] cursor-pointer hover:underline" onclick="window.filterByVenue('${event.venue}')">${event.venue}</span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-white/10">
            <span class="text-slate-400">🎟️ Seats Available:</span>
            <span class="px-2 py-0.5 rounded text-[11px] ${seatsBadgeClass}">
              ${isFull ? '0 Seats Left' : `${event.available_seats} / ${event.capacity}`}
            </span>
          </div>
        </div>
      </div>

      <button 
        onclick="openEventDetails(${event.id})"
        class="w-full py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
          isFull
            ? 'bg-white/10 hover:bg-white/15 text-slate-400 border border-white/10'
            : 'bg-gradient-to-r from-neonGreen via-neonCyan to-neonPurple hover:from-neonGreen hover:to-neonPurple text-black shadow-lg shadow-neonCyan/20 hover:scale-[1.02]'
        }"
      >
        <span>Open Node & Register</span>
        <span class="dance-dragon">→</span>
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
      modalEventSeats.innerHTML = `<span class="text-neonGreen font-bold font-mono">${event.available_seats} of ${event.capacity} left</span>`;
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

    const myRegistrations = email 
      ? registrations.filter(r => r.email.toLowerCase() === email.toLowerCase())
      : registrations.slice(0, 3);

    passportBadgeCount.textContent = `${myRegistrations.length} Badges Earned`;

    if (myRegistrations.length === 0) {
      passportContainer.innerHTML = `
        <div class="p-6 rounded-2xl bg-black/40 border border-white/10 text-center text-slate-400 col-span-full py-10">
          <span class="text-4xl block mb-2 dance-oswald">🐙</span>
          <p class="text-sm font-bold text-slate-300">Your Fest Passport is ready for stamps!</p>
          <p class="text-xs text-slate-500 mt-1">Register for any event above to collect verified digital stamps.</p>
        </div>
      `;
      return;
    }

    passportContainer.innerHTML = '';
    myRegistrations.forEach((reg) => {
      const stampCard = document.createElement('div');
      stampCard.className = 'neon-glass p-4 rounded-2xl border border-neonPurple/40 flex items-center justify-between gap-3 group relative overflow-hidden';
      stampCard.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-neonGreen/20 via-neonCyan/20 to-neonPurple/20 border border-neonCyan/30 flex items-center justify-center text-2xl dance-dragon">
            🎖️
          </div>
          <div>
            <span class="text-[10px] font-mono uppercase text-neonCyan font-bold">Verified Registration</span>
            <h4 class="font-extrabold text-white text-sm line-clamp-1">${reg.event_title}</h4>
            <p class="text-[11px] text-slate-400 font-mono">${reg.student_name} (${reg.roll_number})</p>
          </div>
        </div>
        <div class="text-right font-mono">
          <span class="px-2 py-0.5 rounded text-[10px] bg-neonGreen/10 text-neonGreen border border-neonGreen/30 font-bold">
            PASS #${reg.id}
          </span>
          <span class="block text-[10px] text-slate-400 mt-1">Confirmed</span>
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
  modalAlert.classList.remove('hidden', 'bg-neonGreen/10', 'text-neonGreen', 'border-neonGreen/40', 'bg-rose-950/80', 'text-rose-300', 'border-rose-500/40');

  if (type === 'success') {
    modalAlert.classList.add('bg-neonGreen/10', 'text-neonGreen', 'border', 'border-neonGreen/40');
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
      <div class="text-5xl dance-dragon">🐉</div>
      <div class="w-8 h-8 border-4 border-neonCyan border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm font-mono text-neonCyan">Connecting to knowledge canvas...</p>
    </div>
  `;
  statusContainer.classList.remove('hidden');
}

function showError(msg) {
  statusContainer.className = 'p-6 bg-rose-950/50 border border-rose-500/30 rounded-2xl text-center text-rose-300';
  statusContainer.innerHTML = `
    <div class="text-4xl mb-2 dance-bean">🧸</div>
    <h4 class="font-bold text-sm mb-1">Canvas Connection Failed</h4>
    <p class="text-xs text-rose-400">${msg}</p>
    <button onclick="fetchEvents()" class="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Try Again</button>
  `;
  statusContainer.classList.remove('hidden');
  eventsGrid.innerHTML = '';
}

function showEmpty() {
  statusContainer.className = 'py-16 text-center text-slate-400 neon-glass rounded-2xl';
  statusContainer.innerHTML = `
    <div class="text-5xl mb-2 dance-oswald">🐙</div>
    <h4 class="font-bold text-white text-base mb-1">No event nodes match your filter</h4>
    <p class="text-xs text-slate-400">Try adjusting your search query, or clear the venue filter pin.</p>
  `;
  statusContainer.classList.remove('hidden');
}

function hideStatus() {
  statusContainer.classList.add('hidden');
}
