/**
 * Zenith '26 - Student Event Portal
 * Hand-Drawn Sketchbook Theme (Polished Interactive Edition)
 * Space, 3-layer depth, card deal-in, stickers, rubber-stamp, easter eggs & confetti
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
const scrollProgressBar = document.getElementById('scroll-progress-bar');
const parallaxLayer = document.getElementById('parallax-layer');
const stickyToastContainer = document.getElementById('sticky-toast-container');
const confettiContainer = document.getElementById('confetti-container');

// Easter Egg Elements
const heroCat = document.getElementById('hero-cat');
const catSpeech = document.getElementById('cat-speech');
const heroDragon = document.getElementById('hero-dragon');
const dragonSpeech = document.getElementById('dragon-speech');

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
  setupScrollEffects();
  setupEasterEggs();
});

function setupEventListeners() {
  // Search input with debounce (re-fetches GET /api/events with search param)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        fetchEvents();
      }, 260);
    });
  }

  // Category filter buttons (re-fetches GET /api/events with category param)
  categoryButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach((b) => {
        b.classList.remove('bg-tomato', 'text-white', 'active-sticker');
        b.classList.add('bg-white', 'text-ink');
      });
      btn.classList.remove('bg-white', 'text-ink');
      btn.classList.add('bg-tomato', 'text-white', 'active-sticker');

      currentCategory = btn.dataset.category;
      fetchEvents();
    });
  });

  // Modal Close
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  if (eventModal) {
    eventModal.addEventListener('click', (e) => {
      if (e.target === eventModal) closeModal();
    });
  }

  // Registration Form Submission
  if (registrationForm) {
    registrationForm.addEventListener('submit', handleRegistration);
  }
}

/**
 * Depth & Scroll effects: Pencil scroll progress + lightweight middle layer parallax
 */
function setupScrollEffects() {
  let isScrolling = false;

  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        // 1. Pencil Scroll Progress Bar
        if (scrollProgressBar) {
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
          scrollProgressBar.style.width = `${Math.min(100, Math.max(0, scrollPct))}%`;
        }

        // 2. Middle Layer Parallax (max 20px, hardware-accelerated translate3d)
        if (parallaxLayer && window.innerWidth >= 768) {
          const shift = Math.min(20, window.scrollY * 0.04);
          parallaxLayer.style.transform = `translate3d(0, ${shift}px, 0)`;
        }

        isScrolling = false;
      });
      isScrolling = true;
    }
  }, { passive: true });
}

/**
 * Idle Easter Egg: Clicking hero characters triggers a jump and cheer speech bubble
 */
function setupEasterEggs() {
  const catCheers = [
    "Let's go! 🚀",
    "Fest mode on! 🎈",
    "Catch me if you can! 🐾",
    "Rock Zenith! ⚡",
    "Ready, set, fest! 🎨"
  ];

  const dragonCheers = [
    "Ignite the spark! ⚡",
    "Woohoo! 🎉",
    "Super excited! 🌟",
    "Unleash the energy! 💥",
    "Full speed ahead! 🚀"
  ];

  let catTimeout = null;
  let dragonTimeout = null;

  if (heroCat && catSpeech) {
    const triggerCat = () => {
      const art = heroCat.querySelector('.character-art');
      if (art) {
        art.classList.remove('anim-easter-jump');
        void art.offsetWidth;
        art.classList.add('anim-easter-jump');
      }

      catSpeech.textContent = catCheers[Math.floor(Math.random() * catCheers.length)];
      catSpeech.classList.remove('hidden', 'speech-pop');
      void catSpeech.offsetWidth;
      catSpeech.classList.add('speech-pop');

      clearTimeout(catTimeout);
      catTimeout = setTimeout(() => {
        catSpeech.classList.add('hidden');
      }, 2500);
    };

    heroCat.addEventListener('click', triggerCat);
    heroCat.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerCat();
      }
    });
  }

  if (heroDragon && dragonSpeech) {
    const triggerDragon = () => {
      const art = heroDragon.querySelector('.character-art');
      if (art) {
        art.classList.remove('anim-easter-jump');
        void art.offsetWidth;
        art.classList.add('anim-easter-jump');
      }

      dragonSpeech.textContent = dragonCheers[Math.floor(Math.random() * dragonCheers.length)];
      dragonSpeech.classList.remove('hidden', 'speech-pop');
      void dragonSpeech.offsetWidth;
      dragonSpeech.classList.add('speech-pop');

      clearTimeout(dragonTimeout);
      dragonTimeout = setTimeout(() => {
        dragonSpeech.classList.add('hidden');
      }, 2500);
    };

    heroDragon.addEventListener('click', triggerDragon);
    heroDragon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerDragon();
      }
    });
  }
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
 * Convert time string (e.g., "10:00 AM", "02:00 PM") to minutes from midnight for sorting
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
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
 * Render single card markup with layered paper backing, tape/clip, seat scribble, rubber-stamp
 */
