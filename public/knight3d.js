// 3D SECRA for the main page: Mixamo animations, a glowing visor face (blink + voice line synced to speech),
// and Talking-Tom-style reactions: poke head / body / legs,
// poke many times → he falls and gets up, rub him → he laughs (tickle).
// Usage (from index.html): const k = await createKnight(hostEl, { onReact });
//   k.mode('idle'|'wave'|'listen'|'think'|'talk')   k.talking(true|false)   k.emote('laugh')
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ROOT = new URL('./3d/', import.meta.url).href;
const MODEL_VER = 'e1a9e1a115';   // change when a model file changes, so browsers don't keep an old cached copy
const DBG = new URLSearchParams(location.search);
const num = (k, v) => (DBG.has(k) ? +DBG.get(k) : v);

// ---- tuning (world units, SECRA is scaled to ~1.67 tall, faces +Z) ----
const MODEL_SCALE = 1.88;   // the Meshy/Mixamo model is ~0.89 tall → ~1.67 on stage
// glowing visor face: eyes + voice line drawn on a curved patch over the dark visor
const FACE = { w: num('fw', 0.2), y: num('fy', 0.12), z: num('fz', 0.12), cx: num('cx', 6), cy: num('cy', 4) };
// chibi body is wide: push the upper arms away from the torso in every animation (like Mixamo's "arm space")
const ARM_OUT = num('arm', 0) * Math.PI / 180, ARM_AXIS = DBG.get('armax') || 'x';

