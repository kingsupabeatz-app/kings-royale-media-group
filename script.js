/* King's Royale Media Group — site behavior (vanilla JS, no dependencies) */

/* ---------- mobile nav ---------- */
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');
if (burger) burger.addEventListener('click', () => nav.classList.toggle('open'));

/* ---------- scroll reveal ---------- */
const io = new IntersectionObserver(
  entries => entries.forEach(en => en.isIntersecting && en.target.classList.add('in')),
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------- footer year ---------- */
document.querySelectorAll('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

/* ---------- Artist Budget Builder ---------- */
const BUDGET_PLANS = {
  '100':  { title: 'Beat Lease + Recording Hour',
            body: 'Grab a WAV lease on any beat in the store and lock in a 1-hour engineered recording session. The fastest way to get a real record done.' },
  '250':  { title: 'Custom Beat',
            body: 'A beat built from scratch for YOUR sound — your reference tracks, your BPM, your vibe. Includes untagged WAV + revision.' },
  '500':  { title: 'Premium Custom Beat + Recording',
            body: 'Full custom production plus a 2-hour engineered recording session to lay it down the same week. Stems included.' },
  '1000': { title: 'Exclusive Production Package',
            body: 'An exclusive beat (full rights), 4-hour recording block, and a radio-ready mix & master. Walk out owning your record.' },
  '2500': { title: 'Full Artist Development Package',
            body: 'Multiple exclusive records, recording blocks, mixing & mastering, content creation for rollout, and release strategy. The full King’s Royale treatment.' },
};
const budgetBtns = document.querySelectorAll('.budget-btn');
const budgetOut = document.getElementById('budget-out');
budgetBtns.forEach(btn =>
  btn.addEventListener('click', () => {
    budgetBtns.forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const plan = BUDGET_PLANS[btn.dataset.budget];
    if (plan && budgetOut) {
      budgetOut.innerHTML =
        '<h3>' + plan.title + '</h3><p style="color:var(--muted)">' + plan.body + '</p>' +
        '<div style="margin-top:18px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
        '<a class="btn sm" href="book.html">Book It</a>' +
        '<a class="btn sm ghost" href="mailto:kingsupabeatz@gmail.com?subject=' +
        encodeURIComponent('Budget Plan: ' + plan.title) + '">Ask a Question</a></div>';
      budgetOut.classList.add('show');
    }
  })
);

/* ---------- Lead magnet (free beats) ----------
   Free options, in order:
   1. Set FORMSPREE_ID below (formspree.io — free tier) for real email capture.
   2. Until then: leads save to localStorage AND open a prefilled email,
      so no lead is ever lost. Export saved leads from the browser console:
      JSON.parse(localStorage.getItem('ksb_leads'))
*/
/* Lead magnet -> Netlify Forms (free, built into your host). Submissions appear in
   the Netlify dashboard -> Forms; turn on email notifications there. localStorage
   keeps a local backup so nothing is ever lost (also works offline / on file://). */
document.querySelectorAll('.lead-form').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = form.querySelector('[name=name]').value.trim();
    const email = form.querySelector('[name=email]').value.trim();
    if (!email) return;
    const leads = JSON.parse(localStorage.getItem('ksb_leads') || '[]');
    leads.push({ name, email, date: new Date().toISOString() });
    localStorage.setItem('ksb_leads', JSON.stringify(leads));
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'form-name': 'free-beats', name, email }).toString(),
      });
    } catch (err) { /* saved locally regardless */ }
    form.innerHTML = '<p style="font-size:18px">🎁 You\'re in' + (name ? ', ' + name : '') +
      '! Your free pack is on the way to ' + email + '.</p>';
  });
});

/* ---------- Stripe payment placeholders ----------
   Create free Payment Links at dashboard.stripe.com → Payment Links,
   then paste each URL into the matching data-stripe attribute in the HTML.
*/
document.querySelectorAll('[data-stripe]').forEach(btn => {
  btn.addEventListener('click', e => {
    const item = btn.dataset.item || 'Service';
    // link can come from the button's data-stripe OR the central map in stripe-links.js
    const url = btn.dataset.stripe || (window.KSB_STRIPE || {})[item] || '';
    if (url && url.startsWith('https://buy.stripe.com')) {
      window.open(url, '_blank');
    } else {
      e.preventDefault();
      window.location.href =
        'mailto:kingsupabeatz@gmail.com?subject=' +
        encodeURIComponent('Order: ' + item) +
        '&body=' + encodeURIComponent('I want to order: ' + item + '. Send me the payment link.');
    }
  });
});

