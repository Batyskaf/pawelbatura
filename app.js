// =======================
// NAVIGATION
// =======================
document.querySelectorAll('[data-link]').forEach(link => {
  link.addEventListener('click', function (e) {
    const href = this.getAttribute('href');

    if (!href || href.startsWith('http')) return;

    e.preventDefault();

    const page = href.replace('.html', '').replace('./', '') || 'index';
    history.pushState({}, '', page === 'index' ? 'index' : page);
    window.location.href = `${page}.html`;
  });
});

window.addEventListener('popstate', () => {
  const path = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  window.location.href = `${path}.html`;
});

function markActiveNav() {
  const current = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

  document.querySelectorAll('.nav-links a').forEach(link => {
    const target = link.getAttribute('href').replace('.html', '');
    link.classList.toggle('active', target === current);
  });
}

markActiveNav();

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
  const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

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
  if (!lightbox || !lightboxImg || images.length === 0) return;

  currentIndex = index;
  lightbox.style.display = 'flex';
  lightboxImg.src = images[currentIndex].dataset.full;
  lightboxImg.alt = images[currentIndex].alt || '';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.style.display = 'none';
}

function showImage(index) {
  if (!lightboxImg || images.length === 0) return;

  currentIndex = (index + images.length) % images.length;
  lightboxImg.src = images[currentIndex].dataset.full;
  lightboxImg.alt = images[currentIndex].alt || '';
}

images.forEach((img, index) => {
  img.addEventListener('click', () => openLightbox(index));
});

closeBtn?.addEventListener('click', closeLightbox);

lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox || lightbox.style.display !== 'flex') return;

  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
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

  if (endX - startX > 50) showImage(currentIndex - 1);
  if (startX - endX > 50) showImage(currentIndex + 1);
});

// =======================
// FORM (CONTACT)
// =======================
const form = document.getElementById('form');
const success = document.getElementById('successMsg');
const errorMsg = document.getElementById('errorMsg');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  success.style.display = 'none';
  errorMsg.style.display = 'none';

  const data = new FormData(form);

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      form.reset();
      success.style.display = 'block';
    } else {
      errorMsg.style.display = 'block';
    }
  } catch (err) {
    errorMsg.style.display = 'block';
  }
});

// =======================
// MINI SLIDER (FADE)
// =======================
const sliderImages = document.querySelectorAll('.mini-slider img');
let currentSlide = 0;

function changeSlide() {
  if (sliderImages.length === 0) return;

  sliderImages[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % sliderImages.length;
  sliderImages[currentSlide].classList.add('active');
}

if (sliderImages.length > 0) {
  sliderImages[0].classList.add('active');
  setInterval(changeSlide, 3500);
}
