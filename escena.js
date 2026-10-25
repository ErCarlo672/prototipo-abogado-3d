// Escena 3D de la portada: balanza dorada que se equilibra con el scroll
import * as THREE from 'three';
import { RoomEnvironment } from './assets/vendor/RoomEnvironment.js';

const seccion = document.getElementById('escena');
const lienzo = document.getElementById('lienzo');
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const movil = matchMedia('(max-width: 760px)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  seccion.classList.add('sin-3d');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, movil ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const escena = new THREE.Scene();
const FONDO = new THREE.Color('#0b0a09');
escena.background = FONDO;
escena.fog = new THREE.Fog(FONDO, 9, 22);

const pmrem = new THREE.PMREMGenerator(renderer);
escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
escena.environmentIntensity = 0.55;

const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 60);

// Luces: clave cálida, contra dorada y relleno muy bajo
const clave = new THREE.SpotLight('#ffe2b8', 120, 30, 0.5, 0.6, 1.6);
clave.position.set(-4, 7, 5);
escena.add(clave, clave.target);
const contra = new THREE.PointLight('#c9a77c', 40, 14, 1.6);
contra.position.set(3, 3.5, -4);
escena.add(contra);
escena.add(new THREE.AmbientLight('#2a2118', 0.6));

// Materiales
const oro = new THREE.MeshPhysicalMaterial({ color: '#d9b26f', metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2 });
const oroMate = new THREE.MeshPhysicalMaterial({ color: '#b8915a', metalness: 1, roughness: 0.42 });
const piedra = new THREE.MeshPhysicalMaterial({ color: '#141110', metalness: 0.1, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15 });

// Balanza
const balanza = new THREE.Group();
escena.add(balanza);

const perfil = (puntos) => new THREE.LatheGeometry(puntos.map(([x, y]) => new THREE.Vector2(x, y)), 96);

const base = new THREE.Mesh(perfil([[0, 0], [1.25, 0], [1.25, 0.12], [1.05, 0.2], [1.0, 0.34], [0.62, 0.42], [0.5, 0.56], [0, 0.56]]), piedra);
balanza.add(base);
const anillo = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.025, 16, 128), oro);
anillo.rotation.x = Math.PI / 2;
anillo.position.y = 0.34;
balanza.add(anillo);

const columna = new THREE.Mesh(perfil([[0.2, 0], [0.13, 0.2], [0.09, 0.5], [0.075, 2.6], [0.11, 2.75], [0.08, 2.85], [0, 2.85]]), oro);
columna.position.y = 0.56;
balanza.add(columna);

const PIVOTE_Y = 3.45;
const remate = new THREE.Mesh(new THREE.SphereGeometry(0.13, 48, 32), oro);
remate.position.y = PIVOTE_Y + 0.22;
balanza.add(remate);
const punta = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 32), oro);
punta.position.y = PIVOTE_Y + 0.46;
balanza.add(punta);

// Brazo que bascula
const brazo = new THREE.Group();
brazo.position.y = PIVOTE_Y;
balanza.add(brazo);
const LARGO = 1.7;
const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, LARGO * 2, 32), oro);
barra.rotation.z = Math.PI / 2;
brazo.add(barra);
const eje = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 16, 64), oro);
brazo.add(eje);

const platos = [];
const CADENA = 1.55;
for (const lado of [-1, 1]) {
  const extremo = new THREE.Mesh(new THREE.SphereGeometry(0.065, 32, 16), oro);
  extremo.position.x = lado * LARGO;
  brazo.add(extremo);

  // El plato cuelga siempre vertical: se compensa el giro del brazo
  const colgante = new THREE.Group();
  colgante.position.x = lado * LARGO;
  brazo.add(colgante);

  const plato = new THREE.Mesh(perfil([[0, -CADENA - 0.12], [0.45, -CADENA - 0.1], [0.68, -CADENA + 0.02], [0.7, -CADENA + 0.04], [0.66, -CADENA + 0.03], [0.44, -CADENA - 0.07], [0, -CADENA - 0.09]]), oro);
  colgante.add(plato);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const fin = new THREE.Vector3(Math.cos(a) * 0.66, -CADENA + 0.04, Math.sin(a) * 0.66);
    const largo = fin.length();
    const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, largo, 6), oroMate);
    hilo.position.copy(fin).multiplyScalar(0.5);
    hilo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fin.clone().normalize());
    colgante.add(hilo);
  }
  platos.push(colgante);
}

// Suelo pulido que recoge reflejos suaves
const suelo = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshPhysicalMaterial({ color: '#0a0908', metalness: 0.2, roughness: 0.7, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.12 }));
suelo.rotation.x = -Math.PI / 2;
escena.add(suelo);