function createCardElement(event, globalIndex) {
  const isFull = event.available_seats <= 0;
  const feeText = event.fee === 0 ? 'Free' : `₹${event.fee}`;
  const categoryBg = CATEGORY_COLORS[event.category] || '#D9A58F';
  
  // Alternating tilts & backing sheet angles
  const tilts = [-1, 0, 1];
  const tiltDeg = tilts[globalIndex % 3];
  const backingRot = globalIndex % 2 === 0 ? 1.5 : -1.5;
  const isTape = globalIndex % 2 === 0;

  // Capacity calculation
  const capacity = event.capacity || 100;
  const available = Math.max(0, event.available_seats);
  const booked = Math.max(0, capacity - available);
  const pct = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 100;

  // Progress bar color thresholds
  let barColor = '#8DB580'; // sage (<70%)
  if (pct >= 90 || isFull) {
    barColor = '#E5533D'; // tomato (>90% or full)
  } else if (pct >= 70) {
    barColor = '#F2B84B'; // mustard (70-90%)
  }

  const formattedDate = formatEventDate(event.event_date, event.event_time);

  const wrapper = document.createElement('div');
  wrapper.className = 'card-wrapper relative card-deal-in';
  wrapper.style.setProperty('--card-tilt', `${tiltDeg}deg`);
  wrapper.style.setProperty('--backing-rot', `${backingRot}deg`);
  wrapper.style.animationDelay = `${globalIndex * 60}ms`;

  wrapper.innerHTML = `
    <!-- Layered Paper Backing Sheet (rotated 1-2 degrees in category colour) -->
    <div 
      class="card-backing"
      style="background-color: ${categoryBg}; transform: rotate(${backingRot}deg) translate(3px, 4px); opacity: 0.85;"
      aria-hidden="true"
    ></div>

    <!-- Main Front Card Surface -->
    <div 
      class="sketch-card p-5 flex flex-col justify-between h-full relative z-10 transition-transform duration-200 ${
        isFull ? 'bg-[#FAF5EA]' : 'bg-white'
      }"
      style="transform: rotate(${tiltDeg}deg);"
    >
      ${isTape ? '<div class="card-tape"></div>' : '<div class="card-clip"></div>'}

      <!-- Category top band tint -->
      <div class="h-2.5 -mx-5 -mt-5 mb-3.5 rounded-t-[12px] border-b-2 border-ink" style="background-color: ${categoryBg};"></div>

      ${isFull ? `
        <!-- Rubber-Stamp FULL slammed diagonally with thud animation -->
        <div class="rubber-stamp select-none" aria-label="Event Full">
          FULL
        </div>
      ` : ''}

      <div>
        <!-- Top Bar: Icon, Title & Category Badge -->
        <div class="flex items-start justify-between gap-2.5 mb-2.5">
          <div class="flex items-center gap-2.5">
            <span class="card-icon-art text-3xl p-1.5 rounded-lg border-2 border-ink bg-paper flex-shrink-0 select-none inline-block" aria-hidden="true">
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

          <!-- Seat Progress Bar Chip with Hand-Drawn Scribble Fill -->
          <div class="p-2 rounded-lg border border-ink/40 bg-paper">
            <div class="flex items-center justify-between text-xs font-bold mb-1">
              <span class="flex items-center gap-1.5">
                <span class="text-sm" aria-hidden="true">🎟️</span>
                <span class="text-ink/75 uppercase tracking-wide">Seats</span>
              </span>
              <span class="${isFull ? 'text-tomato font-bold' : 'text-ink font-semibold'}">
                ${isFull ? '0 left (FULL)' : `${event.available_seats} left`}
              </span>
            </div>
            <div class="w-full h-2.5 bg-white border border-ink rounded-full overflow-hidden p-[1px]">
              <div 
                class="h-full rounded-full seat-bar-fill"
                style="--seat-pct: ${pct}%; background-color: ${barColor};"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <button 
        onclick="openEventDetails(${event.id})"
        ${isFull ? 'disabled' : ''}
        class="sketch-btn w-full py-2 px-4 rounded-xl text-lg font-brush font-bold transition flex items-center justify-center gap-1.5 ${
          isFull
            ? 'bg-paper text-ink/40 border-ink/30 cursor-not-allowed shadow-none'
            : 'bg-tomato text-white hover:bg-[#d4432d]'
        }"
      >
        <span>${isFull ? 'Event Full 🔒' : 'Register ✏️'}</span>
      </button>
    </div>
  `;

  return wrapper;
}

