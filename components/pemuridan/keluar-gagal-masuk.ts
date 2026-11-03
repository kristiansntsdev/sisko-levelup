// Seri #1 · Pola Pikir — "Mereka Keluar Tetapi Gagal Masuk" (1 Korintus 10), ported scene by scene from the
// design file "Keluar tapi Gagal Masuk.html". Art and copy are unchanged; only class names moved to kit.ts.
import {
  B, BODY, CHAIN, CHAIN_SEP, CHAIN_STEP, CHECK, CHECK_BOX, CHECK_BTN, CHECKS, CHIP, CHIP_BTN, CHIPS, CAIRN, CORE, DIVE, DOTS,
  FADE, FIG, FIG_PERSON, FINALE, FLAKE, FLOW, HOLD, HOLD_PROG, HOLD_TRACK, HOT, OUTCOME, PAIR, RANGE, RANGE_INPUT,
  RANGE_LABEL, RING, SHAKE, SPLIT, STONE, STREAM, SVB, SVD, SVG, TOGGLE, TOGGLE_BTN, V, VERSE_CITE, VERSE_FONT, VERSE_P,
  VERSE_SPLIT, WALKERS, bird, calf, card, cloud, grad, hot, onHot, palm, person, pill, q, qa, quail, r1, rock, snake, star,
  tent, tree, type PersonOpts, type Scene, type Story,
} from './kit'

let seed = 11
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

const DEEDS: Record<string, [string, string, string, string]> = {
  '1': ['Mengingini yang jahat', '1 Kor 10:6 · Bilangan 11', 'Mereka bosan dengan manna dan merindukan ikan, mentimun, dan bawang dari Mesir. Tempat itu dinamai Kibrot-Taawa, artinya kubur orang-orang yang bernafsu rakus.', 'Pemeliharaan Tuhan terasa kurang ketika hati masih menginginkan Mesir.'],
  '2': ['Menyembah berhala', '1 Kor 10:7 · Keluaran 32', 'Saat Musa di gunung, mereka membuat anak lembu emas, lalu duduk untuk makan dan minum, kemudian bangun dan bersukaria.', 'Apa yang paling kita andalkan, itulah yang kita sembah.'],
  '3': ['Percabulan', '1 Kor 10:8 · Bilangan 25', 'Di Sitim mereka berzinah dengan perempuan Moab dan ikut menyembah Baal-Peor. Dalam satu hari dua puluh tiga ribu orang tewas.', 'Kompromi kecil yang dibiarkan bisa menjatuhkan satu generasi.'],
  '4': ['Mencobai Tuhan', '1 Kor 10:9 · Bilangan 21', 'Di tengah jalan mereka tidak sabar dan berkata-kata melawan Allah dan Musa. Ular-ular memagut mereka, lalu Tuhan menyediakan ular tembaga: siapa yang memandangnya tetap hidup.', 'Menuntut Tuhan membuktikan diri adalah tanda hati yang tidak percaya.'],
  '5': ['Bersungut-sungut', '1 Kor 10:10 · Bilangan 14', 'Mereka mengeluh semalaman dan berkata lebih baik mati di Mesir. Mereka bahkan ingin mengangkat pemimpin untuk kembali ke Mesir.', 'Sungut-sungut adalah suara pola pikir yang masih tinggal di perbudakan.'],
}

const LAYERS: [string, string, [string, string]][] = [
  ['Perbuatan', 'Yang terlihat hanyalah puncaknya: bersungut-sungut, menyembah berhala, ingin kembali ke Mesir. Perbuatan hanyalah <b>reaksi atau output</b>.', ['Sebab mereka yang hidup menurut daging, memikirkan hal-hal yang dari daging; mereka yang hidup menurut Roh, memikirkan hal-hal yang dari Roh.', 'Roma 8:5']],
  ['Pola', 'Tindakan yang diulang-ulang menjadi kebiasaan, lalu menjadi karakter. Sering kali dilakukan tanpa dipikirkan karena sudah biasa, dan terasa nyaman sehingga enggan berubah.', ['...telah sepuluh kali mencobai Aku dan tidak mendengarkan suara-Ku.', 'Bilangan 14:22']],
  ['Struktur', 'Tindakan positif atau negatif biasanya ada penunjangnya: kesempatan yang tercipta atau diciptakan. Seperti orang yang harus berhenti makan manis, tetapi kulkasnya penuh minuman manis.', ['Orang-orang bajingan yang ada di antara mereka kemasukan nafsu rakus; dan orang Israel pun menangislah pula...', 'Bilangan 11:4']],
  ['Mental model', 'Keyakinan dan pola pikir adalah kerangka yang menentukan keputusan, sikap, dan gaya hidup. Mereka sudah keluar dari Mesir, tetapi <b>Mesir belum keluar dari pikiran mereka</b>.', ['Bukankah lebih baik kita pulang ke Mesir?', 'Bilangan 14:3']],
]

type Source = { id: string; n: string; l: string; x: number; y: number; c: string; v: [string, string]; t: string }
const SOURCES: Source[] = [
  { id: 'kel', n: 'Nilai dalam keluarga', l: 'Keluarga', x: 122, y: 600, c: '#B2604A', v: ['Didiklah orang muda menurut jalan yang patut baginya, maka pada masa tuanya pun ia tidak akan menyimpang dari pada jalan itu.', 'Amsal 22:6'], t: 'Nilai pertama yang kita serap datang dari rumah.' },
  { id: 'per', n: 'Pergaulan', l: 'Pergaulan', x: 212, y: 358, c: '#C98A5E', v: ['Janganlah kamu sesat: Pergaulan yang buruk merusakkan kebiasaan yang baik.', '1 Korintus 15:33'], t: 'Siapa yang paling sering kita dengar, lama-lama cara berpikirnya ikut kita bawa.' },
  { id: 'fir', n: 'Firman Tuhan', l: 'Firman Tuhan', x: 450, y: 250, c: '#D7A23E', v: ['Setiap orang yang mendengar perkataan-Ku ini dan melakukannya, ia sama dengan orang yang bijaksana, yang mendirikan rumahnya di atas batu.', 'Matius 7:24'], t: 'Sumber yang membarui budi, bukan sekadar menambah informasi (Roma 12:2).' },
  { id: 'dun', n: 'Nilai-nilai dunia', l: 'Nilai dunia', x: 688, y: 358, c: '#7A4A5A', v: ['Hati-hatilah, supaya jangan ada yang menawan kamu dengan filsafatnya yang kosong dan palsu menurut ajaran turun-temurun dan roh-roh dunia, tetapi tidak menurut Kristus.', 'Kolose 2:8'], t: 'Media sosial, tren, dan ukuran sukses dunia ikut mengisi kepala setiap hari.' },
  { id: 'dir', n: 'Kebenaran diri sendiri', l: 'Diri sendiri', x: 778, y: 600, c: '#4C82A3', v: ['Percayalah kepada TUHAN dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri.', 'Amsal 3:5'], t: 'Keberhasilan, kegagalan, dan trauma membentuk “kebenaran” versi kita sendiri.' },
]

const STEPS = ['Aku tidak mengabaikan peringatan', 'Aku memeriksa: tindakanku membawa kemenangan atau kekalahan?', 'Aku menjaga apa yang masuk ke dalam pikiranku', 'Aku mau pola pikirku diubah seperti yang Tuhan kehendaki']

