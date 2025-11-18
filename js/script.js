// Hide header on scroll down, show on scroll up
(function () {
  const header = document.querySelector('header');
  const collapse = document.getElementById('navbarTogglerDemo02');
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;
  const delta = 8; // small threshold to prevent jitter

  function onScrollUpdate() {
    const y = window.scrollY;
    const nearTop = y < 50;
    const goingDown = y > lastY + delta;
    const goingUp = y < lastY - delta;

    // If nav is expanded (mobile), keep header visible
    if (collapse && collapse.classList.contains('show')) {
      header.classList.remove('header-hidden');
      lastY = y;
      ticking = false;
      return;
    }

    if (nearTop || goingUp) {
      header.classList.remove('header-hidden');
    } else if (goingDown) {
      header.classList.add('header-hidden');
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScrollUpdate);
      }
    },
    { passive: true }
  );
})();

// Product modal + simple cart
(function () {
  function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const count = parseInt(localStorage.getItem('cartCount') || '0', 10);
    badge.textContent = isNaN(count) ? '0' : String(count);
  }

  function ensureModal() {
    let modal = document.getElementById('productModal');
    if (modal) return modal;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="productModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="productModalLabel">Product</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div id="productCarousel" class="carousel slide" data-bs-ride="false">
                <div class="carousel-inner" id="productCarouselInner"></div>
                <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                  <span class="carousel-control-next-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Next</span>
                </button>
              </div>
              <p class="mt-3 mb-1" id="productModalDesc"></p>
              <p class="fw-bold mb-0" id="productModalPrice"></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-dark" id="addToCartBtn">Add to cart</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);
    return document.getElementById('productModal');
  }

  // Optional per-product description overrides by product name (case-insensitive)
  const PRODUCT_DESCRIPTIONS = {
    'boss ds-1': 'The DS-1 Distortion is a true icon among guitar effects. Since its 1978 debut, BOSS’s first distortion pedal has defined a bold, hard-edged sound with smooth sustain—a staple for generations of players. As the best-selling BOSS compact pedal, its original design remains unchanged, inspiring countless rock legends and ready to shape your own signature tone today.',
    'big-muff': 'Iconic fuzz delivering thick, sustaining wall-of-sound tones.',
  };
  

  function buildDescription(name, categoryGuess) {
    const c = (categoryGuess || '').toLowerCase();
    const key = (name || '').toLowerCase().trim();
    if (PRODUCT_DESCRIPTIONS[key]) return PRODUCT_DESCRIPTIONS[key];
    if (c.includes('pedal')) return `${name} is a versatile stompbox pedal ready for your board.`;
    if (c.includes('accessor')) return `${name} is an essential accessory to complement your rig.`;
    if (c.includes('electric')) return `${name} is a solid-body electric with great tone and playability.`;
    if (c.includes('acoustic')) return `${name} is a warm, resonant acoustic built for players of all levels.`;
    if (c.includes('bass')) return `${name} delivers punchy low-end and smooth playability.`;
    return `${name} is a quality product designed for performance and reliability.`;
  }

  function wireProductClicks() {
    const container = document;
    const modalEl = ensureModal();
    const titleEl = modalEl.querySelector('#productModalLabel');
    const carouselInner = modalEl.querySelector('#productCarouselInner');
    const descEl = modalEl.querySelector('#productModalDesc');
    const priceEl = modalEl.querySelector('#productModalPrice');
    const addBtn = modalEl.querySelector('#addToCartBtn');

    let currentItem = null;

    container.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;

      const section = card.closest('section');
      const heading = section ? section.querySelector('h1, h2') : null;
      const categoryGuess = heading ? heading.textContent.trim() : '';
      const name = card.querySelector('.card-title')?.textContent?.trim() || 'Product';
      const price = card.querySelector('.card-text')?.textContent?.trim() || '$0.00';
      const img = card.querySelector('img')?.src || '';
      let gallery = [];
      try {
        if (card.dataset.gallery) {
          const cleaned = card.dataset.gallery.replace(/\r?\n/g, '');
          gallery = JSON.parse(cleaned);
        }
      } catch {}
      if (!Array.isArray(gallery) || gallery.length === 0) {
        // Fallback: repeat the single image
        gallery = [img, img, img];
      }

      titleEl.textContent = name;
      // Populate carousel with gallery images
      if (carouselInner) {
        carouselInner.innerHTML = '';
        gallery.forEach((src, idx) => {
          const item = document.createElement('div');
          item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
          item.innerHTML = `<img src="${src}" class="d-block w-100" alt="${name} ${idx+1}" style="border-radius:.5rem;">`;
          carouselInner.appendChild(item);
        });
      }
      // Prefer per-card override via data-description, then name-based map, then category fallback
      descEl.textContent = (card.dataset.description || '').trim() || buildDescription(name, categoryGuess);
      priceEl.textContent = price;

      currentItem = { name, price, img };

      if (window.bootstrap && window.bootstrap.Modal) {
        const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      } else {
        alert(`${name}\n${price}`);
      }
    });

    addBtn.addEventListener('click', () => {
      // Increment count
      const count = parseInt(localStorage.getItem('cartCount') || '0', 10) || 0;
      localStorage.setItem('cartCount', String(count + 1));
      // Save item (basic)
      try {
        const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
        if (currentItem) items.push(currentItem);
        localStorage.setItem('cartItems', JSON.stringify(items));
      } catch {}
      updateCartBadge();
    });
  }

  // Kick off
  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    wireProductClicks();
  });
})();

