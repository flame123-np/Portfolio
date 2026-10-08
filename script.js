document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.getElementById('site-header');
const progress = document.querySelector('.scroll-progress');
const toTop = document.querySelector('.to-top');
const portrait = document.querySelector('.hero-portrait img');

// ---------- Staggered scroll reveal ----------

document.querySelectorAll('[data-stagger]').forEach((group) => {
  group.querySelectorAll(':scope > [data-reveal]').forEach((el, i) => {
    el.style.setProperty('--i', i);
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      // drop the stagger delay afterwards so hover effects respond instantly
      el.addEventListener('transitionend', () => el.classList.add('is-done'), { once: true });
      revealObserver.unobserve(el);
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

// timeline line draws itself when it scrolls into view
const timelineObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-drawn');
      timelineObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.timeline').forEach((el) => timelineObserver.observe(el));

// ---------- Header state, progress bar, back-to-top, portrait parallax ----------

let ticking = false;

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;

  header.classList.toggle('is-scrolled', y > 8);
  toTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
  progress.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1) : 0);

  if (portrait && !reduceMotion && y < window.innerHeight) {
    portrait.style.setProperty('--parallax', `${y * 0.12}px`);
  }

  ticking = false;
}

window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  },
  { passive: true }
);
onScroll();

// ---------- Active nav link ----------

const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);

const inView = new Set();

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) inView.add(entry.target.id);
      else inView.delete(entry.target.id);
    });
    // highlight the section crossing the middle of the screen; none while in the hero
    const current = sections.find((section) => inView.has(section.id));
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', Boolean(current) && link.getAttribute('href') === `#${current.id}`);
    });
  },
  { rootMargin: '-45% 0px -50% 0px' }
);

sections.forEach((section) => spyObserver.observe(section));

// ---------- Mobile menu ----------

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');

function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  nav.classList.toggle('is-open', open);
}

menuToggle.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    setMenu(false);
    menuToggle.focus();
  }
});

// ---------- Certificate carousel ----------

document.querySelectorAll('.cert-carousel').forEach((carousel) => {
  const track = carousel.querySelector('.cert-track');
  const slides = [...track.children];
  const prev = carousel.querySelector('[data-dir="-1"]');
  const next = carousel.querySelector('[data-dir="1"]');
  const count = carousel.querySelector('.cert-count');
  const bar = carousel.querySelector('.cert-progress');

  function update() {
    const max = track.scrollWidth - track.clientWidth;
    const x = track.scrollLeft;
    prev.disabled = x <= 2;
    next.disabled = x >= max - 2;

    const slideW = slides[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const first = Math.round(x / (slideW + gap)) + 1;
    const visible = Math.max(1, Math.floor((track.clientWidth + gap) / (slideW + gap)));
    const last = Math.min(slides.length, first + visible - 1);
    count.textContent = `${first === last ? first : `${first}–${last}`} of ${slides.length} certificates`;

    const thumb = Math.min(100, (track.clientWidth / track.scrollWidth) * 100);
    bar.style.setProperty('--thumb', `${thumb}%`);
    bar.style.setProperty('--offset', max > 0 ? `${(x / max) * ((100 - thumb) / thumb) * 100}%` : '0%');
  }

  [prev, next].forEach((btn) => {
    btn.addEventListener('click', () => {
      const slideW = slides[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = Math.max(1, Math.floor((track.clientWidth + gap) / (slideW + gap))) * (slideW + gap);
      track.scrollBy({ left: step * Number(btn.dataset.dir), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  track.addEventListener('scroll', () => window.requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  update();
});