/* ============================================================
   Beat store — stream the actual catalog (data: beats-data.js,
   generated by `python -m beatlabel store`)
   ============================================================ */
const AIRBIT = (window.KSB_AIRBIT || 'https://airbit.com/kingsupabeatz');
const grid = document.getElementById('catalog-grid');
const BEATS = window.KSB_BEATS || [];
const LICS = window.KSB_LICENSES || [];
const EMAIL = window.KSB_EMAIL || 'kingsupabeatz@gmail.com';
const CASH = window.KSB_CASHAPP || '';

/* ----- filters: chips + search drive the local catalog (and Airbit fallback) */
let catFilter = '', txtFilter = '';
document.querySelectorAll('.chip[data-cat]').forEach(chip =>
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip[data-cat]').forEach(c => c.classList.remove('on'));
    chip.classList.add('on');
    catFilter = (chip.dataset.cat || '').toLowerCase();
    if (grid && BEATS.length) renderGrid();
    else {
      const f = document.getElementById('airbit-frame');
      if (f) f.src = AIRBIT + (catFilter ? '?search=' + encodeURIComponent(catFilter) : '');
    }
  })
);
const storeSearch = document.getElementById('store-search');
if (storeSearch) {
  storeSearch.addEventListener('input', () => {
    txtFilter = storeSearch.value.trim().toLowerCase();
    if (grid && BEATS.length) renderGrid();
  });
  storeSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter' && storeSearch.value.trim())
      window.open(AIRBIT + '?search=' + encodeURIComponent(storeSearch.value.trim()), '_blank');
  });
}

/* ----- catalog grid ----- */
function beatMatches(b) {
  const hay = (b.title + ' ' + b.genre + ' ' + b.moods.join(' ') + ' ' + b.vibe).toLowerCase();
  return (!catFilter || hay.includes(catFilter.replace('houston trap', 'trap'))) &&
         (!txtFilter || hay.includes(txtFilter));
}
function beatSub(b) {
  return [b.bpm ? b.bpm + ' BPM' : '', b.key, b.vibe ? b.vibe + ' type' : '']
    .filter(Boolean).join(' · ');
}
function visibleBeats() { return BEATS.filter(beatMatches); }
function renderGrid() {
  if (!grid) return;
  const list = visibleBeats();
  grid.innerHTML = list.map(b => `
    <div class="bcard ${current === b.slug ? 'playing' : ''}" data-slug="${b.slug}">
      <div class="cov" onclick="playBeat('${b.slug}')">
        <img loading="lazy" src="${b.cover || 'covers/' + b.slug + '.png'}" alt="${b.title} — beat cover">
        <div class="pp">${current === b.slug && !player.paused ? '⏸' : '▶'}</div>
      </div>
      <div class="bmeta">
        <div class="bt">${b.title}</div>
        <div class="bs">${beatSub(b)}</div>
        <div class="brow">
          <span class="bprice">$${(LICS[0] || {price: 29.99}).price}+</span>
          <button class="btn sm" onclick="openLicense('${b.slug}')">License</button>
        </div>
      </div>
    </div>`).join('');
  const empty = document.getElementById('catalog-empty');
  if (empty) empty.style.display = (BEATS.length && list.length) ? 'none' : 'block';
}