// Cart view modal and interactions
(function () {
  function getItems() {
    try { return JSON.parse(localStorage.getItem('cartItems') || '[]'); } catch { return []; }
  }
  function setItems(items) {
    localStorage.setItem('cartItems', JSON.stringify(items));
    localStorage.setItem('cartCount', String(items.length));
  }
  function updateBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = String(getItems().length);
  }

  function ensureCartModal() {
    let modal = document.getElementById('cartViewModal');
    if (modal) return modal;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="cartViewModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Your Cart</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div id="cartItemsContainer" class="list-group"></div>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <strong>Total:</strong>
                <strong id="cartTotal">$0.00</strong>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" id="clearCartBtn">Clear cart</button>
              <button type="button" class="btn btn-dark" id="checkoutBtn">Checkout</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);
    return document.getElementById('cartViewModal');
  }

  function renderCart() {
    const items = getItems();
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartTotal');
    if (!container || !totalEl) return;

    container.innerHTML = '';
    let total = 0;
    items.forEach((it, idx) => {
      const priceNum = parseFloat(String(it.price).replace(/[^0-9.]/g, '')) || 0;
      total += priceNum;
      const row = document.createElement('div');
      row.className = 'list-group-item';
      row.innerHTML = `
        <div class="d-flex align-items-center gap-3">
          <img src="${it.img}" alt="${it.name}" style="width:72px;height:72px;object-fit:cover;border-radius:.25rem;">
          <div class="flex-grow-1">
            <div class="fw-semibold">${it.name}</div>
            <div class="text-muted">${it.price}</div>
          </div>
          <button class="btn btn-sm btn-outline-danger" data-remove-index="${idx}">Remove</button>
        </div>`;
      container.appendChild(row);
    });
    totalEl.textContent = `$${total.toFixed(2)}`;
  }

  function wireCartInteractions() {
    const btn = document.getElementById('cart-button');
    if (!btn) return;
    const modalEl = ensureCartModal();

    btn.addEventListener('click', () => {
      renderCart();
      updateBadge();
      if (window.bootstrap && window.bootstrap.Modal) {
        const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    });

    modalEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove-index]');
      if (removeBtn) {
        const idx = parseInt(removeBtn.getAttribute('data-remove-index'), 10);
        const items = getItems();
        if (!isNaN(idx)) items.splice(idx, 1);
        setItems(items);
        renderCart();
        updateBadge();
      }
    });

    modalEl.querySelector('#clearCartBtn').addEventListener('click', () => {
      setItems([]);
      renderCart();
      updateBadge();
    });

    modalEl.querySelector('#checkoutBtn').addEventListener('click', () => {
      alert('Checkout flow coming soon.');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireCartInteractions();
    updateBadge();
  });
})();

// Progressive image optimizations for smoother scroll on heavy pages
(function () {
  function optimizeImages() {
    const imgs = Array.from(document.images || []);
    imgs.forEach((img) => {
      // Skip logo and icons
      if (img.id === 'guitar-pick') return;
      // Add lazy + async decode universally
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      // Deprioritize images far below the fold
      const rect = img.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (rect.top > vh * 1.5 && !img.hasAttribute('fetchpriority')) {
        img.setAttribute('fetchpriority', 'low');
      }
    });

    // Aggressive lazy-load for gallery and below-the-fold sections
    const lazyTargets = document.querySelectorAll('.mini-gallery img, .featured-products img.product-img, .hollow-body img.product-img, .promo-image');
    const transparent = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

    const toObserve = [];
    lazyTargets.forEach((img) => {
      if (img.dataset.src) return; // already processed
      const src = img.getAttribute('src');
      if (!src) return;
      // Move src to data-src so browser doesn't fetch until intersection
      img.dataset.src = src;
      img.setAttribute('src', transparent);
      toObserve.push(img);
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const ds = el.getAttribute('data-src');
            if (ds) el.setAttribute('src', ds);
            el.removeAttribute('data-src');
            obs.unobserve(el);
          }
        });
      }, { rootMargin: '200px 0px' });
      toObserve.forEach((el) => io.observe(el));
    } else {
      // Fallback: just restore src immediately
      toObserve.forEach((el) => {
        const ds = el.getAttribute('data-src');
        if (ds) el.setAttribute('src', ds);
        el.removeAttribute('data-src');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeImages);
  } else {
    optimizeImages();
  }
})();