// Halo dorado detrás de la balanza
const halo = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uFuerza: { value: 0.0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float uFuerza; void main(){ float d = distance(vUv, vec2(0.5)); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vec3(0.79,0.6,0.38) * a * a * uFuerza, 1.0); }'
  })
);
halo.position.set(0, 2.4, -3.5);
escena.add(halo);

// Estelas de luz que fluyen alrededor, como seda dorada
const estelas = [];
const materialEstela = (fase) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uTiempo: { value: 0 }, uFase: { value: fase }, uOpacidad: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `varying vec2 vUv; uniform float uTiempo; uniform float uFase; uniform float uOpacidad;
    void main(){
      float borde = pow(sin(vUv.x * 3.14159), 1.5) * pow(sin(vUv.y * 3.14159), 2.0);
      float flujo = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(vUv.x * 14.0 - uTiempo * 1.6 + uFase), 3.0);
      vec3 color = mix(vec3(0.55,0.36,0.16), vec3(1.0,0.86,0.6), flujo);
      gl_FragColor = vec4(color * borde * flujo * uOpacidad, 1.0);
    }`
});
for (let i = 0; i < 3; i++) {
  const puntos = [];
  for (let j = 0; j <= 8; j++) {
    const t = j / 8;
    const a = t * Math.PI * 1.6 + i * 2.1;
    puntos.push(new THREE.Vector3(Math.cos(a) * (2.6 + i * 0.5), 0.5 + t * 3.2 + Math.sin(t * 6 + i) * 0.35, Math.sin(a) * (2.6 + i * 0.5) - 0.4));
  }
  const curva = new THREE.CatmullRomCurve3(puntos);
  // Cinta plana: dos filas de vértices a lo largo de la curva
  const N = 160, ancho = 0.16 + i * 0.05;
  const pos = new Float32Array((N + 1) * 2 * 3), uv = new Float32Array((N + 1) * 2 * 2), idx = [];
  for (let k = 0; k <= N; k++) {
    const p = curva.getPointAt(k / N);
    const tan = curva.getTangentAt(k / N);
    const lat = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(ancho * (0.4 + Math.sin(k / N * Math.PI)));
    const giro = new THREE.Vector3(0, ancho * Math.cos(k / N * 9 + i), 0);
    const arriba = p.clone().add(lat).add(giro), abajo = p.clone().sub(lat).sub(giro);
    pos.set([arriba.x, arriba.y, arriba.z, abajo.x, abajo.y, abajo.z], k * 6);
    uv.set([k / N, 1, k / N, 0], k * 4);
    if (k < N) { const b = k * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  const malla = new THREE.Mesh(g, materialEstela(i * 2.0));
  escena.add(malla);
  estelas.push(malla);
}

// Polvo de oro flotando
const PARTICULAS = movil ? 450 : 900;
const posiciones = new Float32Array(PARTICULAS * 3);
const semillas = new Float32Array(PARTICULAS);
for (let i = 0; i < PARTICULAS; i++) {
  const r = 1 + Math.random() * 7, a = Math.random() * Math.PI * 2;
  posiciones.set([Math.cos(a) * r, Math.random() * 6, Math.sin(a) * r - 1], i * 3);
  semillas[i] = Math.random();
}
const geoPolvo = new THREE.BufferGeometry();
geoPolvo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
geoPolvo.setAttribute('aSemilla', new THREE.BufferAttribute(semillas, 1));
const polvo = new THREE.Points(geoPolvo, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTiempo: { value: 0 }, uEscala: { value: renderer.getPixelRatio() }, uOpacidad: { value: 1 } },
  vertexShader: `attribute float aSemilla; uniform float uTiempo; uniform float uEscala; varying float vBrillo;
    void main(){
      vec3 p = position;
      p.y = mod(p.y + uTiempo * (0.05 + aSemilla * 0.12), 6.0);
      p.x += sin(uTiempo * 0.3 + aSemilla * 20.0) * 0.25;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (6.0 + aSemilla * 14.0) * uEscala / -mv.z;
      vBrillo = 0.4 + 0.6 * sin(uTiempo * (1.0 + aSemilla * 2.0) + aSemilla * 40.0);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `varying float vBrillo; uniform float uOpacidad;
    void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * a * vBrillo * 0.8 * uOpacidad, 1.0); }`
}));
escena.add(polvo);

// Guion de cámara: cada parada es [progreso, posición, a dónde mira]
const desplaza = movil ? 0 : 1.15;
const paradas = [
  [0.00, [0.9, 2.6, 3.4], [0, 3.35, 0]],
  [0.30, [3.6, 2.4, 5.6], [0, 2.6, 0]],
  [0.62, [-3.4, 3.4, 7.2], [0, 2.3, 0]],
  movil ? [1.00, [0, 2.6, 14], [0, -1.6, 0]] : [1.00, [-desplaza - 0.2, 2.7, 9.8], [-desplaza, 2.25, 0]]
];
const suave = (t) => t * t * (3 - 2 * t);
const tramo = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const vA = new THREE.Vector3(), vB = new THREE.Vector3(), mira = new THREE.Vector3();
function colocaCamara(p) {
  let i = 0;
  while (i < paradas.length - 2 && p > paradas[i + 1][0]) i++;
  const [p0, c0, m0] = paradas[i], [p1, c1, m1] = paradas[i + 1];
  const t = suave(tramo(p, p0, p1));
  camara.position.lerpVectors(vA.fromArray(c0), vB.fromArray(c1), t);
  mira.lerpVectors(vA.fromArray(m0), vB.fromArray(m1), t);
}

// Textos que acompañan al scroll
const frases = [...seccion.querySelectorAll('[data-desde]')];
const pista = seccion.querySelector('.escena__pista');

let objetivo = 0, actual = reducido ? 1 : 0;
let ratonX = 0, ratonY = 0, rx = 0, ry = 0;
const reloj = new THREE.Clock();

function leeScroll() {
  const r = seccion.getBoundingClientRect();
  const total = r.height - innerHeight;
  objetivo = reducido ? 1 : Math.min(1, Math.max(0, -r.top / total));
}
addEventListener('scroll', leeScroll, { passive: true });
addEventListener('pointermove', (e) => {
  ratonX = (e.clientX / innerWidth) * 2 - 1;
  ratonY = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

function ajusta() {
  const w = lienzo.clientWidth, h = lienzo.clientHeight;
  renderer.setSize(w, h, false);
  camara.aspect = w / h;
  camara.fov = w / h < 0.8 ? 50 : 35;
  camara.updateProjectionMatrix();
}
addEventListener('resize', ajusta);
ajusta();
leeScroll();

let visible = true;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(seccion);

function pinta() {
  requestAnimationFrame(pinta);
  if (!visible) return;
  const t = reloj.getElapsedTime();
  actual += (objetivo - actual) * 0.08;
  const p = actual;

  colocaCamara(p);
  rx += (ratonX - rx) * 0.04;
  ry += (ratonY - ry) * 0.04;
  camara.position.x += rx * 0.35;
  camara.position.y -= ry * 0.2;
  camara.lookAt(mira);

  // La balanza empieza vencida y se equilibra entre el 35 % y el 78 % del recorrido
  const equilibrio = suave(tramo(p, 0.35, 0.78));
  const inclinacion = 0.32 * (1 - equilibrio) + Math.sin(t * 1.3) * 0.012 * (1 - equilibrio * 0.6);
  brazo.rotation.z = inclinacion;
  platos.forEach((pl) => { pl.rotation.z = -inclinacion; pl.rotation.x = Math.sin(t * 0.9 + pl.position.x) * 0.02; });
  balanza.rotation.y = -0.5 + p * 0.5 + Math.sin(t * 0.25) * 0.03;

  halo.material.uniforms.uFuerza.value = 0.18 + equilibrio * 0.5;
  estelas.forEach((e, i) => {
    e.material.uniforms.uTiempo.value = t;
    e.material.uniforms.uOpacidad.value = 0.35 + suave(tramo(p, 0.1, 0.5)) * 0.65;
    e.rotation.y = t * 0.04 * (i % 2 ? -1 : 1) + p * 0.8;
  });
  polvo.material.uniforms.uTiempo.value = t;
  clave.intensity = 90 + equilibrio * 60;

  renderer.render(escena, camara);

  frases.forEach((f) => {
    const a = +f.dataset.desde, b = +f.dataset.hasta;
    const entra = a === 0 ? 1 : tramo(p, a, a + 0.06), sale = b >= 1 ? 0 : tramo(p, b - 0.06, b);
    const o = entra * (1 - sale);
    f.style.opacity = o.toFixed(3);
    f.style.transform = `translate3d(0, ${((1 - entra) * 30 - sale * 30).toFixed(1)}px, 0) rotateX(${((1 - entra) * 25).toFixed(1)}deg)`;
    f.classList.toggle('is-activa', o > 0.5);
  });
  if (pista) pista.style.opacity = (1 - tramo(p, 0.02, 0.1)).toFixed(3);
}
seccion.classList.add('con-3d');
// Para revisar un momento concreto desde la consola: escenaEn(0.5)
window.escenaEn = (v) => { objetivo = actual = v; };
pinta();