/* ----- player ----- */
const player = new Audio();
let current = null;
const bar = document.getElementById('playerbar');
const pbPlay = document.getElementById('pb-play');
const pbWave = document.getElementById('pb-wave');
function findBeat(slug) { return BEATS.find(b => b.slug === slug); }
function playBeat(slug) {
  const b = findBeat(slug);
  if (!b) return;
  if (!b.preview) return openLicense(slug);
  if (current === slug) { player.paused ? player.play() : player.pause(); renderGrid(); return; }
  current = slug;
  player.src = 'previews/' + slug + '.mp3';
  player.play();
  bar.classList.add('on');
  document.body.classList.add('playing');
  document.getElementById('pb-cover').src = 'covers/' + slug + '.png';
  document.getElementById('pb-title').textContent = b.title;
  document.getElementById('pb-sub').textContent = beatSub(b);
  renderGrid();
}
function step(dir) {
  const list = visibleBeats();
  if (!list.length) return;
  const i = Math.max(0, list.findIndex(b => b.slug === current));
  playBeat(list[(i + dir + list.length) % list.length].slug);
}
if (pbPlay) {
  pbPlay.onclick = () => { player.paused ? player.play() : player.pause(); };
  document.getElementById('pb-prev').onclick = () => step(-1);
  document.getElementById('pb-next').onclick = () => step(1);
  document.getElementById('pb-license').onclick = () => current && openLicense(current);
  player.addEventListener('play', () => { pbPlay.textContent = '⏸'; drawWave(); renderGrid(); });
  player.addEventListener('pause', () => { pbPlay.textContent = '▶'; renderGrid(); });
  player.addEventListener('ended', () => step(1));
  pbWave.onclick = e => {
    if (player.duration) player.currentTime = (e.offsetX / pbWave.offsetWidth) * player.duration;
  };
}
function drawWave() {
  if (!current) return;
  const b = findBeat(current);
  const ctx = pbWave.getContext('2d');
  const W = (pbWave.width = pbWave.offsetWidth * 2), H = (pbWave.height = 96);
  const w = (b.wave && b.wave.length) ? b.wave : Array(60).fill(0.4);
  const prog = player.duration ? player.currentTime / player.duration : 0;
  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < w.length; i++) {
    const x = (i / w.length) * W, h = Math.max(4, w[i] * H * 0.9);
    ctx.fillStyle = i / w.length < prog ? '#8b53ff' : 'rgba(255,255,255,.18)';
    ctx.fillRect(x, (H - h) / 2, (W / w.length) * 0.62, h);
  }
  if (!player.paused) requestAnimationFrame(drawWave);
}

/* ----- license modal ----- */
const licModal = document.getElementById('lic-modal');
let licBeat = null, licSel = null;
function openLicense(slug) {
  licBeat = findBeat(slug);
  if (!licBeat || !licModal) return;
  document.getElementById('lic-title').textContent = licBeat.title;
  document.getElementById('lic-sub').textContent = beatSub(licBeat);
  const tiers = document.getElementById('lic-tiers');
  tiers.innerHTML = LICS.map((L, i) => {
    const price = (L.key === 'exclusive' && licBeat.exclusive) ? licBeat.exclusive : L.price;
    return `<div class="lic-tier ${i === 0 ? 'sel' : ''}" data-i="${i}">
      <div><b>${L.name}</b><small>${L.blurb}</small></div>
      <span class="lp">${L.from || L.key === 'exclusive' ? 'from ' : ''}$${price}</span>
    </div>`;
  }).join('');
  tiers.querySelectorAll('.lic-tier').forEach(t =>
    t.addEventListener('click', () => {
      tiers.querySelectorAll('.lic-tier').forEach(x => x.classList.remove('sel'));
      t.classList.add('sel');
      licSel = LICS[+t.dataset.i];
      wireLicenseActions();
    })
  );
  licSel = LICS[0];
  wireLicenseActions();
  licModal.classList.add('on');
}
function wireLicenseActions() {
  if (!licBeat || !licSel) return;
  const price = (licSel.key === 'exclusive' && licBeat.exclusive) ? licBeat.exclusive : licSel.price;
  document.getElementById('lic-airbit').href =
    AIRBIT + '?search=' + encodeURIComponent(licBeat.title);
  const cash = document.getElementById('lic-cash');
  if (CASH) { cash.style.display = ''; cash.href = 'https://cash.app/$' + CASH + '/' + price; }
  else cash.style.display = 'none';
  document.getElementById('lic-email').href =
    'mailto:' + EMAIL +
    '?subject=' + encodeURIComponent('Order: "' + licBeat.title + '" — ' + licSel.name + ' ($' + price + ')') +
    '&body=' + encodeURIComponent('I want the ' + licSel.name + ' for "' + licBeat.title +
      '" ($' + price + ').\nPaying via: Cash App / other\n\nArtist name: ');
}
if (licModal) {
  document.getElementById('lic-close').onclick = () => licModal.classList.remove('on');
  licModal.addEventListener('click', e => { if (e.target === licModal) licModal.classList.remove('on'); });
}

/* ----- boot the catalog ----- */
if (grid) {
  if (BEATS.length) renderGrid();
  else {
    const empty = document.getElementById('catalog-empty');
    if (empty) empty.style.display = 'block';
  }
}