const scenes: Scene[] = [
  /* 0 — cover */
  {
    eyebrow: 'Seri #1 · Pola Pikir', t1: 'Mereka Keluar', t2: 'Tetapi Gagal Masuk', color: '#8E1B2E', next: 'Mulai',
    hint: 'Ketuk tanah di seberang sungai',
    art() {
      const crowd: [number, number, number, string, string, string?, number?][] = [[470, 712, .82, '#8A5A3A', '#EDE6DA', '#B2604A', 1], [345, 790, 1, '#7F8B4F', '#E9D9B8'], [425, 800, 1.02, '#9B6B78', '#F1E7D3'], [560, 792, 1, '#C98A5E', '#E8DCC4'], [650, 800, 1, '#5E8FAE', '#F1E7D3'], [250, 880, 1.22, '#B2604A', '#E9D9B8'], [395, 895, 1.26, '#7A5235', '#EFE4CF'], [545, 890, 1.24, '#667640', '#F1E7D3'], [700, 885, 1.2, '#93473A', '#E8DCC4']]
      let g = `<rect width="900" height="900" fill="url(#s0sky)"/><circle cx="610" cy="300" r="120" fill="#FBEFC9" opacity=".5"/><circle cx="610" cy="300" r="72" fill="#FCF1CF"/>`
      g += cloud(170, 190, 1.1) + cloud(760, 150, .9) + cloud(420, 120, .6, .7) + bird(480, 200) + bird(512, 186, .8) + bird(540, 210, .7) + bird(300, 150, .6)
      g += `<g id="s0far"><path d="M0 480 L110 395 L200 440 L320 345 L450 430 L560 372 L670 420 L780 350 L900 410 L900 540 L0 540 Z" fill="#C4A9A3"/><path d="M0 500 L140 440 L260 470 L380 420 L520 470 L640 430 L760 465 L900 440 L900 540 L0 540 Z" fill="#B39592"/>
  <path d="M690 520 L700 330 Q705 300 735 296 L800 292 Q830 290 834 320 L850 520 Z" fill="#C98F62"/><path d="M800 292 Q830 290 834 320 L850 520 L790 520 Z" fill="#B07A50"/></g>`
      g += `<g id="s0land"><path d="M0 520 Q160 478 310 505 Q460 532 610 494 Q770 456 900 498 L900 610 L0 610 Z" fill="#93A05A"/><path d="M0 560 Q200 535 420 560 Q640 585 900 552 L900 610 L0 610 Z" fill="#7C8A49"/>`
        + palm(90, 548, .75, -1) + palm(165, 540, .95, 1) + tree(300, 548, .8) + tree(372, 556, .6, '#9AA466') + tree(520, 540, .7) + palm(640, 520, .8, -1) + palm(722, 514, 1, 1) + palm(812, 522, .75, 1)
        + `<path d="M0 590 Q220 568 450 590 Q680 612 900 584 L900 650 Q680 672 450 650 Q220 628 0 650 Z" fill="#6FA3BE"/><path d="M60 614 q20 -6 40 0 M300 606 q20 -6 40 0 M560 624 q20 -6 40 0 M760 608 q20 -6 40 0" stroke="#EAF4F6" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/></g>`
      g += `<path d="M0 640 Q240 620 450 646 Q690 676 900 636 L900 900 L0 900 Z" fill="#E7D0A0"/><path d="M0 760 Q200 720 420 760 Q620 800 900 750 L900 900 L0 900 Z" fill="#DDBF89"/>`
      g += `<g id="s0glow" class="${FADE}" opacity="0">${star(470, 520, 1.2) + star(560, 480, .9) + star(690, 470, 1.1) + star(780, 520, .8) + star(380, 500, .8)}</g>`
      g += `<g id="s0tag" class="${FADE}" opacity="0"><rect x="445" y="396" width="310" height="78" rx="39" fill="#F7EFDF"/><path d="M590 473 L600 488 L610 473 Z" fill="#F7EFDF"/><text x="600" y="432" text-anchor="middle" class="${SVD}" font-size="34" fill="#8E1B2E" letter-spacing="2">KANAAN</text><text x="600" y="459" text-anchor="middle" class="${SVB}" font-size="19" fill="#6B5644">tanah yang dijanjikan</text></g>`
      g += `<g id="s0crowd">${crowd.map((c) => person(c[0], c[1], c[2], { back: true, robe: c[3], cover: c[4], mantle: c[5], staff: !!c[6], right: c[6] ? 'up' : undefined })).join('')}</g>`
      g += hot(600, 540, 'land', 'Lihat tanah yang dijanjikan')
      return SVG(g, grad('s0sky', '#F3CF8E', '#F6E2B8', '#F4EAD2'), 'Bangsa Israel berdiri di padang pasir memandang tanah Kanaan di seberang sungai')
    },
    panel: () => B('Sebuah bangsa dibebaskan dari perbudakan di Mesir, berjalan di padang gurun, lalu tiba di tepi tanah yang dijanjikan. Sentuh gambarnya, ikuti ceritanya, dan temukan <b>apa yang membuat mereka gagal masuk</b>.') + V('Semuanya ini telah menimpa mereka sebagai contoh dan dituliskan untuk menjadi peringatan bagi kita.', '1 Korintus 10:11'),
    mount(c) {
      const svg = c.svg, far = q(svg, '#s0far'), land = q(svg, '#s0land'), crowd = q(svg, '#s0crowd')
      onHot(svg, (id, el) => {
        q(svg, '#s0tag').setAttribute('opacity', '1'); q(svg, '#s0glow').setAttribute('opacity', '1')
        el.classList.add('seen'); c.setHint('Itu tujuannya. Ketuk Mulai untuk masuk ke cerita'); c.done()
      })
      if (c.rm) return
      const mv = (e: PointerEvent) => {
        const r = svg.getBoundingClientRect(); const dx = ((e.clientX - r.left) / r.width - .5)
        far.setAttribute('transform', `translate(${r1(dx * -8)} 0)`); land.setAttribute('transform', `translate(${r1(dx * -16)} 0)`); crowd.setAttribute('transform', `translate(${r1(dx * 14)} 0)`)
      }
      svg.addEventListener('pointermove', mv)
    },
  },

  /* 1 — sea */
  {
    eyebrow: 'Bagian 1 · Keluar', t1: 'Keluar', t2: 'Semua melintasi laut', color: '#3F6F8C',
    hint: 'Tahan tombol tongkat sampai laut terbelah',
    art() {
      const wall = `<path d="M-80 900 L-80 300 Q-10 268 70 300 Q150 332 230 296 Q320 262 400 300 Q440 318 470 300 L470 900 Z" fill="url(#s1w)"/><path d="M-60 400 Q30 384 120 400 T300 400 T460 400 M-60 500 Q30 484 120 500 T300 500 T460 500 M-60 610 Q30 594 120 610 T300 610 T460 610 M-60 730 Q30 714 120 730 T300 730 T460 730" stroke="#E6F2F6" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/><path d="M-80 300 Q-10 268 70 300 Q150 332 230 296 Q320 262 400 300 Q440 318 470 300" stroke="#F1F8FA" stroke-width="13" fill="none" stroke-linecap="round"/><path class="wedge" d="M470 300 L470 900" stroke="#D6ECF3" stroke-width="9" opacity="0"/>`
      const walk: [number, number, number, string][] = [[452, 712, .42, '#B2604A'], [430, 650, .36, '#7F8B4F'], [470, 598, .32, '#9B6B78'], [446, 548, .28, '#C98A5E'], [464, 502, .24, '#5E8FAE'], [448, 462, .2, '#93473A'], [468, 430, .17, '#667640']]
      let g = `<rect width="900" height="900" fill="url(#s1sky)"/><path d="M0 300 L120 250 L230 300 L340 250 L460 300 L580 240 L700 290 L820 250 L900 280 L900 310 L0 310 Z" fill="#B7AEC2"/><rect y="300" width="900" height="56" fill="#7FB3CB"/><path d="M380 318 q20 -6 40 0 M480 334 q20 -6 40 0" stroke="#EAF4F6" stroke-width="3" fill="none" opacity=".7"/>`
      g += `<path d="M318 900 L436 330 L464 330 L582 900 Z" fill="#D9BC88"/><path d="M380 900 L446 330 L454 330 L520 900 Z" fill="#E4CA98"/>`
      g += `<g class="${WALKERS}" id="s1walk">${walk.map((w) => `<g class="w">${person(w[0], w[1], w[2], { back: true, robe: w[3], shadow: false })}</g>`).join('')}</g>`
      g += `<g id="s1L">${wall}</g><g transform="translate(900 0) scale(-1 1)"><g id="s1R">${wall}</g></g>`
      g += `<g opacity=".88" fill="#FFFAF0"><ellipse cx="150" cy="300" rx="70" ry="34"/><ellipse cx="140" cy="250" rx="58" ry="38"/><ellipse cx="156" cy="196" rx="52" ry="38"/><ellipse cx="144" cy="146" rx="46" ry="34"/><ellipse cx="152" cy="104" rx="38" ry="26"/></g>`
      g += `<path d="M0 836 Q450 800 900 836 L900 900 L0 900 Z" fill="#E7D0A0"/>`
      g += `<circle id="s1glow" cx="536" cy="318" r="56" fill="url(#s1g)" opacity="0"/>`
      g += person(450, 892, 1.72, { back: true, robe: '#8A5A3A', mantle: '#B2604A', cover: '#EDE6DA', staff: true, right: 'up' })
      const defs = grad('s1sky', '#D3E5EA', '#F3EAD6') + grad('s1w', '#9ACADD', '#3C7593') + `<radialGradient id="s1g"><stop offset="0" stop-color="#FFF6D8"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></radialGradient>`
      return SVG(g, defs, 'Musa mengangkat tongkat di depan Laut Teberau')
    },
    panel: () => `<button class="${HOLD}" id="hold" aria-label="Tahan untuk mengangkat tongkat dan membelah laut"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="${HOLD_TRACK}" cx="50" cy="50" r="44"/><circle class="${HOLD_PROG}" cx="50" cy="50" r="44"/><path d="M50 78 L50 26 Q50 18 42 19" stroke="#F7EFDF" stroke-width="6" fill="none" stroke-linecap="round"/></svg><span class="lbl">Tahan tongkat</span></button>`
      + B('Tidak ada yang tertinggal di Mesir. Tua, muda, anak-anak, <b>semuanya</b> ikut keluar dan melihat mukjizat yang sama.')
      + V('...nenek moyang kita semua berada di bawah perlindungan awan dan mereka semua telah melintasi laut.', '1 Korintus 10:1'),
    mount(c) {
      const L = q(c.svg, '#s1L'), R = q(c.svg, '#s1R'), W = q(c.svg, '#s1walk'), glow = q(c.svg, '#s1glow')
      const btn = q<HTMLButtonElement>(c.panel, '#hold'), ring = q(btn, '.prog')
      const C = 2 * Math.PI * 44; ring.style.strokeDasharray = String(C)
      let p = 0, holding = false, last = 0, raf = 0, fin = false
      const draw = () => {
        const e = 1 - Math.pow(1 - p, 2)
        L.setAttribute('transform', `translate(${r1(-215 * e)} 0)`); R.setAttribute('transform', `translate(${r1(-215 * e)} 0)`)
        glow.setAttribute('opacity', String(r1((holding ? 1 : .45) * Math.min(1, p * 3))))
        qa(c.svg, '.wedge').forEach((w) => w.setAttribute('opacity', String(r1(Math.min(1, p * 4)))))
        ring.style.strokeDashoffset = String(C * (1 - p))
      }
      const finish = () => {
        fin = true; holding = false; p = 1; draw(); W.classList.add('show'); btn.classList.remove('holding'); btn.classList.add('done')
        q<HTMLElement>(btn, '.lbl').textContent = 'Laut terbelah'; c.setHint('Semua menyeberang di tanah kering'); c.done()
      }
      const tick = (t: number) => {
        if (!holding) { raf = 0; return }
        const dt = last ? t - last : 16; last = t; p = Math.min(1, p + dt / 2000); draw()
        if (p >= 1) { raf = 0; finish(); return }
        raf = requestAnimationFrame(tick)
      }
      const start = () => { if (fin) return; if (c.rm) { finish(); return } holding = true; last = 0; btn.classList.add('holding'); if (!raf) raf = requestAnimationFrame(tick) }
      const stop = () => { if (fin) return; holding = false; btn.classList.remove('holding'); draw() }
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); try { btn.setPointerCapture(e.pointerId) } catch { } start() })
      ;['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => btn.addEventListener(ev, stop))
      btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start() } })
      btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop() })
      btn.addEventListener('contextmenu', (e) => e.preventDefault())
      draw()
      return () => cancelAnimationFrame(raf)
    },
  },

  /* 2 — manna & rock */
  {
    eyebrow: 'Bagian 2 · Dipelihara', t1: 'Dicukupi', t2: 'Makanan & minuman rohani', color: '#7A5235',
    hint: 'Ketuk langit, lalu ketuk batu karang',
    art() {
      let g = `<rect width="900" height="900" fill="url(#s2sky)"/><circle cx="190" cy="250" r="96" fill="#FBEBC6" opacity=".55"/><circle cx="190" cy="250" r="58" fill="#FDF0CF"/>` + cloud(640, 150, .9) + cloud(400, 210, .6, .7)
      g += `<path d="M0 520 Q180 450 380 500 Q580 550 900 470 L900 700 L0 700 Z" fill="#E0BE88"/><path d="M0 600 Q260 560 500 600 Q720 636 900 590 L900 760 L0 760 Z" fill="#D9B57E"/><path d="M0 680 Q450 630 900 690 L900 900 L0 900 Z" fill="#E9D3A4"/>`
      g += `<path d="M520 770 Q496 610 556 520 Q610 418 722 408 Q852 398 900 470 L900 790 Q760 806 520 770 Z" fill="#B98F68"/><path d="M722 408 Q852 398 900 470 L900 790 Q820 800 764 792 Q806 610 722 408 Z" fill="#9E7654"/><path d="M572 522 Q612 452 692 432 Q622 482 602 562 Z" fill="#D4AE84"/><path d="M646 552 Q664 596 652 640" stroke="#7E5B3E" stroke-width="5" fill="none" stroke-linecap="round"/>`
      g += `<g id="s2water" class="${FADE}" opacity="0"><ellipse id="s2pool" cx="660" cy="822" rx="120" ry="20" fill="#8CC3DA"/><path d="M652 620 Q694 700 672 812" stroke="#8CC3DA" stroke-width="24" fill="none" stroke-linecap="round"/><path class="${FLOW}" d="M652 620 Q694 700 672 812" stroke="#EAF6FA" stroke-width="7" fill="none" stroke-linecap="round"/></g>`
      g += `<g id="s2manna"></g>`
      g += `<g transform="translate(150 712)"><path d="M-30 0 Q-32 30 0 32 Q32 30 30 0 Z" fill="#A9774A"/><ellipse rx="30" ry="9" fill="#C08C58"/><path d="M-26 6 L26 6 M-24 16 L24 16" stroke="#8A5E36" stroke-width="2.5"/></g>`
      g += person(150, 850, 1.25, { robe: '#7A4A5A', inner: '#EAD9BE', cover: '#C98A5E', fringe: true, pose: 'hold', eyes: 'closed' })
      g += person(410, 846, 1.5, { robe: '#8A5A3A', mantle: '#B2604A', cover: '#EDE6DA', beard: '#ECE6DC', staff: true })
      g += hot(320, 170, 'sky', 'Ketuk langit untuk menurunkan manna') + hot(690, 520, 'rock', 'Ketuk batu karang untuk mengeluarkan air')
      return SVG(g, grad('s2sky', '#F6D7A4', '#F6EBD6'), 'Musa di dekat batu karang di padang gurun, seorang perempuan membawa keranjang')
    },
    panel: () => `<div class="${CHIPS}"><span class="${CHIP}" id="c-manna">${CHECK}Roti dari langit</span><span class="${CHIP}" id="c-air">${CHECK}Air dari batu karang</span></div>`
      + B('Roti turun dari langit setiap pagi. Air memancar dari batu karang. Semua menerima pemeliharaan yang <b>sama</b>.')
      + V('Mereka semua makan makanan rohani yang sama dan mereka semua minum minuman rohani yang sama, sebab mereka minum dari batu karang rohani yang mengikuti mereka, dan batu karang itu ialah Kristus.', '1 Korintus 10:3-4'),
    mount(c) {
      const got: Record<string, boolean> = {}
      const check = () => { if (got.sky && got.rock) { c.setHint('Tidak ada yang kekurangan'); c.done() } else c.setHint(got.sky ? 'Sekarang ketuk batu karang' : 'Sekarang ketuk langit') }
      onHot(c.svg, (id, el) => {
        if (got[id]) return
        got[id] = true; el.classList.add('seen')
        if (id === 'sky') {
          const M = q(c.svg, '#s2manna'); let h = ''
          for (let i = 0; i < 54; i++) {
            const x = 40 + rnd() * 820, y = 700 + rnd() * 150, from = -(y - 40 - rnd() * 220), d = (rnd() * 1.5).toFixed(2)
            h += `<ellipse class="${FLAKE}" cx="${x | 0}" cy="${y | 0}" rx="${r1(5 + rnd() * 4)}" ry="3.6" fill="#FFFCF2" stroke="#E2D2B0" stroke-width="1" style="--from:${from | 0}px;animation-delay:${d}s"/>`
          }
          M.innerHTML = h; q(c.panel, '#c-manna').classList.add('on')
        } else { q(c.svg, '#s2water').setAttribute('opacity', '1'); q(c.panel, '#c-air').classList.add('on') }
        check()
      })
    },
  },

  /* 3 — but */
  {
    eyebrow: 'Bagian 3 · Tetapi', t1: 'Tetapi', t2: 'Allah tidak berkenan', color: '#8E1B2E',
    hint: 'Geser tahun di padang gurun, dari 1 sampai 40',
    art() {
      let g = `<rect width="900" height="900" fill="url(#s3sky)"/><path d="M0 250 L130 200 L260 232 L390 186 L520 226 L660 180 L790 220 L900 196 L900 280 L0 280 Z" fill="#C9B0A2"/><rect y="260" width="900" height="640" fill="#E8D19F"/><path d="M0 420 Q300 380 600 430 T900 410 M0 600 Q260 570 560 610 T900 590" stroke="#DCC08A" stroke-width="18" fill="none"/>`
      g += `<path d="M60 300 C300 330 130 430 380 440 S720 380 640 540 S220 640 430 760 S860 740 840 880" stroke="#C49B62" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="2 16"/>`
      g += `<text x="54" y="196" class="${SVD}" font-size="104" fill="#8E1B2E" id="s3year">0</text><text x="58" y="232" class="${SVD}" font-size="24" fill="#6B5644" letter-spacing="3">TAHUN DI PADANG GURUN</text>`
      g += `<text x="846" y="150" text-anchor="end" class="${SVD}" font-size="22" fill="#6B5644" letter-spacing="2">GENERASI YANG KELUAR</text><text x="846" y="186" text-anchor="end" class="${SVD}" font-size="34" fill="#3E2A1E" id="s3left">48 / 48</text>`
      const robes = ['#B2604A', '#7F8B4F', '#9B6B78', '#C98A5E', '#5E8FAE', '#93473A', '#7A5235', '#667640', '#A57C5B'], covers = ['#F1E7D3', '#E9D9B8', '#EDE6DA', '#E8DCC4']
      seed = 23; const ids: number[] = []; for (let i = 0; i < 46; i++) ids.push(i)
      for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]] }
      let k = 0, figs = ''
      for (let r = 0; r < 6; r++) for (let col = 0; col < 8; col++) {
        const x = 95 + col * 101 + (r % 2 ? 48 : 0), y = 330 + r * 88
        const special = r === 2 && (col === 3 || col === 4)
        const name = special ? (col === 3 ? 'yosua' : 'kaleb') : ''
        const t = special ? 99 : 1 + Math.floor(ids[k++] * 39 / 46)
        const o: PersonOpts = { robe: special ? (col === 3 ? '#667640' : '#4C82A3') : robes[(r * 3 + col) % robes.length], cover: covers[(r + col) % 4], eyes: 'closed', shadow: false }
        if (!special && (r + col) % 3 === 0) o.beard = '#4A3426'
        if (special) o.beard = '#4A3426'
        figs += `<g class="${FIG}${special ? ' sp' : ''}" data-t="${t}" ${name ? `id="s3${name}"` : ''}>${special ? `<circle class="halo ${FADE}" cx="${x}" cy="${y - 40}" r="58" fill="#F6D27A" opacity="0"/>` : ''}<g class="${FIG_PERSON}">${person(x, y, .36, o)}</g>${special ? '' : `<g class="${CAIRN}"><ellipse cx="${x - 6}" cy="${y - 4}" rx="11" ry="7" fill="#A89A88"/><ellipse cx="${x + 8}" cy="${y - 3}" rx="9" ry="6" fill="#968877"/><ellipse cx="${x + 1}" cy="${y - 11}" rx="8" ry="6" fill="#B7AA98"/></g>`}</g>`
      }
      g += figs
      g += `<g id="s3labels" class="${FADE}" opacity="0">${pill(394, 436, 'YOSUA', '#3E2A1E', '#F7EFDF', 22, 'middle')}${pill(495, 436, 'KALEB', '#3E2A1E', '#F7EFDF', 22, 'middle')}</g>`
      return SVG(g, grad('s3sky', '#F4D9A6', '#F3E6CC'), 'Generasi Israel di padang gurun, satu per satu berguguran selama 40 tahun')
    },
    panel: () => `<div class="${RANGE}"><label class="${RANGE_LABEL}" for="years" id="yearlbl">Tahun ke-0</label><input class="${RANGE_INPUT}" type="range" id="years" min="0" max="40" step="1" value="0"></div>`
      + `<p class="${BODY}" id="s3body">Semua keluar. Semua dipelihara. Tetapi dari generasi dewasa yang keluar dari Mesir, hanya <b>dua orang</b> yang akhirnya masuk.</p>`
      + V('Tetapi sungguhpun demikian Allah tidak berkenan kepada bagian yang terbesar dari mereka, karena mereka ditewaskan di padang gurun.', '1 Korintus 10:5'),
    mount(c) {
      const inp = q<HTMLInputElement>(c.panel, '#years'), lbl = q<HTMLElement>(c.panel, '#yearlbl'), yr = q(c.svg, '#s3year'), left = q(c.svg, '#s3left'), figs = qa(c.svg, '.fig'), body = q<HTMLElement>(c.panel, '#s3body')
      let doneOnce = false
      const up = () => {
        const y = +inp.value; let n = 0
        figs.forEach((f) => { const g = +(f.dataset.t ?? 0) <= y; f.classList.toggle('gone', g); if (!g) n++ })
        yr.textContent = String(y); lbl.textContent = y ? `Tahun ke-${y}` : 'Tahun ke-0'; left.textContent = `${n} / 48`
        const end = y >= 40
        q(c.svg, '#s3labels').setAttribute('opacity', end ? '1' : '0'); qa(c.svg, '.halo').forEach((h) => h.setAttribute('opacity', end ? '.75' : '0'))
        if (end) {
          body.innerHTML = 'Empat puluh tahun kemudian, dari generasi yang keluar hanya <b>Yosua dan Kaleb</b> yang masuk. Sisanya yang masuk adalah anak-anak mereka, generasi baru (Bilangan 14:29-31).'
          if (!doneOnce) { doneOnce = true; c.setHint('Keluar tidak otomatis berarti masuk'); c.done() }
        } else body.innerHTML = 'Semua keluar. Semua dipelihara. Tetapi dari generasi dewasa yang keluar dari Mesir, hanya <b>dua orang</b> yang akhirnya masuk.'
      }
      inp.addEventListener('input', up); up()
    },
  },

  /* 4 — two reports */
  {
    eyebrow: 'Bagian 4 · Cara melihat', t1: 'Dua Laporan', t2: 'Negeri yang sama', color: '#5B6C3A',
    hint: 'Geser garis pemisah di gambar ke kiri dan kanan',
    art() {
      // faith side (base)
      let b = `<rect width="900" height="900" fill="url(#s4b)"/><circle cx="720" cy="190" r="104" fill="#FCEFC8" opacity=".55"/><circle cx="720" cy="190" r="62" fill="#FDF2D2"/>` + cloud(230, 170, .9) + cloud(520, 120, .6, .8)
      b += `<path d="M0 470 Q200 400 420 440 Q640 480 900 420 L900 620 L0 620 Z" fill="#A9B66C"/><path d="M220 450 Q450 300 690 450 Z" fill="#93A05A"/>`
      b += `<g transform="translate(450 368)"><rect x="-70" y="-30" width="140" height="44" fill="#E7D3AA"/><rect x="-86" y="-62" width="26" height="76" fill="#DCC598"/><rect x="60" y="-62" width="26" height="76" fill="#DCC598"/><path d="M-86 -62 h6 v-8 h6 v8 h4 v-8 h6 v8 h4 M60 -62 h6 v-8 h6 v8 h4 v-8 h6 v8 h4" stroke="#DCC598" stroke-width="4" fill="none"/><path d="M-12 14 L-12 -6 Q0 -18 12 -6 L12 14 Z" fill="#6B4A32"/></g>`
      b += person(560, 420, .42, { helmet: true, robe: '#6B5A48', inner: '#8C7A5E', beard: '#3A261A', eyes: 'open', spear: true, shield: true, cover: null })
      b += `<path d="M0 600 Q450 560 900 610 L900 900 L0 900 Z" fill="#9FAE63"/><path d="M0 700 Q450 660 900 712 L900 900 L0 900 Z" fill="#8C9A55"/>`
      b += palm(96, 660, 1.1, 1) + palm(812, 640, 1, -1) + tree(190, 640, .8, '#9AA466')
      b += `<g fill="#F3C85C">${[[120, 760], [230, 800], [700, 790], [780, 760], [620, 820], [300, 740]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>`
      b += `<path d="M244 602 L656 602" stroke="#7A5235" stroke-width="10" stroke-linecap="round"/>`
      let gr = ''; const gp = [[0, 0], [-24, 10], [24, 10], [-36, 34], [0, 30], [36, 34], [-44, 60], [-14, 58], [16, 58], [44, 60], [-36, 86], [-6, 84], [24, 86], [-22, 110], [10, 110], [-4, 134]]
      gp.forEach(([x, y], i) => gr += `<circle cx="${x}" cy="${y}" r="17" fill="${i % 3 ? '#6E3D68' : '#85507E'}"/><circle cx="${x - 5}" cy="${y - 6}" r="4.5" fill="#B88AB2" opacity=".7"/>`)
      b += `<g transform="translate(450 632)"><path d="M0 -30 L0 -6" stroke="#5F7A42" stroke-width="6"/><path d="M0 -20 Q-46 -46 -62 -10 Q-30 -4 0 -20 Z M0 -20 Q46 -46 62 -10 Q30 -4 0 -20 Z" fill="#738F4E"/>${gr}</g>`
      b += person(290, 884, 1.45, { robe: '#667640', mantle: '#C98A5E', cover: '#F1E7D3', beard: '#4A3426', eyes: 'open', pose: 'carry' })
      b += person(610, 888, 1.45, { robe: '#4C82A3', mantle: '#E8DCC4', cover: '#E9D9B8', beard: '#6B4A32', eyes: 'open', pose: 'carry' })
      b += pill(855, 166, 'MATA YOSUA & KALEB', '#F7EFDF', '#4E5B2A', 23, 'end')
      // fear side
      let a = `<rect width="900" height="900" fill="url(#s4a)"/>` + cloud(160, 150, 1.4, .9, '#8D86A0') + cloud(420, 110, 1.1, .9, '#7C7590') + cloud(330, 200, 1.2, .85, '#9890A8')
      a += `<path d="M300 140 L270 220 L300 220 L276 300" stroke="#F4E9C8" stroke-width="5" fill="none" stroke-linejoin="round" opacity=".8"/>`
      a += `<path d="M-60 560 Q450 230 960 560 Z" fill="#7E7065"/>`
      a += `<g transform="translate(450 470)"><rect x="-300" y="-190" width="600" height="200" fill="#9A8572"/><rect x="-330" y="-260" width="70" height="270" fill="#8A7562"/><rect x="260" y="-260" width="70" height="270" fill="#8A7562"/>${Array.from({ length: 11 }, (_, i) => `<rect x="${-300 + i * 56}" y="-214" width="30" height="26" fill="#9A8572"/>`).join('')}<path d="M-46 10 L-46 -60 Q0 -110 46 -60 L46 10 Z" fill="#3A2A22"/></g>`
      a += `<path d="M0 700 Q450 670 900 712 L900 900 L0 900 Z" fill="#B49A7C"/><path d="M0 790 Q450 760 900 800 L900 900 L0 900 Z" fill="#A58B6E"/>`
      a += person(318, 890, 3.3, { helmet: true, robe: '#4F4034', inner: '#6E5C48', beard: '#2A1A12', eyes: 'angry', spear: true, shield: true, cover: null, skin: '#C99167' })
      a += `<g class="${SHAKE}">${person(84, 762, .4, { robe: '#667640', cover: '#F1E7D3', eyes: 'worried', pose: 'up', mouth: 'frown' })}${person(128, 766, .38, { robe: '#4C82A3', cover: '#E9D9B8', eyes: 'worried', pose: 'up', mouth: 'frown' })}</g>`
      a += `<g transform="translate(172 760) scale(.3)"><circle r="17" fill="#6E3D68"/><circle cx="20" cy="10" r="17" fill="#6E3D68"/><circle cx="-18" cy="12" r="17" fill="#85507E"/></g>`
      a += pill(40, 166, 'MATA 10 PENGINTAI', '#2E2838', '#EDE6F2', 23)
      let g = `${b}<g clip-path="url(#s4clip)">${a}</g>`
      g += `<line id="s4line" x1="450" y1="0" x2="450" y2="900" stroke="#F7EFDF" stroke-width="6"/>`
      g += `<g id="s4knob" class="${HOT}" tabindex="0" role="slider" aria-label="Geser pembanding" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" transform="translate(450 480)"><circle r="40" fill="#F7EFDF"/><circle r="40" fill="none" stroke="#3E2A1E" stroke-width="3" opacity=".2"/><path d="M-10 -12 L-22 0 L-10 12 M10 -12 L22 0 L10 12" stroke="#3E2A1E" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`
      const defs = grad('s4b', '#BFE0EA', '#F7EBCF') + grad('s4a', '#56506A', '#A69A98') + `<clipPath id="s4clip"><rect id="s4cliprect" x="0" y="0" width="450" height="900"/></clipPath>`
      return SVG(g, defs, 'Perbandingan: sepuluh pengintai melihat raksasa besar dan diri mereka kecil, Yosua dan Kaleb melihat negeri yang subur')
    },
    panel: () => B('Dua belas pengintai melihat negeri dan raksasa yang sama. Sepuluh pulang dengan takut, dua dengan iman. Seperti gambar bebek-kelinci: <b>yang terlihat tergantung pola pikir</b>.')
      + `<div class="${SPLIT}"><blockquote id="s4va" class="${VERSE_SPLIT} bg-[#E3DDE6]"><p class="${VERSE_P}">...kami lihat diri kami seperti belalang.</p><cite class="${VERSE_CITE}">Bil 13:33 · 10 pengintai</cite></blockquote><blockquote id="s4vb" class="${VERSE_SPLIT} bg-[#E6EBCF]"><p class="${VERSE_P}">...TUHAN menyertai kita; janganlah takut kepada mereka.</p><cite class="${VERSE_CITE}">Bil 14:9 · Yosua & Kaleb</cite></blockquote></div>`,
    mount(c) {
      const svg = c.svg, clip = q(svg, '#s4cliprect'), line = q(svg, '#s4line'), knob = q(svg, '#s4knob'), va = q<HTMLElement>(c.panel, '#s4va'), vb = q<HTMLElement>(c.panel, '#s4vb')
      svg.style.touchAction = 'none'
      let X = 450, drag = false, travel = 0, lastX = 450, ok = false, raf = 0
      const set = (v: number) => {
        X = Math.max(0, Math.min(900, v)); travel += Math.abs(X - lastX); lastX = X
        clip.setAttribute('width', String(r1(X))); line.setAttribute('x1', String(r1(X))); line.setAttribute('x2', String(r1(X)))
        knob.setAttribute('transform', `translate(${r1(X)} 480)`); knob.setAttribute('aria-valuenow', String(Math.round(X / 9)))
        const s = X / 900
        va.style.opacity = String(r1(.4 + .6 * Math.min(1, s * 1.6))); vb.style.opacity = String(r1(.4 + .6 * Math.min(1, (1 - s) * 1.6)))
        if (!ok && travel > 360) { ok = true; c.setHint(X > 450 ? 'Ketakutan membuat raksasa terlihat makin besar' : 'Iman melihat janji Tuhan lebih besar'); c.done() }
      }
      const toX = (e: PointerEvent) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM()!.inverse()).x }
      svg.addEventListener('pointerdown', (e) => { cancelAnimationFrame(raf); drag = true; try { svg.setPointerCapture(e.pointerId) } catch { } set(toX(e)) })
      svg.addEventListener('pointermove', (e) => { if (drag) set(toX(e)) })
      ;['pointerup', 'pointercancel'].forEach((ev) => svg.addEventListener(ev, () => drag = false))
      knob.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); set(X - 45) }
        if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); set(X + 45) }
      })
      if (!c.rm) {
        const t0 = performance.now()
        const tick = (t: number) => { const k = (t - t0) / 1600; if (k >= 1) { set(450); travel = 0; return } set(450 + Math.sin(k * Math.PI * 2) * 110 * (1 - k)); raf = requestAnimationFrame(tick) }
        raf = requestAnimationFrame(tick)
      }
      return () => cancelAnimationFrame(raf)
    },
  },

  /* 5 — five deeds */
  {
    eyebrow: 'Bagian 5 · Peringatan', t1: '5 Perbuatan', t2: 'Penyebab mereka gagal', color: '#8E1B2E',
    hint: 'Ketuk lima titik di perkemahan',
    art() {
      let g = `<rect width="900" height="900" fill="url(#s5sky)"/>`
      g += `<path d="M0 470 L120 410 L240 440 L330 400 L600 410 L700 380 L820 420 L900 400 L900 520 L0 520 Z" fill="#C8A99A"/>`
      g += `<path d="M250 480 L420 196 Q450 166 480 196 L650 480 Z" fill="#A88A7A"/><path d="M450 182 Q470 186 480 196 L650 480 L520 480 Z" fill="#94776A"/>` + cloud(450, 190, 1.3, .85, '#E9E2DA') + cloud(400, 215, .8, .8, '#DDD5CC')
      g += `<path d="M0 470 Q450 440 900 480 L900 900 L0 900 Z" fill="#E3C996"/><path d="M0 640 Q450 600 900 650 L900 900 L0 900 Z" fill="#DAB983"/>`
      g += tent(80, 520, .7, '#C98A5E') + tent(250, 510, .6, '#E2D3B5', '#C98A5E') + tent(610, 505, .6, '#B2604A') + tent(880, 520, .7, '#E2D3B5', '#9B6B78') + tent(560, 560, .55, '#9B6B78')
      // 1 quail
      ;[[90, 250], [140, 226], [200, 262], [250, 236], [300, 270], [120, 300], [180, 318], [260, 306], [330, 232], [220, 206]].forEach(([x, y], i) => g += quail(x, y, .95, i % 2 ? 1 : -1))
      g += person(130, 690, .92, { robe: '#93473A', cover: '#E9D9B8', eyes: 'open', pose: 'up', mouth: 'frown' })
      // 2 calf
      g += `<g transform="translate(450 610)"><rect x="-62" y="-40" width="124" height="42" rx="4" fill="#B9A486"/><rect x="-70" y="-48" width="140" height="12" rx="3" fill="#CDB997"/></g>` + calf(446, 562, 1) + star(400, 500, .7, '#FCE7A6') + star(510, 512, .6, '#FCE7A6')
      g += person(568, 712, .92, { robe: '#C98A5E', cover: '#F1E7D3', beard: '#4A3426', pose: 'up' })
      // 3 moab
      g += `<g transform="translate(745 580)"><path d="M-70 0 L-10 -78 Q0 -86 10 -78 L70 0 Z" fill="#8E2B3E"/><path d="M-52 -22 L52 -22 M-34 -46 L34 -46" stroke="#C2566A" stroke-width="8"/><path d="M-16 0 L0 -40 L16 0 Z" fill="#3A1A22"/><rect x="86" y="-110" width="26" height="110" rx="10" fill="#6E7B6A"/><path d="M90 -118 Q99 -134 108 -118" stroke="#D7A23E" stroke-width="5" fill="none"/></g>`
      // 4 snakes
      g += rock(720, 800, 150, 70, '#B79A78') + rock(860, 808, 120, 62, '#A98C6A') + snake(640, 760, .9) + snake(770, 770, .7, -1) + snake(690, 814, .75)
      g += `<g transform="translate(836 770)"><path d="M0 0 L0 -212" stroke="#7A5235" stroke-width="8" stroke-linecap="round"/><path d="M-2 -196 C28 -182 -28 -158 0 -140 S28 -102 -2 -86" stroke="#B0793A" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="2" cy="-200" rx="9" ry="6" fill="#B0793A"/></g>`
      // 5 grumbling
      g += person(310, 872, 1.05, { robe: '#5E8FAE', cover: '#EDE6DA', eyes: 'worried', pose: 'hip', mouth: 'frown' }) + person(410, 880, 1.05, { robe: '#7A5235', cover: '#E8DCC4', beard: '#3A261A', eyes: 'angry', pose: 'hip' })
      g += `<g transform="translate(196 760)"><path d="M48 18 L80 40 L58 12 Z" fill="#FFF8EA"/><ellipse rx="66" ry="40" fill="#FFF8EA"/><path d="M-40 -4 l10 -12 l10 16 l10 -18 l10 20 l10 -16 l10 14 l10 -10 M-28 16 l8 -8 l8 10 l8 -10 l8 10 l8 -8" stroke="#8E1B2E" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`
      const n = (i: number) => `<text y="8" text-anchor="middle" class="${SVD}" font-size="24" fill="#FFF8EA">${i}</text>`
      g += hot(206, 282, '1', 'Mengingini yang jahat', n(1)) + hot(450, 470, '2', 'Menyembah berhala', n(2)) + hot(745, 452, '3', 'Percabulan', n(3)) + hot(760, 728, '4', 'Mencobai Tuhan', n(4)) + hot(196, 700, '5', 'Bersungut-sungut', n(5))
      return SVG(g, grad('s5sky', '#F0C487', '#F6E4C2'), 'Perkemahan Israel di kaki Gunung Sinai dengan lima peristiwa')
    },
    panel: () => `<div class="${DOTS}" id="s5dots"><i></i><i></i><i></i><i></i><i></i><span id="s5n">0 dari 5</span></div><div id="s5card">${B('Ada lima titik di perkemahan. Setiap titik adalah satu perbuatan yang Paulus sebut dalam 1 Korintus 10. Ketuk satu per satu.')}</div><div id="s5end"></div>`,
    mount(c) {
      const seen = new Set<string>(), cardEl = q<HTMLElement>(c.panel, '#s5card'), dots = qa<HTMLElement>(c.panel, '#s5dots i'), n = q<HTMLElement>(c.panel, '#s5n'), end = q<HTMLElement>(c.panel, '#s5end')
      onHot(c.svg, (id, el) => {
        const d = DEEDS[id]; el.classList.add('seen'); seen.add(id)
        cardEl.innerHTML = card(d[0], d[1], d[2], d[3])
        dots.forEach((x, i) => x.classList.toggle('on', i < seen.size)); n.textContent = `${seen.size} dari 5`
        c.panel.scrollTop = 0
        if (seen.size === 5 && !end.innerHTML) {
          end.innerHTML = V('Semuanya ini telah menimpa mereka sebagai contoh dan dituliskan untuk menjadi peringatan bagi kita yang hidup pada waktu, di mana zaman akhir telah tiba.', '1 Korintus 10:11')
          c.setHint('Lima-limanya ditulis untuk kita'); c.done()
        } else if (seen.size < 5) c.setHint(`Masih ada ${5 - seen.size} titik lagi`)
      })
    },
  },

  /* 6 — iceberg */
  {
    eyebrow: 'Bagian 6 · Akar masalah', t1: 'Gunung Es', t2: 'Perbuatan hanyalah output', color: '#235A7C',
    hint: 'Ketuk Selami untuk turun lebih dalam',
    art() {
      let w = `<rect width="900" height="336" fill="url(#s6sky)"/><circle cx="760" cy="150" r="46" fill="#FBF1D2"/>` + cloud(170, 180, .9) + cloud(640, 112, .6, .8)
      w += `<rect y="330" width="900" height="1800" fill="url(#s6sea)"/>`
      w += `<path d="M250 332 C180 520 110 760 150 1000 C190 1240 120 1450 230 1680 C320 1880 420 2010 500 2040 C600 1990 720 1820 760 1600 C800 1380 860 1120 800 880 C760 700 720 520 655 332 Z" fill="url(#s6ice)" opacity=".92"/>`
      w += `<path d="M300 400 L420 600 L260 760 Z M600 480 L740 700 L640 900 Z M220 1180 L360 1320 L250 1500 Z M640 1300 L760 1460 L620 1640 Z" fill="#E6F4F8" opacity=".12"/>`
      w += `<path d="M262 334 L330 232 L382 252 L452 140 L502 176 L562 120 L612 212 L652 334 Z" fill="#F7FBFC"/><path d="M562 120 L612 212 L652 334 L548 334 Z" fill="#DCEAF1"/><path d="M452 140 L502 176 L470 334 L420 334 Z" fill="#EAF3F7"/>`
      w += calf(410, 326, .42) + `<g transform="translate(560 268)"><ellipse rx="40" ry="26" fill="#FFFFFF" stroke="#3E2A1E" stroke-width="3"/><path d="M-22 2 l7 -9 l7 12 l7 -13 l7 13 l7 -10 l7 8" stroke="#8E1B2E" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-14 24 L-24 40 L-2 25" fill="#FFFFFF" stroke="#3E2A1E" stroke-width="3"/></g>`
      w += `<rect y="328" width="900" height="5" fill="#EAF6FA" opacity=".85"/><path d="M0 346 q30 -10 60 0 t60 0 t60 0 M700 350 q30 -10 60 0 t60 0 t60 0" stroke="#D7ECF4" stroke-width="3" fill="none" opacity=".7"/>`
      w += pill(40, 286, 'YANG TERLIHAT', '#3E2A1E', '#F7EFDF', 22) + pill(40, 392, 'YANG TIDAK TERLIHAT', '#F7EFDF', '#235A7C', 22)
      const band = (y: number, t: string, col: string, i: number) => `<g class="band ${FADE}" data-i="${i}"><rect x="235" y="${y - 36}" width="430" height="72" rx="36" fill="${col}"/><text x="450" y="${y + 11}" text-anchor="middle" class="${SVD}" font-size="31" fill="#FFFFFF" letter-spacing="1.5">${t}</text></g>`
      w += band(640, 'POLA / TINDAKAN BERULANG', '#B44A73', 1) + band(1080, 'STRUKTUR PENUNJANG', '#6E4F9A', 2) + band(1500, 'MENTAL MODEL · KEYAKINAN', '#2E58A0', 3)
      w += `<g transform="translate(450 820)"><path d="M-74 0 A74 74 0 1 1 0 74" stroke="#F6D6E4" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M-16 58 L4 74 L-16 90" stroke="#F6D6E4" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text y="18" text-anchor="middle" class="${SVD}" font-size="56" fill="#FFFFFF">10×</text></g>`
      w += `<g transform="translate(450 1260)" stroke="#E5DDF4" stroke-width="9" stroke-linecap="round" fill="none"><path d="M-110 -80 V90 M-37 -80 V90 M37 -80 V90 M110 -80 V90 M-130 -60 H130 M-130 10 H130 M-130 80 H130 M-110 -60 L-37 10 M-37 -60 L37 10 M37 -60 L110 10 M-110 10 L-37 80 M37 10 L110 80"/></g>`
      w += `<g transform="translate(450 1700)"><path d="M-90 40 L0 -90 L90 40 Z" fill="#D9B77E"/><path d="M0 -90 L90 40 L20 40 Z" fill="#B8935C"/><g stroke="#C9D6EA" stroke-width="9" fill="none">${Array.from({ length: 8 }, (_, i) => i % 2 ? `<path d="M${-196 + i * 52} 70 h40"/>` : `<ellipse cx="${-176 + i * 52}" cy="70" rx="26" ry="14"/>`).join('')}</g><text y="140" text-anchor="middle" class="${SVD}" font-size="30" fill="#F7EFDF" letter-spacing="2">MESIR MASIH DI DALAM PIKIRAN</text></g>`
      const defs = grad('s6sky', '#CBE3EC', '#F3EFE2') + grad('s6sea', '#5D9CBE', '#235A7C', '#0E2638') + grad('s6ice', '#B9DFEC', '#6FA9C9', '#3D7299')
      return SVG(`<g id="s6world" style="transition:transform 1s cubic-bezier(.6,0,.2,1)">${w}</g>`, defs, 'Gunung es: perbuatan terlihat di atas air, akar perilaku tersembunyi di bawahnya')
    },
    panel: () => `<div class="${CHIPS}" id="s6chips">${LAYERS.map((l, i) => `<button class="${CHIP} ${CHIP_BTN}${i ? '' : ' sel'}" data-i="${i}" aria-pressed="${i ? 'false' : 'true'}">${l[0]}</button>`).join('')}</div><p class="${BODY}" id="s6body"></p><div id="s6verse"></div><button class="${DIVE}" id="s6dive"><span>Selami lebih dalam</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button>`,
    mount(c) {
      const world = q(c.svg, '#s6world'), bands = qa(c.svg, '.band'), chips = qa<HTMLElement>(c.panel, '#s6chips button'), body = q<HTMLElement>(c.panel, '#s6body'), vs = q<HTMLElement>(c.panel, '#s6verse'), dive = q<HTMLElement>(c.panel, '#s6dive')
      const TY = [0, -420, -860, -1240]; let d = 0
      const set = (i: number) => {
        d = i; world.style.transform = `translateY(${TY[i]}px)`
        bands.forEach((b) => b.setAttribute('opacity', +(b.dataset.i ?? 0) === i || i === 0 ? '1' : '.45'))
        chips.forEach((ch, k) => { ch.classList.toggle('sel', k === i); ch.setAttribute('aria-pressed', String(k === i)) })
        body.innerHTML = LAYERS[i][1]; vs.innerHTML = V(LAYERS[i][2][0], LAYERS[i][2][1])
        q<HTMLElement>(dive, 'span').textContent = i < 3 ? 'Selami lebih dalam' : 'Kembali ke permukaan'
        if (i === 3) { c.setHint('Akar perilaku ada di dalam pikiran'); c.done() }
      }
      chips.forEach((ch) => ch.addEventListener('click', () => set(+(ch.dataset.i ?? 0))))
      dive.addEventListener('click', () => set(d < 3 ? d + 1 : 0))
      set(0)
    },
  },

  /* 7 — two voices */
  {
    eyebrow: 'Bagian 7 · Sumber pikiran', t1: 'Dua Suara', t2: 'Yang masuk ke pikiran', color: '#5B6C3A',
    hint: 'Ketuk salah satu suara di gambar',
    art() {
      let g = `<rect width="900" height="900" fill="url(#s7bg)"/>`
      g += `<g fill="#9DB06A">${[[60, 420, 90], [200, 380, 80], [760, 390, 96], [880, 430, 80], [330, 440, 70], [620, 440, 70]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><g fill="#879B57">${[[120, 480, 80], [820, 480, 86], [420, 500, 70], [560, 500, 70]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`
      g += `<path id="s7beam" class="${FADE}" d="M90 0 L270 0 L470 600 L330 600 Z" fill="#FFF8E0" opacity=".35"/>`
      g += `<path d="M0 630 Q450 590 900 640 L900 900 L0 900 Z" fill="#A9B66C"/><path d="M0 740 Q450 700 900 750 L900 900 L0 900 Z" fill="#97A65E"/>`
      g += `<path d="M440 800 Q448 640 430 520 Q420 440 380 400 L404 392 Q440 430 452 480 Q470 420 520 390 L534 404 Q482 440 474 520 Q466 640 500 800 Z" fill="#7A5A3A"/>`
      g += `<g fill="#6E8A46">${[[470, 300, 150], [340, 330, 100], [600, 320, 110], [420, 210, 100], [540, 210, 96], [480, 390, 90]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><g fill="#7F9A50">${[[400, 260, 70], [540, 270, 72], [470, 200, 64], [620, 360, 52], [330, 380, 48]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`
      g += `<g>${[[360, 290], [430, 350], [510, 240], [580, 330], [470, 410], [400, 200], [620, 260], [330, 370], [540, 400], [460, 290]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="#C0392B"/><circle cx="${x - 4}" cy="${y - 4}" r="3.5" fill="#F2A08E"/>`).join('')}</g>`
      g += `<path d="M432 640 C400 620 500 600 470 580 C440 560 500 540 486 520 C470 500 520 486 540 470" stroke="#E07B39" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M432 640 C400 620 500 600 470 580 C440 560 500 540 486 520 C470 500 520 486 540 470" stroke="#7A2E14" stroke-width="15" fill="none" stroke-dasharray="4 12"/><ellipse cx="552" cy="464" rx="15" ry="10" fill="#E07B39"/><circle cx="556" cy="460" r="2.4" fill="#2A1A12"/><path d="M566 466 L580 468 M576 467 L582 462 M576 467 L582 472" stroke="#B8322E" stroke-width="2" stroke-linecap="round"/>`
      g += `<g id="s7bloom" class="${FADE}" opacity="0">${[[90, 700], [170, 760], [260, 690], [640, 700], [760, 760], [840, 700], [560, 770], [360, 780]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><circle r="7" cx="-8" fill="${i % 2 ? '#F3C85C' : '#F2A6B8'}"/><circle r="7" cx="8" fill="${i % 2 ? '#F3C85C' : '#F2A6B8'}"/><circle r="7" cy="-8" fill="${i % 2 ? '#F3C85C' : '#F2A6B8'}"/><circle r="7" cy="8" fill="${i % 2 ? '#F3C85C' : '#F2A6B8'}"/><circle r="5" fill="#FFF6D8"/></g>`).join('')}${star(150, 560, 1) + star(760, 560, 1) + star(300, 140, .8)}</g>`
      g += person(250, 826, 1.36, { robe: '#C98A5E', inner: '#F1E2C6', cover: null, long: true, hair: '#3A261A', right: 'reach', eyes: 'open' })
      g += `<circle id="s7fruit" class="${FADE}" cx="351" cy="588" r="13" fill="#C0392B" opacity="0"/>`
      g += person(694, 836, 1.42, { robe: '#8A6A4A', inner: '#E9D9B8', cover: null, beard: '#3A261A', hair: '#3A261A', eyes: 'closed' })
      g += `<rect id="s7dark" class="${FADE}" width="900" height="900" fill="#2B1A12" opacity="0" pointer-events="none"/>`
      let th = ''; for (let i = 0; i < 24; i++) { const x = i * 40; th += `L${x + 10} ${812 - ((i * 37) % 60)} L${x + 22} 858 L${x + 30} ${828 - ((i * 53) % 40)} L${x + 40} 870 ` }
      g += `<path id="s7thorns" class="${FADE}" d="M0 900 L0 870 ${th} L900 900 Z" fill="#4A3A2C" opacity="0"/>`
      g += `<g id="s7outcome" class="${FADE}" opacity="0"></g>`
      g += `<g class="${HOT} bub" data-id="firman" tabindex="0" role="button" aria-label="Dengarkan Firman Tuhan"><path d="M220 228 L250 268 L262 226 Z" fill="#FFF9EC"/><rect x="40" y="96" width="330" height="136" rx="26" fill="#FFF9EC" stroke="#D7A23E" stroke-width="4"/><text x="205" y="146" text-anchor="middle" class="${SVD}" font-size="31" fill="#6B4A12">“Jangan kaumakan</text><text x="205" y="180" text-anchor="middle" class="${SVD}" font-size="31" fill="#6B4A12">buahnya...”</text><text x="205" y="212" text-anchor="middle" class="${SVB}" font-size="17" fill="#8A6A3A" letter-spacing="1">FIRMAN TUHAN · KEJ 2:17</text><circle class="${RING}" cx="364" cy="102" r="20"/><circle class="${CORE}" cx="364" cy="102" r="12"/></g>`
      g += `<g class="${HOT} bub" data-id="ular" tabindex="0" role="button" aria-label="Dengarkan kata ular"><path d="M600 440 L570 460 L622 432 Z" fill="#FBE4D8"/><rect x="560" y="300" width="314" height="136" rx="26" fill="#FBE4D8" stroke="#B8322E" stroke-width="4"/><text x="717" y="350" text-anchor="middle" class="${SVD}" font-size="31" fill="#7A2418">“Sekali-kali kamu</text><text x="717" y="384" text-anchor="middle" class="${SVD}" font-size="31" fill="#7A2418">tidak akan mati”</text><text x="717" y="416" text-anchor="middle" class="${SVB}" font-size="17" fill="#9A4A3A" letter-spacing="1">KATA ULAR · KEJ 3:4</text><circle class="${RING}" cx="868" cy="306" r="20"/><circle class="${CORE}" cx="868" cy="306" r="12"/></g>`
      return SVG(g, grad('s7bg', '#CFE0B0', '#F2E6C6'), 'Taman Eden: pohon dengan buah, ular, Hawa dan Adam, serta dua suara')
    },
    panel: () => B('Sebelum ada tindakan, selalu ada suara yang dipercaya. Pilih suara yang didengar, lalu lihat ke mana arahnya.')
      + `<div class="${TOGGLE}"><button class="${TOGGLE_BTN} bg-[#F3E2B5] text-[#6B4A12]" data-v="firman" aria-pressed="false">Firman Tuhan</button><button class="${TOGGLE_BTN} bg-[#F2D2C8] text-[#7A2418]" data-v="ular" aria-pressed="false">Kata ular</button></div>`
      + `<div class="${CHAIN}" id="s7chain">${['Sumber', 'Pola pikir', 'Tindakan', 'Kebiasaan', 'Karakter', 'Masa depan'].map((t) => `<span class="${CHAIN_STEP}">${t}</span>`).join(`<em class="${CHAIN_SEP}">›</em>`)}</div><p class="${OUTCOME}" id="s7out"></p><div id="s7verse"></div>`,
    mount(c) {
      const s = c.svg, btns = qa<HTMLElement>(c.panel, '[data-v]'), chain = q<HTMLElement>(c.panel, '#s7chain'), out = q<HTMLElement>(c.panel, '#s7out'), vs = q<HTMLElement>(c.panel, '#s7verse')
      const picked: Record<string, boolean> = {}
      const set = (v: string) => {
        picked[v] = true; const good = v === 'firman'
        btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)))
        chain.classList.remove('good', 'bad'); chain.classList.add(good ? 'good' : 'bad')
        q(s, '#s7dark').setAttribute('opacity', good ? '0' : '.4'); q(s, '#s7thorns').setAttribute('opacity', good ? '0' : '1'); q(s, '#s7fruit').setAttribute('opacity', good ? '0' : '1')
        q(s, '#s7bloom').setAttribute('opacity', good ? '1' : '0'); q(s, '#s7beam').setAttribute('opacity', good ? '.6' : '.12')
        qa(s, '.bub').forEach((b) => b.classList.toggle('seen', !!picked[b.dataset.id ?? '']))
        const o = q(s, '#s7outcome')
        o.innerHTML = good ? pill(450, 560, 'SEGALA YANG BAIK', '#F7EFDF', '#5B6C3A', 30, 'middle') : pill(450, 560, 'DIBUANG DARI TAMAN EDEN', '#2B1A12', '#F7EFDF', 30, 'middle')
        o.setAttribute('opacity', '1')
        out.innerHTML = good ? 'Masa depan: <b>Taman Eden</b>, rencana Tuhan berisi segala yang baik.' : 'Masa depan: susah payah, tanah terkutuk, dan <b>dibuang dari Taman Eden</b> (Kej 3:16-24).'
        vs.innerHTML = good
          ? V('...tetapi pohon pengetahuan tentang yang baik dan yang jahat itu, janganlah kaumakan buahnya, sebab pada hari engkau memakannya, pastilah engkau mati.', 'Kejadian 2:17')
          : V('Tetapi ular itu berkata kepada perempuan itu: “Sekali-kali kamu tidak akan mati.”', 'Kejadian 3:4')
        if (picked.firman && picked.ular) { c.setHint('Yang masuk ke pikiran mengubah masa depan'); c.done() } else c.setHint(good ? 'Sekarang coba dengarkan kata ular' : 'Sekarang coba dengarkan Firman Tuhan')
      }
      btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.v ?? '')))
      onHot(s, (id) => set(id))
    },
  },

  /* 8 — five sources */
  {
    eyebrow: 'Bagian 8 · Lima sumber', t1: 'Sumber Pikiran', t2: 'Pembentuk pola pikir', color: '#235A7C',
    hint: 'Ketuk kelima sumber di sekitar kepala',
    art() {
      const head = 'M335 700 C320 640 290 590 292 500 C294 380 360 262 470 252 C560 246 610 300 606 372 C604 400 612 414 640 446 C646 454 640 462 616 464 C620 478 622 486 610 494 C620 502 618 516 604 524 C606 548 598 566 570 572 C548 576 538 590 536 640 L534 700 Z'
      let g = `<rect width="900" height="900" fill="url(#s8bg)"/><circle cx="450" cy="540" r="330" fill="#FFFFFF" opacity=".35"/>`
      g += `<g id="s8streams"></g>`
      g += `<g transform="translate(0 80)"><path d="${head}" fill="url(#s8head)"/><g clip-path="url(#s8clip)"><path d="M436 610 Q440 520 436 430 L452 430 Q450 520 456 610 Z" fill="#E4F2F7"/><g stroke="#CFE6EF" stroke-width="6" fill="none" stroke-linecap="round"><path d="M446 600 Q420 640 380 660 M446 600 Q470 650 520 668 M446 610 Q446 650 440 700 M400 650 Q380 680 350 690 M500 660 Q520 690 534 700"/></g><g fill="#E4F2F7" id="s8canopy">${[[446, 380, 70], [390, 400, 50], [500, 396, 52], [420, 330, 52], [480, 330, 50]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><g id="s8leaves"></g><path d="M280 560 Q450 540 640 560" stroke="#FFFFFF" stroke-width="3" opacity=".5" fill="none"/></g></g>`
      const icon: Record<string, string> = {
        kel: `<path d="M-30 6 L0 -24 L30 6 L22 6 L22 30 L-22 30 L-22 6 Z" fill="#B2604A"/><path d="M0 22 C-14 12 -10 0 0 6 C10 0 14 12 0 22 Z" fill="#F7EFDF"/>`,
        per: `<circle cx="-22" cy="-6" r="10" fill="#C98A5E"/><circle cx="22" cy="-6" r="10" fill="#7F8B4F"/><circle cx="0" cy="-12" r="12" fill="#5E8FAE"/><path d="M-36 24 Q-22 4 -8 24 Z M8 24 Q22 4 36 24 Z" fill="#9B7A5B"/><path d="M-16 26 Q0 0 16 26 Z" fill="#3F6F8C"/>`,
        fir: `<path d="M0 -14 Q-20 -24 -38 -18 L-38 22 Q-20 16 0 26 Z" fill="#FFFDF5" stroke="#8A6A3A" stroke-width="3"/><path d="M0 -14 Q20 -24 38 -18 L38 22 Q20 16 0 26 Z" fill="#FFFDF5" stroke="#8A6A3A" stroke-width="3"/><path d="M-30 -6 Q-16 -10 -6 -4 M-30 4 Q-16 0 -6 6 M30 -6 Q16 -10 6 -4 M30 4 Q16 0 6 6" stroke="#C9B48E" stroke-width="2.4" fill="none"/>`,
        dun: `<rect x="-20" y="-34" width="40" height="68" rx="8" fill="#3E2A1E"/><rect x="-15" y="-26" width="30" height="48" rx="3" fill="#F2D2C8"/><path d="M0 4 C-10 -4 -6 -14 0 -9 C6 -14 10 -4 0 4 Z" fill="#B8322E"/><circle cx="-6" cy="14" r="3" fill="#4C82A3"/><circle cx="6" cy="14" r="3" fill="#D7A23E"/>`,
        dir: `<path d="M0 22 L0 38" stroke="#9C7A3C" stroke-width="8" stroke-linecap="round"/><ellipse cx="0" cy="-6" rx="24" ry="30" fill="#D7A23E"/><ellipse cx="0" cy="-6" rx="17" ry="23" fill="#CFE6EF"/><path d="M-8 -18 L4 -26 M-10 -8 L8 -20" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>`,
      }
      SOURCES.forEach((s) => {
        const lab = s.y < 300 ? s.y - 82 : s.y + 92
        g += `<g class="${HOT} src" data-id="${s.id}" tabindex="0" role="button" aria-label="${s.n}" transform="translate(${s.x} ${s.y})"><circle r="66" fill="transparent"/><circle class="${RING}" r="58"/><circle r="56" fill="#FBF6EC" stroke="${s.c}" stroke-width="5"/>${icon[s.id]}</g>`
        g += pill(s.x, lab, s.l.toUpperCase(), '#F7EFDF', '#3E2A1E', 19, 'middle')
      })
      const defs = grad('s8bg', '#DCE8EC', '#F4EAD6') + `<linearGradient id="s8head" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DB6CF"/><stop offset=".55" stop-color="#3F7EA0"/><stop offset=".56" stop-color="#2E5E7C"/><stop offset="1" stop-color="#21465E"/></linearGradient><clipPath id="s8clip"><path d="${head}"/></clipPath>`
      return SVG(g, defs, 'Kepala manusia dengan pohon di dalamnya, dikelilingi lima sumber pikiran')
    },
    panel: () => `<div class="${DOTS}" id="s8dots"><i></i><i></i><i></i><i></i><i></i><span id="s8n">0 dari 5</span></div><div id="s8card">${B('Pola pikir terbentuk dari apa yang terus masuk ke dalam pikiran. Ada lima sumber utama. Ketuk setiap sumber untuk melihat apa yang dikatakan Firman.')}</div>`,
    mount(c) {
      const seen = new Set<string>(), streams = q(c.svg, '#s8streams'), leaves = q(c.svg, '#s8leaves'), cardEl = q<HTMLElement>(c.panel, '#s8card'), dots = qa<HTMLElement>(c.panel, '#s8dots i'), n = q<HTMLElement>(c.panel, '#s8n')
      onHot(c.svg, (id, el) => {
        const s = SOURCES.find((x) => x.id === id)!; el.classList.add('seen')
        if (!seen.has(id)) {
          seen.add(id)
          const tx = 450, ty = 510, mx = (s.x + tx) / 2 + (s.x < 450 ? -40 : s.x > 450 ? 40 : 0), my = (s.y + ty) / 2 - 40
          streams.insertAdjacentHTML('beforeend', `<path d="M${s.x} ${s.y} Q${mx} ${my} ${tx} ${ty}" stroke="${s.c}" stroke-width="12" fill="none" stroke-linecap="round" opacity=".55"/><path class="${STREAM}" d="M${s.x} ${s.y} Q${mx} ${my} ${tx} ${ty}" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`)
          const k = seen.size, pts = [[410, 350], [492, 360], [446, 312], [380, 390], [514, 404]]
          leaves.insertAdjacentHTML('beforeend', `<circle cx="${pts[k - 1][0]}" cy="${pts[k - 1][1]}" r="26" fill="${s.c}" opacity=".85"/>`)
        }
        cardEl.innerHTML = card(s.n, s.v[1], `<i class="${VERSE_FONT}">${s.v[0]}</i>`, s.t, `color:${s.c === '#D7A23E' ? '#8A6A1A' : s.c}`)
        dots.forEach((x, i) => x.classList.toggle('on', i < seen.size)); n.textContent = `${seen.size} dari 5`
        if (seen.size === 5) { c.setHint('Sumber mana yang paling sering kamu dengar?'); c.done() } else c.setHint(`Masih ada ${5 - seen.size} sumber lagi`)
      })
    },
  },

  /* 9 — enter */
  {
    eyebrow: 'Penutup', t1: 'Masuklah', t2: 'Jangan berhenti di padang gurun', color: '#5B6C3A', next: 'Ulangi',
    hint: 'Centang keempat langkah di bawah',
    art() {
      let g = `<rect width="900" height="900" fill="url(#s9sky)"/><g id="s9sun" style="transition:transform 2.4s ease"><circle cx="450" cy="520" r="150" fill="#FCE6B0" opacity=".45"/><circle cx="450" cy="520" r="84" fill="#FDEFC8"/></g>` + cloud(170, 170, 1) + cloud(730, 130, .8)
      g += `<path d="M0 470 L130 420 L260 450 L390 400 L520 440 L660 396 L790 430 L900 410 L900 560 L0 560 Z" fill="#B7A2A0"/>`
      g += `<path d="M0 520 Q200 470 450 500 Q700 530 900 486 L900 600 L0 600 Z" fill="#98A55C"/>`
      g += `<g transform="translate(680 470)"><rect x="-60" y="-26" width="120" height="34" fill="#E3CFA6"/><rect x="-74" y="-50" width="22" height="58" fill="#D6BE90"/><rect x="52" y="-50" width="22" height="58" fill="#D6BE90"/><path d="M-10 8 L-10 -8 Q0 -18 10 -8 L10 8 Z" fill="#6B4A32"/></g>`
      g += palm(80, 540, .8, 1) + palm(170, 530, 1, -1) + tree(300, 540, .8) + palm(800, 520, .9, -1) + tree(560, 530, .7, '#9AA466') + star(250, 470, .9) + star(620, 450, .8)
      g += `<path d="M0 560 Q450 540 900 566 L900 664 Q450 640 0 668 Z" fill="#6FA3BE"/><path d="M80 600 q20 -6 40 0 M300 620 q20 -6 40 0 M600 596 q20 -6 40 0 M780 620 q20 -6 40 0" stroke="#EAF4F6" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`
      g += `<path d="M0 660 Q450 636 900 664 L900 900 L0 900 Z" fill="#E7D0A0"/><path d="M0 780 Q450 740 900 790 L900 900 L0 900 Z" fill="#DDBF89"/>`
      g += [[452, 654], [430, 626], [460, 598], [440, 572]].map(([x, y], i) => `<ellipse class="${STONE}" data-i="${i}" cx="${x}" cy="${y}" rx="40" ry="12" fill="#A89A88" stroke="#8E8070" stroke-width="3"/>`).join('')
      g += `<g id="s9spark" class="${FADE}" opacity="0">${star(360, 500, 1.2) + star(520, 480, 1) + star(450, 430, 1.4) + star(600, 520, .9) + star(300, 540, .8)}</g>`
      g += `<g class="${PAIR}" id="s9pair">${person(400, 862, 1.32, { back: true, robe: '#667640', mantle: '#C98A5E', cover: '#F1E7D3' })}${person(520, 870, 1.32, { back: true, robe: '#4C82A3', mantle: '#E8DCC4', cover: '#E9D9B8' })}</g>`
      return SVG(g, grad('s9sky', '#F6C27E', '#F8E6C4'), 'Yosua dan Kaleb berdiri di tepi Sungai Yordan memandang tanah Kanaan')
    },
    panel: () => B('Generasi yang keluar tidak otomatis masuk. Kamu sudah keluar. Sekarang langkah berikutnya adalah <b>masuk</b>.')
      + `<div class="${CHECKS}">${STEPS.map((t, i) => `<button class="${CHECK_BTN}" data-i="${i}" aria-pressed="false"><span class="${CHECK_BOX}">${CHECK}</span><span>${t}</span></button>`).join('')}</div><div id="s9end"></div>`
      + V('Janganlah kamu menjadi serupa dengan dunia ini, tetapi berubahlah oleh pembaharuan budimu, sehingga kamu dapat membedakan manakah kehendak Allah: apa yang baik, yang berkenan kepada Allah dan yang sempurna.', 'Roma 12:2'),
    mount(c) {
      const btns = qa<HTMLElement>(c.panel, '[data-i]'), stones = qa(c.svg, '.stone'), pair = q(c.svg, '#s9pair'), sun = q(c.svg, '#s9sun'), end = q<HTMLElement>(c.panel, '#s9end')
      const up = () => {
        const on = btns.filter((b) => b.getAttribute('aria-pressed') === 'true').length
        stones.forEach((s, i) => s.classList.toggle('on', i < on)); sun.style.transform = `translateY(${-50 * on}px)`
        const all = on === 4
        pair.classList.toggle('go', all); q(c.svg, '#s9spark').setAttribute('opacity', all ? '1' : '0')
        end.innerHTML = all ? `<p class="${FINALE}">Kamu sudah keluar.<br>Sekarang, masuklah.</p>` : ''
        if (all) { c.setHint('Ulangi cerita atau bagikan ke kelompokmu'); c.done(); end.scrollIntoView({ block: 'nearest', behavior: c.rm ? 'auto' : 'smooth' }) }
        else c.setHint(on ? `${4 - on} langkah lagi untuk menyeberang` : 'Centang keempat langkah di bawah')
      }
      btns.forEach((b) => b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); up() }))
      up()
    },
  },
]

export const KELUAR_GAGAL_MASUK: Story = { badge: '#1 · Pola Pikir', label: 'Story interaktif: Mereka Keluar Tetapi Gagal Masuk', scenes }