export async function createKnight(host, { onReact = () => {} } = {}) {
  // ---------- renderer ----------
  const canvas = document.createElement('canvas');
  canvas.className = 'k3d';
  Object.assign(canvas.style, { position: 'absolute', left: '-60%', width: '220%', top: '-30%', height: '130%', pointerEvents: 'none', opacity: '0', transition: 'opacity .4s' });
  host.appendChild(canvas);
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: DBG.has('shot') });
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = num('exp', 1.0);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  const S = new THREE.Scene();
  S.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture;
  // lit like the promo video: soft cool fill, a key from the front-right, strong cyan rims on both sides of the silhouette
  S.add(new THREE.HemisphereLight(0xd6e6ff, 0x101c40, num('hemi', 0.75)));
  const key = new THREE.DirectionalLight(0xf4f8ff, num('key', 1.9)); key.position.set(1.2, 3, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 2.2, bottom: -0.6 }); S.add(key);
  const rim = new THREE.DirectionalLight(0x7fe0ff, num('rim', 3.2)); rim.position.set(-2.2, 1.8, -2); S.add(rim);
  const rim2 = new THREE.DirectionalLight(0x9fc8ff, num('rim', 3.2) * 0.8); rim2.position.set(2.2, 1.6, -2); S.add(rim2);
  const fill = new THREE.DirectionalLight(0x8fb8ff, 0.5); fill.position.set(-1.5, 0.4, 2.5); S.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.ShadowMaterial({ opacity: 0.32 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; S.add(floor);
  const C = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  C.position.set(0, 0.9, 10); C.lookAt(0, 0.9, 0);

  function layout() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight, hh = host.clientHeight;
    if (!cw || !ch || !hh) return;
    R.setSize(cw, ch, false);
    const upp = 1.67 / (0.93 * hh);                // world units per CSS pixel: knight fills ~93% of the box
    const bottom = -0.025 * hh * upp;              // feet sit 2.5% above the box bottom
    C.left = -cw * upp / 2; C.right = cw * upp / 2; C.bottom = bottom - 0.9; C.top = bottom + ch * upp - 0.9;
    C.updateProjectionMatrix();
  }
  new ResizeObserver(layout).observe(host); addEventListener('resize', layout);

  // ---------- load ----------
  const L = new GLTFLoader();
  const K = await L.loadAsync(ROOT + 'models/secra.glb?v=' + MODEL_VER);
  const knight = K.scene; knight.scale.setScalar(MODEL_SCALE); S.add(knight);
  const bone = n => { let b = null; knight.traverse(o => { if (o.name === n) b = o; }); return b; };
  let body = null;
  knight.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.material) { o.material.envMapIntensity = num('env', 1.0); glowStripes(o.material); } } });
  knight.traverse(o => { if (o.isSkinnedMesh) { body = o; o.frustumCulled = false; } });

  // ---------- animation ----------
  const mixer = new THREE.AnimationMixer(knight);
  const clips = Object.fromEntries(K.animations.map(c => [c.name, c]));
  const act = n => mixer.clipAction(clips[n]);
  const TALKS = ['Talking_1', 'Talking_2', 'Talking_3'].filter(n => clips[n]);
  // Idle_1: head up, looks at the visitor. Try another with ?idle=Breathing_Idle or ?idle=Idle
  const IDLE = clips[DBG.get('idle')] ? DBG.get('idle') : clips['Idle_1'] ? 'Idle_1' : clips['Breathing_Idle'] ? 'Breathing_Idle' : 'Idle';

  // weapons: placed in world space on the first idle frame, then they follow their bones
  act('Idle').play(); mixer.setTime(0); knight.updateMatrixWorld(true);

  const armL = bone('mixamorigLeftArm'), armR = bone('mixamorigRightArm');
  const ax = new THREE.Vector3(ARM_AXIS === 'x' ? 1 : 0, ARM_AXIS === 'y' ? 1 : 0, ARM_AXIS === 'z' ? 1 : 0);
  // Old Mixamo clips keep the arms inside the chibi body: push them out. The newer idles (arm space fixed in Mixamo) need no push.
  const NO_SPREAD = new Set(['Idle_1', 'Breathing_Idle']);
  let spreadK = 1, spread = false; const qL = new THREE.Quaternion(), qR = new THREE.Quaternion(), qLi = new THREE.Quaternion(), qRi = new THREE.Quaternion();
  const setK = k => { qL.setFromAxisAngle(ax, ARM_OUT * k); qR.setFromAxisAngle(ax, -ARM_OUT * k); qLi.copy(qL).invert(); qRi.copy(qR).invert(); };
  setK(spreadK);
  // the mixer skips bones whose value did not change, so the offset is removed before each update and re-added after
  function spreadArms() { if (spread) return; spread = true; if (armL) armL.quaternion.multiply(qL); if (armR) armR.quaternion.multiply(qR); }
  function unspreadArms() { if (!spread) return; spread = false; if (armL) armL.quaternion.multiply(qLi); if (armR) armR.quaternion.multiply(qRi); }
  function stepSpread(dt) { const target = NO_SPREAD.has(curName) ? 0 : 1; if (spreadK !== target) { spreadK += Math.sign(target - spreadK) * Math.min(Math.abs(target - spreadK), dt * 3); setK(spreadK); } }
  spreadArms(); knight.updateMatrixWorld(true);
  unspreadArms(); act('Idle').stop();
  let cur = null, curName = '';
  function play(name, { loop = true, fade = 0.3, from = 0, speed = 1 } = {}) {
    const a = act(name); if (!a) return null;
    a.reset(); a.time = from; a.setEffectiveTimeScale(speed); a.setEffectiveWeight(1);
    a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = !loop;
    a.play();
    if (cur && cur !== a) a.crossFadeFrom(cur, fade, false);
    cur = a; curName = name; return a;
  }

  // ---------- state ----------
  let mode = 'idle', talkingNow = false, overlay = null, baseName = '', lastNod = performance.now();
  const timers = new Set();
  const later = (ms, fn) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const wantedBase = () => talkingNow ? 'talk' : mode === 'think' ? 'Thinking' : mode === 'wave' ? 'Waving' : IDLE;
  function applyBase(force) {
    if (overlay) return;
    const w = wantedBase();
    if (!force && w === baseName) return;
    baseName = w;
    if (w === 'talk') play(pick(TALKS, curName), { loop: false, fade: 0.35 });
    else play(w, { fade: w === 'Waving' ? 0.2 : 0.4 });
  }
  mixer.addEventListener('finished', e => {
    if (overlay && overlay.onDone && e.action === cur) return overlay.onDone();
    if (overlay) return;
    if (baseName === 'talk' && e.action === cur) play(pick(TALKS, curName), { loop: false, fade: 0.35 });
    if (curName === 'Head_Nod_Yes' && e.action === cur) { baseName = ''; applyBase(true); }
  });

  // overlays: reactions that temporarily take over the body
  function endOverlay() { overlay = null; face.set('open', 'closed'); baseName = ''; applyBase(true); }
  function partial(name, secs, fx) {
    overlay = { name }; play(name, { loop: false, fade: 0.08 });
    if (fx) face.set(...fx);
    later(secs * 1000, () => { if (overlay && overlay.name === name) endOverlay(); });
  }
  function sequence(steps) {           // [{clip, hold?, eyes, mouth}] played one after another
    let i = 0;
    const next = () => {
      if (i >= steps.length) return endOverlay();
      const s = steps[i++];
      face.set(s.eyes || 'open', s.mouth || 'closed');
      if (s.clip) {
        overlay = { name: s.clip, onDone: s.hold ? null : next };
        play(s.clip, { loop: !!s.loopFor, fade: s.fade ?? 0.15, speed: s.speed || 1 });
        if (s.hold || s.loopFor) later((s.hold || s.loopFor) * 1000, next);
      } else later((s.wait || 0.5) * 1000, next);
    };
    next();
  }

  // ---------- face (eyes + mouth drawn on a curved patch fixed to the head bone) ----------
  const face = makeFace();
  const head = bone('mixamorigHead');
  if (head) {
    act('Idle').play(); mixer.setTime(0); knight.updateMatrixWorld(true);
    const geo = new THREE.PlaneGeometry(FACE.w, FACE.w * 0.6, 30, 18), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -x * x * FACE.cx - y * y * FACE.cy); }
    const patch = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: face.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    const hp = head.getWorldPosition(new THREE.Vector3());
    patch.position.set(0, hp.y + FACE.y, hp.z + FACE.z); patch.renderOrder = 2;
    if (body) {   // sit the eyes right on the visor surface
      const rc = new THREE.Raycaster(new THREE.Vector3(hp.x, patch.position.y, hp.z + 5), new THREE.Vector3(0, 0, -1));
      const hit = rc.intersectObject(body, false)[0]; if (hit) patch.position.z = hit.point.z + 0.006;
    }
    S.add(patch); patch.updateMatrixWorld(true); head.attach(patch);
    act('Idle').stop();
  }

  // ---------- touch: poke zones, tickle, fall after many pokes ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, C);
    const h = body && ray.intersectObject(body, false)[0];
    return h ? h.point : null;
  }
  const zoneOf = p => {
    const hy = head.getWorldPosition(new THREE.Vector3()).y, hips = bone('mixamorigHips').getWorldPosition(new THREE.Vector3()).y;
    return p.y > hy - 0.12 ? 'head' : p.y > hips - 0.12 ? 'body' : 'legs';
  };
  let pokes = [], down = null, rub = 0, lastPt = null, lastTickle = 0;
  host.style.touchAction = 'none';
  host.addEventListener('pointerdown', ev => {
    const p = hit(ev); if (!p) return;
    down = { t: performance.now(), x: ev.clientX, y: ev.clientY }; rub = 0; lastPt = [ev.clientX, ev.clientY];
    try { host.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  host.addEventListener('pointermove', ev => {
    if (!down) return;
    rub += Math.hypot(ev.clientX - lastPt[0], ev.clientY - lastPt[1]); lastPt = [ev.clientX, ev.clientY];
    if (rub > host.clientHeight * 0.45 && performance.now() - lastTickle > 3500 && !busy()) {
      lastTickle = performance.now(); down = null; tickle();
    }
  });
  host.addEventListener('pointerup', ev => {
    if (!down) return; const moved = rub; down = null;
    if (moved > host.clientHeight * 0.06) return;          // it was a rub, not a tap
    const p = hit(ev); if (!p) return;
    poke(zoneOf(p));
  });
  host.addEventListener('pointercancel', () => { down = null; });
  const busy = () => overlay && /Fall|Getting_Up|Dizzy|Death/.test(overlay.name);

  function poke(zone) {
    if (busy()) return;
    const now = performance.now(); pokes = pokes.filter(t => now - t < 3000); pokes.push(now);
    if (pokes.length >= 5) { pokes = []; return fall(); }
    if (pokes.length >= 3) {
      sequence([{ clip: 'Annoyed_Head_Shake', eyes: 'angry', mouth: 'frown', fade: 0.12 }]);
      return onReact('annoyed');
    }
    if (zone === 'head') partial('Hit_On_Side_Of_Head', 0.55, ['closed', 'o']);
    else if (zone === 'legs') partial('Hit_On_Legs', 0.7, ['open', 'o']);
    else partial('Getting_Hit_Backwards', 0.6, ['closed', 'wide']);
    onReact('poke', zone);
  }
  function fall() {
    onReact('fall');
    const fallClip = Math.random() < 0.5 ? 'Falling_Back_Death' : 'Fall_Flat';
    sequence([
      { clip: fallClip, eyes: 'closed', mouth: 'o', fade: 0.1 },
      { wait: 1.2, eyes: 'x', mouth: 'wide' },
      { clip: 'Getting_Up', eyes: 'x', mouth: 'closed', fade: 0.2 },
      { clip: 'Dizzy_Idle', loopFor: 2.2, eyes: 'x', mouth: 'o', fade: 0.3 },
    ]);
  }
  function tickle() {
    onReact('tickle');
    const c = Math.random() < 0.6 ? 'Silly_Dancing' : 'Clapping';
    sequence([{ clip: c, loopFor: c === 'Clapping' ? 2.4 : 3, eyes: 'happy', mouth: 'wide', fade: 0.2 }]);
  }

  // ---------- loop ----------
  const clock = new THREE.Clock(); let talkT = 0, blinkAt = performance.now() + 2500;
  R.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1); unspreadArms(); mixer.update(dt); stepSpread(dt); spreadArms();
    const now = performance.now();
    if (!overlay) {
      if (talkingNow) {                              // mouth flaps only while sound plays
        talkT += dt; if (talkT > 0.08 + Math.random() * 0.07) { talkT = 0; const r = Math.random(); face.set(null, r < 0.35 ? 'wide' : r < 0.7 ? 'mid' : r < 0.85 ? 'o' : 'closed'); }
      } else if (face.mouth !== 'closed' && face.eyes !== 'happy') face.set(null, 'closed');
      if (mode === 'listen' && !talkingNow && curName === IDLE && now - lastNod > 4500) { lastNod = now; play('Head_Nod_Yes', { loop: false, fade: 0.3 }); }
    }
    if (now > blinkAt && face.eyes === 'open') { face.set('closed'); setTimeout(() => face.eyes === 'closed' && !overlay && face.set('open'), 130); blinkAt = now + 2200 + Math.random() * 3500; }
    R.render(S, C);
  });
  if (DBG.has('rotY')) knight.rotation.y = +DBG.get('rotY') * Math.PI / 180;
  layout(); applyBase(true);
  requestAnimationFrame(() => { canvas.style.opacity = '1'; });

  const api = {
    mode(m) { if (m === mode) return; mode = m; applyBase(); },
    talking(on) { if (on === talkingNow) return; talkingNow = on; if (!on && !overlay) face.set(null, 'closed'); applyBase(); },
    emote(e) { if (e === 'laugh' && !overlay) { face.set('happy', 'wide'); later(1200, () => !overlay && face.set('open', 'closed')); } },
    poke, fall, tickle,
    debugPose(name, t) { overlay = { name }; unspreadArms(); mixer.stopAllAction(); const a = act(name); a.play(); mixer.setTime(t * clips[name].duration); mixer.timeScale = 0; },
    face, clips: Object.keys(clips),
    state: () => ({ overlay: overlay && overlay.name, clip: curName, pokes: pokes.length, eyes: face.eyes }),
  };
  return api;
}