/**
 * Render cards into #events-grid grouped under "Day 1 - Sat 14 Nov" and "Day 2 - Sun 15 Nov"
 */
function renderEvents(events) {
  eventsGrid.innerHTML = '';
  hideStatus();

  if (!events || events.length === 0) {
    showEmpty();
    return;
  }

  // Display grouping: Day 1 (2026-11-14) and Day 2 (2026-11-15)
  const day1Events = events.filter((e) => e.event_date === '2026-11-14');
  const day2Events = events.filter((e) => e.event_date === '2026-11-15');
  const otherEvents = events.filter((e) => e.event_date !== '2026-11-14' && e.event_date !== '2026-11-15');

  // Sort each day chronologically by event_time
  day1Events.sort((a, b) => parseTimeToMinutes(a.event_time) - parseTimeToMinutes(b.event_time));
  day2Events.sort((a, b) => parseTimeToMinutes(a.event_time) - parseTimeToMinutes(b.event_time));
  otherEvents.sort((a, b) => parseTimeToMinutes(a.event_time) - parseTimeToMinutes(b.event_time));

  let globalCardIndex = 0;

  // Helper to render a Day Section
  const renderDaySection = (title, count, eventList, badgeBg) => {
    if (eventList.length === 0) return;

    const section = document.createElement('section');
    section.className = 'day-group space-y-6';

    section.innerHTML = `
      <!-- Sketch-banner heading with hand-drawn underline -->
      <div class="day-banner inline-block">
        <div class="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <span class="text-2xl sm:text-3xl" aria-hidden="true">📅</span>
          <h2 class="font-brush text-3xl sm:text-4xl font-bold text-ink tracking-tight">${title}</h2>
          <span class="text-xs uppercase font-sans font-bold px-2 py-0.5 rounded border border-ink text-ink ml-1 shadow-sm" style="background-color: ${badgeBg};">
            ${count} ${count === 1 ? 'event' : 'events'}
          </span>
        </div>
        <!-- Hand-Drawn Underline SVG -->
        <svg class="w-52 sm:w-72 h-3.5 text-tomato mt-1" viewBox="0 0 240 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <path d="M 4 8 Q 60 2 120 7 T 236 4" />
        </svg>
      </div>

      <!-- Card Grid: 1 col mobile, 2 col tablet, 3 col desktop with 40px gap -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <!-- Cards will be appended here -->
      </div>
    `;

    const gridContainer = section.querySelector('.grid');
    eventList.forEach((ev) => {
      const card = createCardElement(ev, globalCardIndex++);
      gridContainer.appendChild(card);
    });

    eventsGrid.appendChild(section);
  };

  // Render Day 1 & Day 2 sections
  renderDaySection('Day 1 — Sat 14 Nov', day1Events.length, day1Events, '#F2B84B');
  renderDaySection('Day 2 — Sun 15 Nov', day2Events.length, day2Events, '#F28B82');
  if (otherEvents.length > 0) {
    renderDaySection('Special Sessions & Workshops', otherEvents.length, otherEvents, '#D9A58F');
  }
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
  if (eventModal) {
    eventModal.classList.add('hidden');
  }
}

