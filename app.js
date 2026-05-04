// =======================
// FAKE ROUTING + LANG SAFE
// =======================

document.querySelectorAll('[data-link]').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();

    let page = this.getAttribute('href').replace('.html', '');

    // zapamiętaj język (dla pewności)
    const lang = localStorage.getItem('lang');

    // URL bez .html
    history.pushState({}, '', page);

    // przejście
    window.location.href =
      (page === 'index' || page === '' ? 'index' : page) + '.html';
  });
});

// BACK / FORWARD
window.addEventListener('popstate', () => {
  let path = window.location.pathname.replace('/', '');

  if (path === '' || path === 'index') {
    window.location.href = 'index.html';
  } else {
    window.location.href = path + '.html';
  }
});

// =======================
// MENU (MOBILE)
// =======================
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle?.addEventListener('click', () => {
  navLinks?.classList.toggle('active');
});


// =======================
// THEME (DARK / LIGHT)
// =======================
const html = document.documentElement;
const themeBtn = document.querySelector('.theme-toggle');

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  html.setAttribute('data-theme', savedTheme);
}

themeBtn?.addEventListener('click', () => {
  const newTheme =
    html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});


// =======================
// LANGUAGE (PL / EN)
// =======================
const langBtn = document.querySelector('.lang-toggle');
let lang = localStorage.getItem('lang') || 'pl';

function applyLang() {
  document.querySelectorAll('[data-pl]').forEach(el => {
    const value = el.dataset[lang] || el.dataset.pl || '';
    el.textContent = value;
  });

  if (langBtn) {
    langBtn.textContent = lang === 'pl' ? 'EN' : 'PL';
  }

  document.documentElement.lang = lang;
}

applyLang();

langBtn?.addEventListener('click', () => {
  lang = lang === 'pl' ? 'en' : 'pl';
  localStorage.setItem('lang', lang);
  applyLang();
});


// =======================
// LIGHTBOX (GALLERY)
// =======================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.getElementById('close');

let currentIndex = 0;
const images = Array.from(document.querySelectorAll('.art img'));

function openLightbox(index) {
  if (!lightbox || !lightboxImg) return;

  currentIndex = index;
  lightbox.style.display = 'flex';
  lightboxImg.src = images[currentIndex].dataset.full;
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.style.display = 'none';
}

function nextImage() {
  currentIndex = (currentIndex + 1) % images.length;
  lightboxImg.src = images[currentIndex].dataset.full;
}

function prevImage() {
  currentIndex =
    (currentIndex - 1 + images.length) % images.length;
  lightboxImg.src = images[currentIndex].dataset.full;
}

// klik na obraz
images.forEach((img, index) => {
  img.addEventListener('click', () => openLightbox(index));
});

// zamknięcie X
closeBtn?.addEventListener('click', closeLightbox);

// klik w tło
lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// klawiatura
document.addEventListener('keydown', (e) => {
  if (!lightbox || lightbox.style.display !== 'flex') return;

  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextImage();
  if (e.key === 'ArrowLeft') prevImage();
});


// =======================
// SWIPE (MOBILE)
// =======================
let startX = 0;

lightboxImg?.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

lightboxImg?.addEventListener('touchend', (e) => {
  const endX = e.changedTouches[0].clientX;

  if (endX - startX > 50) prevImage();
  if (startX - endX > 50) nextImage();
});


// =======================
// FORM (CONTACT)
// =======================
const form = document.getElementById('form');
const success = document.getElementById('successMsg');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      form.reset();
      if (success) success.style.display = 'block';
    }
  } catch (err) {
    console.error('Form error:', err);
  }
});

// =======================
// MINI SLIDER (FADE)
// =======================
const sliderImages = document.querySelectorAll('.mini-slider img');
let currentSlide = 0;

function changeSlide() {
  sliderImages[currentSlide].classList.remove('active');

  currentSlide = (currentSlide + 1) % sliderImages.length;

  sliderImages[currentSlide].classList.add('active');
}

// start
if (sliderImages.length > 0) {
  sliderImages[0].classList.add('active');

  setInterval(changeSlide, 3500);
}

// klik → lightbox
sliderImages.forEach((img, index) => {
  img.addEventListener('click', () => {
    if (typeof openLightbox === 'function') {
      openLightbox(index);
    }
  });
});