function pick(list, not) { const l = list.filter(x => x !== not); return l[Math.floor(Math.random() * l.length)] || list[0]; }


// Face: 1000×600 canvas drawn in code (glowing eyes + voice line), mapped onto the visor
// the cyan seams of the armor glow on their own (emissive), so they stay bright in any light
export function glowStripes(m) {
  const img = m.map && m.map.image; if (!img || m.userData.glow) return; m.userData.glow = true;
  try {
    const W = Math.min(1024, img.width), H = Math.round(W * img.height / img.width), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); g.drawImage(img, 0, 0, W, H); const d = g.getImageData(0, 0, W, H), px = d.data;
    for (let i = 0; i < px.length; i += 4) { const r = px[i], gg = px[i + 1], b = px[i + 2]; const cyan = gg > 140 && b > 170 && r < 140 && gg > r + 50;
      if (!cyan) { px[i] = px[i + 1] = px[i + 2] = 0; } }
    g.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(cv);
    t.flipY = m.map.flipY; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = m.map.wrapS; t.wrapT = m.map.wrapT;
    m.emissiveMap = t; m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = 1.6; m.needsUpdate = true;
  } catch (e) { /* no glow if the texture can't be read */ }
}

export function makeFace() {
  // SECRA's face: light drawn on the dark visor — two eye bars and a voice line, all in a cyan glow
  const FW = 1000, FH = 600, cv = document.createElement('canvas'); cv.width = FW; cv.height = FH;
  const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const st = { eyes: 'open', mouth: 'closed', tex, set(e, m) { if (e) st.eyes = e; if (m) st.mouth = m; draw(); } };
  const GLOW = '#7ff3ff', EY = 300, EX = [330, 670], MY = 440;
  function glow(fn, w = 26) { g.save(); g.strokeStyle = GLOW; g.fillStyle = GLOW; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = GLOW; g.shadowBlur = 40; g.lineWidth = w; fn(); g.restore(); }
  // visor eyes: two narrow glowing slits, tilted toward the middle (as in the promo video)
  function slit(x, y, len, th, ang) { g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.ellipse(0, 0, len / 2, th / 2, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  function eye(x, kind) {
    const s = x < FW / 2 ? 1 : -1;   // left eye: inner end is to the right
    glow(() => {
      if (kind === 'open') { g.globalAlpha = 0.95; slit(x, EY, 190, 46, 0.2 * s); }
      else if (kind === 'angry') { slit(x, EY + 10, 190, 40, 0.42 * s); }
      else if (kind === 'closed') { slit(x, EY + 8, 180, 12, 0.12 * s); }
      else if (kind === 'happy') { g.beginPath(); g.arc(x, EY + 60, 92, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke(); }
      else if (kind === 'x') { g.beginPath(); g.moveTo(x - 50, EY - 50); g.lineTo(x + 50, EY + 50); g.moveTo(x + 50, EY - 50); g.lineTo(x - 50, EY + 50); g.stroke(); }
    }, 24);
  }
  // voice line: a small smile at rest, a little waveform while speaking
  const WAVE = { closed: [0], mid: [0.35, 0.7, 0.45, 0.8, 0.4], wide: [0.6, 1, 0.75, 1, 0.65], o: [0.5, 0.6, 0.5], frown: [0] };
  function mouth(kind) {
    const a = WAVE[kind] || [0], n = a.length, mx = FW / 2;
    glow(() => {
      if (n === 1) { g.beginPath(); if (kind === 'frown') g.arc(mx, MY + 50, 55, 1.25 * Math.PI, 1.75 * Math.PI); else g.arc(mx, MY - 40, 55, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke(); return; }
      const step = 40; a.forEach((h, i) => { const x = mx + (i - (n - 1) / 2) * step; g.beginPath(); g.moveTo(x, MY - h * 60); g.lineTo(x, MY + h * 60); g.stroke(); });
    }, 18);
  }
  function draw() { g.clearRect(0, 0, FW, FH); EX.forEach(x => eye(x, st.eyes)); tex.needsUpdate = true; }   // no mouth: the visor only shows eyes
  draw();
  return st;
}
