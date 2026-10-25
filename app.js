// Scroll suave, títulos en 3D, tarjetas que se inclinan, parallax, contadores y cinta de opiniones
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const punteroFino = matchMedia('(pointer: fine)').matches;

// Scroll suave tipo Apple (solo con ratón o trackpad, el móvil conserva su scroll nativo)
let lenis = null;
if (!reducido && window.Lenis) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  const bucle = (t) => { lenis.raf(t); requestAnimationFrame(bucle); };
  requestAnimationFrame(bucle);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const destino = document.querySelector(a.getAttribute('href'));
      if (!destino) return;
      e.preventDefault();
      lenis.scrollTo(destino, { offset: -70 });
    });
  });
}

const nav = document.getElementById('nav');
const fijarNav = () => nav.classList.toggle('is-fija', window.scrollY > 40);
fijarNav();
window.addEventListener('scroll', fijarNav, { passive: true });

// Títulos: cada palabra entra girando sobre su base
document.querySelectorAll('.cabecera h2, .sobre__texto h2, .preguntas__lado h2, .contacto__caja h2').forEach((h) => {
  const palabras = h.textContent.trim().split(/\s+/);
  h.textContent = '';
  palabras.forEach((p, i) => {
    const s = document.createElement('span');
    s.className = 'palabra';
    s.style.setProperty('--i', i);
    s.textContent = p;
    h.append(s, ' ');
  });
  h.classList.add('titulo-3d');
});

// Contadores de las cifras
const cuenta = (el) => {
  const fin = +el.dataset.cuenta, sufijo = el.dataset.sufijo || '';
  if (reducido) { el.textContent = fin + sufijo; return; }
  const inicio = performance.now(), dura = 1600;
  const paso = (t) => {
    const k = Math.min(1, (t - inicio) / dura);
    el.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3))) + sufijo;
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
};

const observados = document.querySelectorAll('.aparece, .titulo-3d, [data-cuenta]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      if (e.target.dataset.cuenta) cuenta(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  observados.forEach((el) => io.observe(el));
} else {
  observados.forEach((el) => el.classList.add('is-visible'));
}

// Texto de la intro que se "lee" palabra a palabra al bajar
const intro = document.querySelector('.intro p');
let palabrasIntro = [];
if (intro) {
  const palabras = intro.textContent.trim().split(/\s+/);
  intro.textContent = '';
  palabrasIntro = palabras.map((p) => {
    const s = document.createElement('span');
    s.textContent = p + ' ';
    intro.append(s);
    return s;
  });
}

// Inclinación 3D con el ratón (tarjetas, foto y caja de contacto)
if (punteroFino && !reducido) {
  document.querySelectorAll('[data-inclina]').forEach((el) => {
    const fuerza = el.dataset.inclina === 'suave' ? 3 : 8;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transition = 'transform .1s linear';
      el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * fuerza).toFixed(2)}deg) rotateY(${((x - 0.5) * fuerza).toFixed(2)}deg) translateZ(0)`;
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)';
      el.style.transform = '';
    });
  });
}

// Parallax ligado al scroll
const fondoIntro = document.querySelector('.intro__fondo');
const fotoSobre = document.querySelector('.sobre__foto');
const marcoSobre = document.querySelector('.sobre__marco');
const progresoEn = (el) => {
  const r = el.getBoundingClientRect();
  return Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
};
let pendiente = false;
function alScroll() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => {
    pendiente = false;
    if (reducido) return;
    if (fondoIntro) fondoIntro.style.transform = `translate3d(0, ${((progresoEn(fondoIntro.parentElement) - 0.5) * -120).toFixed(1)}px, 0) scale(1.05)`;
    if (fotoSobre) {
      const p = progresoEn(marcoSobre);
      fotoSobre.style.transform = `translate3d(0, ${((p - 0.5) * -60).toFixed(1)}px, 0)`;
      if (!marcoSobre.matches(':hover')) marcoSobre.style.transform = `perspective(1200px) rotateY(${((0.5 - p) * 16).toFixed(2)}deg)`;
    }
    if (palabrasIntro.length) {
      const r = intro.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
      const hasta = Math.round(k * palabrasIntro.length);
      palabrasIntro.forEach((s, i) => s.classList.toggle('is-leida', i < hasta));
    }
  });
}
window.addEventListener('scroll', alScroll, { passive: true });
alScroll();

// Duplica las opiniones para que la cinta enlace sin salto
const pista = document.querySelector('.cinta__pista');
if (pista && !reducido) {
  [...pista.children].forEach((li) => {
    const copia = li.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    pista.appendChild(copia);
  });
}