/**
 * Trigger paper-confetti burst (30 pieces, 1.5s) in palette colours
 */
function triggerConfetti() {
  if (!confettiContainer) return;
  confettiContainer.innerHTML = '';

  const palette = ['#E5533D', '#F2B84B', '#F28B82', '#8DB580', '#F08A3C', '#D9A58F'];
  const count = 30;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const bg = palette[Math.floor(Math.random() * palette.length)];
    const leftPct = Math.random() * 96 + 2; // 2% to 98%
    const sizeW = Math.floor(Math.random() * 8) + 8; // 8px to 16px
    const sizeH = Math.floor(Math.random() * 10) + 8; // 8px to 18px
    const delay = Math.random() * 0.3; // 0 to 0.3s
    const rot = Math.random() * 360;

    piece.style.backgroundColor = bg;
    piece.style.left = `${leftPct}vw`;
    piece.style.top = `${Math.random() * 20 + 10}vh`;
    piece.style.width = `${sizeW}px`;
    piece.style.height = `${sizeH}px`;
    piece.style.border = '1px solid #2B2A28';
    piece.style.borderRadius = i % 3 === 0 ? '50%' : '2px';
    piece.style.transform = `rotate(${rot}deg)`;
    piece.style.animationDelay = `${delay}s`;

    confettiContainer.appendChild(piece);
  }

  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 1600);
}

/**
 * Show sticky-note toast notification
 */
function showStickyToast(eventTitle) {
  if (!stickyToastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'bg-[#FFF8DE] border-2 border-ink p-4 rounded-lg shadow-[4px_4px_0_var(--ink)] max-w-sm relative transition-all duration-300 pointer-events-auto transform rotate-1';
  
  toast.innerHTML = `
    <!-- Tape strip doodle -->
    <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#F2B84B]/80 border border-dashed border-ink rounded-sm -rotate-1 pointer-events-none"></div>
    <div class="flex items-start gap-2.5">
      <span class="text-2xl select-none" aria-hidden="true">🎉</span>
      <div>
        <h4 class="font-brush text-xl font-bold text-ink">You're in!</h4>
        <p class="font-hand text-base text-ink font-semibold">
          See you at <span class="underline decoration-tomato decoration-2 font-bold">${eventTitle}</span>!
        </p>
      </div>
    </div>
  `;

  stickyToastContainer.innerHTML = '';
  stickyToastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px) rotate(1deg)';
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, 3500);
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
  const currentTitle = modalEventTitle.textContent || 'Event';

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
      registrationForm.reset();
      closeModal();

      // Trigger celebration: Confetti burst + Sticky-note toast
      triggerConfetti();
      showStickyToast(currentTitle);

      // Refresh event cards immediately
      await fetchEvents();
    } else {
      // Server error shown as a torn red note inside the form
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

// Helpers for inline alerts and UI states (Torn note error styling)
function showModalAlert(message, type) {
  modalAlert.textContent = message;
  modalAlert.className = 'mb-3 p-3.5 rounded-lg text-base font-hand font-bold border-2 border-dashed border-tomato bg-[#FBF6EA] text-tomato relative shadow-[2px_2px_0_#E5533D]';
  modalAlert.classList.remove('hidden');
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
  if (searchInput) searchInput.value = '';
  categoryButtons.forEach((b) => {
    b.classList.remove('bg-tomato', 'text-white', 'active-sticker');
    b.classList.add('bg-white', 'text-ink');
    if (b.dataset.category === 'All') {
      b.classList.remove('bg-white', 'text-ink');
      b.classList.add('bg-tomato', 'text-white', 'active-sticker');
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
  if (statusContainer) {
    statusContainer.classList.add('hidden');
  }
}
