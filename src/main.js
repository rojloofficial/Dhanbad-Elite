import { PROFILES } from './data/profiles.js';
import { CLIENT_REVIEWS } from './data/reviews.js';
import { FAQS } from './data/faqs.js';

// Application State
const state = {
  activeCategory: 'All',
  activeLocality: 'All',
  searchQuery: '',
  activeView: 'grid', // 'grid' | 'list'
  selectedProfileId: null
};

// Concierge Contacts for Dhanbad Elite05
const CONCIERGE_TELEGRAM = 'https://t.me/i_am_turtle';
const CONCIERGE_CALL = '8252377842';

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  renderProfiles();
  initFilters();
  initModals();
});

// --------------------------------------------------------------------------
// 1. Header & Navigation Behaviors
// --------------------------------------------------------------------------
function initHeader() {
  const header = document.querySelector('.site-header');
  const menuToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  // Sticky header background on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile menu toggle
  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      mobileDrawer.classList.toggle('active');
    });

    // Close mobile drawer when clicking any link inside it
    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Desktop Explore dropdown click and accessibility handling
  const dropdown = document.querySelector('.nav-dropdown');
  const dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
  if (dropdown && dropdownTrigger) {
    dropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      dropdownTrigger.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
        dropdownTrigger.focus();
      }
    });
  }
}

// --------------------------------------------------------------------------
// 2. Profile Cards Rendering & Filtering
// --------------------------------------------------------------------------
function renderProfiles() {
  const gridContainer = document.getElementById('profilesGrid');
  const countDisplay = document.getElementById('listingCount');
  if (!gridContainer) return;

  const filtered = PROFILES.filter(profile => {
    const matchesCat = state.activeCategory === 'All' || profile.category === state.activeCategory;
    const matchesLoc = state.activeLocality === 'All' || profile.locality === state.activeLocality;
    const query = state.searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      profile.name.toLowerCase().includes(query) ||
      profile.locality.toLowerCase().includes(query) ||
      profile.category.toLowerCase().includes(query) ||
      profile.services.some(s => s.toLowerCase().includes(query));

    return matchesCat && matchesLoc && matchesQuery;
  });

  if (countDisplay) {
    countDisplay.innerHTML = `Showing <strong>${filtered.length}</strong> of ${PROFILES.length} verified listings`;
  }

  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
        <h3 style="font-size: 1.3rem; margin-bottom: 8px; color: var(--gold-light);">No Companions Found</h3>
        <p style="color: var(--text-secondary); max-width: 440px; margin: 0 auto 16px;">We could not find any active profiles matching your exact filter combination. Try resetting your search or locality filter.</p>
        <button id="resetFiltersBtn" class="btn btn-secondary">Reset All Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.activeCategory = 'All';
        state.activeLocality = 'All';
        state.searchQuery = '';
        const searchInput = document.getElementById('profileSearchInput');
        if (searchInput) searchInput.value = '';
        updateFilterUI();
        renderProfiles();
      });
    }
    return;
  }

  gridContainer.innerHTML = filtered.map(profile => {
    return `
      <article class="profile-card" data-id="${profile.id}">
        <div class="card-media">
          <picture>
            <source srcset="${profile.image}" type="image/webp">
            <img src="${profile.fallbackImage}" alt="${profile.name} — Call Girl in ${profile.locality}, Dhanbad" loading="lazy" width="400" height="533" fetchpriority="low">
          </picture>
          <div class="card-gradient-overlay"></div>
          
          <div class="card-badges-overlay">
            <span class="badge badge-vip">${profile.category}</span>
            <span class="badge badge-verified">
              <span class="pulse-dot"></span> Available
            </span>
          </div>

          <div class="card-floating-info">
            <h3 class="card-name-title">${profile.name}, ${profile.age}</h3>
            <span class="card-vibe-tag">${profile.vibe}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="card-stats-row">
            <div class="stat-item">
              <span class="stat-item-label">Location</span>
              <span class="stat-item-val">${profile.locality}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Height</span>
              <span class="stat-item-val">${profile.height}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Languages</span>
              <span class="stat-item-val">${profile.languages.slice(0, 2).join(', ')}</span>
            </div>
          </div>

          <div class="card-tags">
            ${profile.services.slice(0, 3).map(service => `<span class="service-tag">${service}</span>`).join('')}
          </div>

          <div class="card-rate-row">
            <div>
              <span class="rate-label">Starting Rate</span>
              <div><strong class="rate-amount">${profile.rates.hourly}</strong> <span class="rate-unit">/ 1 Hour</span></div>
            </div>
            <div style="text-align: right;">
              <span class="rate-label">Client Rating</span>
              <div style="font-weight: 700; color: #f59e0b; font-size: 0.88rem;">★ ${profile.rating} <span style="color: var(--text-muted); font-size: 0.75rem;">(${profile.reviewCount})</span></div>
            </div>
          </div>

          <div class="card-actions">
            <a href="${CONCIERGE_TELEGRAM}" target="_blank" rel="noopener noreferrer" class="btn btn-telegram btn-card-action" aria-label="Telegram: Inquire for ${profile.name}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z"/></svg>
              Telegram
            </a>
            <a href="tel:${CONCIERGE_CALL}" class="btn btn-call btn-card-action" aria-label="Call Now: Inquire for ${profile.name}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              Call Now
            </a>
            <button type="button" class="btn btn-card-view view-profile-btn" data-profile-id="${profile.id}">
              View Full Profile & Reviews
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach event listener to detail buttons
  gridContainer.querySelectorAll('.view-profile-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-profile-id'), 10);
      openProfileModal(id);
    });
  });
}

// --------------------------------------------------------------------------
// 3. Filter Controls & Search Logic
// --------------------------------------------------------------------------
function initFilters() {
  const catTabs = document.querySelectorAll('.cat-tab-btn');
  const locChips = document.querySelectorAll('.loc-chip-btn');
  const searchInput = document.getElementById('profileSearchInput');
  const viewBtns = document.querySelectorAll('.view-toggle-btn');
  const profilesGrid = document.getElementById('profilesGrid');

  catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeCategory = tab.getAttribute('data-category');
      renderProfiles();
    });
  });

  locChips.forEach(chip => {
    chip.addEventListener('click', () => {
      locChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeLocality = chip.getAttribute('data-locality');
      renderProfiles();
    });
  });

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = e.target.value;
        renderProfiles();
      }, 150);
    });
  }

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const viewMode = btn.getAttribute('data-view');
      state.activeView = viewMode;
      if (profilesGrid) {
        if (viewMode === 'list') {
          profilesGrid.classList.add('list-view');
        } else {
          profilesGrid.classList.remove('list-view');
        }
      }
    });
  });
}

function updateFilterUI() {
  document.querySelectorAll('.cat-tab-btn').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-category') === state.activeCategory);
  });
  document.querySelectorAll('.loc-chip-btn').forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-locality') === state.activeLocality);
  });
}

// --------------------------------------------------------------------------
// 4. Modals Management (Profile Lightbox, Privacy, Terms)
// --------------------------------------------------------------------------
function initModals() {
  const profileModal = document.getElementById('profileModal');
  const privacyModal = document.getElementById('privacyModal');
  const termsModal = document.getElementById('termsModal');

  // Generic close for all modal backdrops when clicking overlay
  [profileModal, privacyModal, termsModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) closeModal(modal);
    });
  });

  // ESC key listener for accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [profileModal, privacyModal, termsModal].forEach(modal => {
        if (modal && modal.classList.contains('open')) {
          closeModal(modal);
        }
      });
    }
  });

  // Privacy & Terms link triggers in footer
  const openPrivacyBtn = document.getElementById('openPrivacyPolicy');
  const openTermsBtn = document.getElementById('openTermsNotice');

  if (openPrivacyBtn && privacyModal) {
    openPrivacyBtn.addEventListener('click', () => openModal(privacyModal));
  }
  if (openTermsBtn && termsModal) {
    openTermsBtn.addEventListener('click', () => openModal(termsModal));
  }
}

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('open');
  document.body.style.overflow = 'hidden';
  const closeBtn = modalEl.querySelector('.modal-close-btn');
  if (closeBtn) closeBtn.focus();
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  document.body.style.overflow = '';
}

function openProfileModal(id) {
  const profile = PROFILES.find(p => p.id === id);
  if (!profile) return;

  const modal = document.getElementById('profileModal');
  const contentEl = document.getElementById('profileModalBody');
  if (!modal || !contentEl) return;

  contentEl.innerHTML = `
    <div class="modal-media-col">
      <picture>
        <source srcset="${profile.image}" type="image/webp">
        <img src="${profile.fallbackImage}" alt="${profile.name} Full Profile View" class="modal-main-img" width="450" height="600">
      </picture>
    </div>

    <div class="modal-content-col">
      <div class="modal-header-info">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span class="badge badge-vip">${profile.category}</span>
          <span class="badge badge-verified"><span class="pulse-dot"></span> Available in ${profile.locality}</span>
        </div>
        <h2 class="modal-name">${profile.name}, ${profile.age}</h2>
        <span style="color: var(--gold-light); font-size: 0.92rem;">${profile.vibe}</span>
      </div>

      <div class="modal-specs-table">
        <div class="spec-box">
          <span class="spec-title">Height</span>
          <div class="spec-value">${profile.height}</div>
        </div>
        <div class="spec-box">
          <span class="spec-title">Languages</span>
          <div class="spec-value">${profile.languages.join(', ')}</div>
        </div>
        <div class="spec-box">
          <span class="spec-title">Service Type</span>
          <div class="spec-value">Incall & Outcall</div>
        </div>
      </div>

      <div>
        <h4 style="font-size: 0.82rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 6px;">Introduction & Background</h4>
        <p class="modal-bio">${profile.bio}</p>
      </div>

      <div class="modal-rates-box">
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--gold-light); letter-spacing: 0.5px; margin-bottom: 10px;">Transparent Rates Structure</h4>
        <div class="modal-rates-grid">
          <div>
            <span class="rate-tier-name">1 Hour Meeting</span>
            <div class="rate-tier-val">${profile.rates.hourly}</div>
          </div>
          <div>
            <span class="rate-tier-name">2 Hours Dinner</span>
            <div class="rate-tier-val">${profile.rates.twoHours}</div>
          </div>
          <div>
            <span class="rate-tier-name">Full Night VIP</span>
            <div class="rate-tier-val">${profile.rates.overnight}</div>
          </div>
        </div>
      </div>

      <div class="modal-review-highlight">
        <div style="color: #f59e0b; font-size: 0.85rem; margin-bottom: 4px;">★★★★★ <span style="color: var(--text-muted); font-size: 0.75rem;">Verified Client Feedback</span></div>
        <p>"${profile.clientReview.comment}"</p>
        <div class="modal-review-author">— ${profile.clientReview.author} (${profile.clientReview.location}) • ${profile.clientReview.date}</div>
      </div>

      <div class="modal-action-row">
        <a href="${CONCIERGE_TELEGRAM}" target="_blank" rel="noopener noreferrer" class="btn btn-telegram">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z"/></svg>
          Chat on Telegram
        </a>
        <a href="tel:${CONCIERGE_CALL}" class="btn btn-call">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          Call ${CONCIERGE_CALL}
        </a>
      </div>
    </div>
  `;

  openModal(modal);
}


