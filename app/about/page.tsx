import type { Metadata } from 'next'
import { Brush, Crown, CtaButtons, Dot, Heading, Heart, HL, LIFT, MK, PRESS, Ring, Scribble, Smiley, Snap, Strip, Tape, Torn, ZineFooter, ZineHeader, ZinePage, torn, type Tone } from '@/components/landing/zine'

export const metadata: Metadata = {
  title: 'Tentang LevelUP — Visi, Misi & Values',
  description:
    'LevelUP, Divisi Pemuda PPHTGD: mitra gereja membangun generasi muda yang menyembah, bertumbuh di dalam Kristus, dan mengambil bagian dalam Amanat Agung.',
}

/** Copy from LevelUP Community Profile (PROFILE_LUP.pdf) */
const STORY = [
  {
    n: '2019',
    l: 'Gerakan pujian & penyembahan',
    t: 'Sejak tahun 2019, LevelUP membangun jejaring dan menjangkau generasi muda melalui gerakan pujian dan penyembahan yang melibatkan gereja-gereja lokal di berbagai kota di Indonesia.',
    note: 'bg-[#ffe36e] -rotate-2',
  },
  {
    n: '2025',
    l: 'DeeperWP · gerakan pemuridan',
    t: 'Memasuki tahun 2025, LevelUP melangkah lebih jauh melalui DeeperWP, sebuah gerakan pemuridan yang dirancang untuk memperlengkapi generasi muda agar tidak berhenti hanya pada pengalaman bersama Tuhan, tetapi bertumbuh menjadi murid Kristus yang dewasa, berbuah, dan mampu memuridkan orang lain.',
    note: 'bg-[#fffdf7] rotate-1 sm:translate-y-4',
  },
  {
    n: '44',
    l: 'kota & kabupaten',
    t: 'Hari ini, LevelUP telah hadir di 44 kota dan kabupaten di Indonesia, dan akan terus hadir di kota lainnya membangun jejaring, menjangkau generasi, dan bermitra dengan gereja lokal di berbagai daerah.',
    note: 'bg-[#d9ccff] -rotate-1',
  },
] as const

const MISI = [
  ['Mengembangkan kerjasama dan keselarasan dengan PPHTGD dalam membangun jaringan pelayanan LevelUP di wilayah masing-masing', 'bg-[#ffe36e] -rotate-2'],
  ['Mengembangkan pelayanan yang berfokus pada gaya hidup menyembah dan berdoa serta pemuridan yang Alkitabiah dan aplikatif bagi generasi muda', 'bg-[#fffdf7] rotate-1 sm:translate-y-5'],
  ['Membangun kemitraan strategis dengan gereja melalui penyembahan dan pemuridan bagi generasi muda sebagai strategi penuntasan Amanat Agung', 'bg-[#fffdf7] rotate-1'],
  ['Menghadirkan sistem, teknologi, dan sarana pendukung yang efektif untuk memperluas jangkauan dan memperkuat dampak pelayanan bagi generasi muda', 'bg-[#d9ccff] -rotate-1 sm:translate-y-5'],
] as const

const VALUES: { name: string; t: string; img: string; alt: string; tone: Tone }[] = [
  { name: 'Pray and Worship', t: 'Generasi muda LevelUP memiliki gaya hidup suka berdoa dan menyembah.', img: '/about/value-pray.jpg', alt: 'Anak muda LevelUP berdoa bersama', tone: 'red' },
  { name: 'Unity', t: 'Generasi muda LevelUP berkomitmen untuk terus bergerak dengan mengedepankan semangat persatuan interdenominasi dalam satu tubuh Kristus.', img: '/about/value-unity.jpg', alt: 'Anak muda LevelUP saling mendoakan', tone: 'ink' },
  { name: 'Excellence', t: 'Generasi muda LevelUP berkomitmen untuk memberikan usaha yang terbaik dalam segala aspek kehidupan.', img: '/about/value-excellence.jpg', alt: 'Anak muda LevelUP bersorak di luar ruangan', tone: 'yellow' },
  { name: 'Respect', t: 'Generasi muda LevelUP menghargai, mentaati, dan mendoakan orang tua jasmani maupun rohani, serta pemimpin yang Tuhan tempatkan sebagai bentuk ketaatan kepada Tuhan.', img: '/about/value-respect.jpg', alt: 'Anak muda LevelUP berfoto bersama di depan gereja', tone: 'ink' },
  { name: 'Accountable', t: 'Generasi muda LevelUP dapat diandalkan dan menyelesaikan panggilan Tuhan hingga tuntas.', img: '/about/value-accountable.jpg', alt: 'Anak muda LevelUP dalam ibadah', tone: 'red' },
]

const SECTIONS = [
  ['visi', 'Visi', 'red'],
  ['misi', 'Misi', 'paper'],
  ['values', 'Values', 'ink'],
] as const

export default function AboutPage() {
  return (
    <ZinePage>
      {/* Hero */}
      <section className="relative">
        <ZineHeader />
        <div className="grid lg:grid-cols-[1.05fr_.95fr] items-center gap-12 px-5 sm:px-8 pt-12 sm:pt-16 pb-20 max-w-6xl mx-auto">
          <div className="relative">
            <div className="opacity-0 animate-[fadeUp_0.6s_ease_forwards]">
              <Strip tone="ink" seed={2} className="px-3.5 py-2 text-[14px] -rotate-2">
                Tentang LevelUP
              </Strip>
            </div>
            <h1
              className={`${MK} mt-6 uppercase leading-[.92] text-[clamp(3.2rem,12vw,6rem)] opacity-0 animate-[fadeUp_0.6s_ease_forwards]`}
              style={{ animationDelay: '80ms' }}
            >
              <span className="block text-[.42em] leading-tight">From God&rsquo;s</span>
              <span className="inline-block text-[#e02a2f] -rotate-2">Presence</span>
              <span className="block mt-2 text-[.42em] leading-tight">to God&rsquo;s</span>
              <span className="relative inline-block">
                Mission
                <Brush className="-bottom-3 h-3.5" />
              </span>
            </h1>
            <div className="mt-9 opacity-0 animate-[fadeUp_0.6s_ease_forwards]" style={{ animationDelay: '160ms' }}>
              <Strip tone="yellow" seed={4} className="px-4 py-2.5 text-[clamp(.95rem,2.6vw,1.1rem)] rotate-1">
                The Jeremiah Generation
                <Crown className="w-7" />
              </Strip>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-stone-700">
                <b className="text-[#161616]">LevelUP merupakan Divisi Pemuda dari Persekutuan dan Pelayanan Hamba Tuhan Garis Depan (PPHTGD)</b> yang
                hadir dengan kerinduan untuk melihat kebangkitan generasi muda Gereja di Indonesia. LevelUP hadir untuk menjadi mitra bagi gereja lokal dalam
                membangun generasi yang mengasihi Tuhan, hidup dalam penyembahan, bertumbuh dalam Kristus, dan diperlengkapi untuk menjadi murid yang memuridkan.
              </p>
              <nav aria-label="Inti LevelUP" className="mt-8 flex flex-wrap gap-3">
                {SECTIONS.map(([id, label, tone], i) => (
                  <a key={id} href={`#${id}`} className={`${LIFT} ${PRESS}`}>
                    <Strip tone={tone} seed={20 + i} className={`h-11 px-4 text-[15px] ${i % 2 ? 'rotate-1' : '-rotate-1'}`}>
                      <span className="opacity-60">{`0${i + 1}`}</span>
                      {label}
                    </Strip>
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <div className="relative h-[430px] sm:h-[500px] w-full max-w-[460px] mx-auto">
            <div aria-hidden className="absolute left-[8%] top-[18%] w-[80%] h-[58%] bg-[#b9a3ff] -rotate-[8deg]" style={{ clipPath: torn(22, 8, 'tblr', 26) }} />
            <Snap src="/about/tentang.jpg" alt="Ribuan anak muda LevelUP beribadah dengan bendera LevelUP" ratio="aspect-[2/3]" sizes="(max-width: 640px) 45vw, 210px" seed={2} className="absolute left-[2%] top-[4%] w-[42%] -rotate-[6deg]" />
            <Snap src="/about/hero-worship.jpg" alt="Anak muda LevelUP mengangkat tangan saat penyembahan" sizes="(max-width: 640px) 55vw, 260px" seed={3} className="absolute right-0 top-[10%] w-[54%] rotate-[5deg]" />
            <Snap src="/about/hero-crowd.jpg" alt="Bendera LevelUP berkibar di tengah ibadah" sizes="(max-width: 640px) 60vw, 280px" seed={4} className="absolute left-[20%] bottom-[2%] w-[60%] -rotate-2 z-10" />
            <Torn seed={34} sides="tblr" amp={6} className="absolute -left-1 top-[52%] z-20 -rotate-[4deg]" inner="relative bg-[#161616] pl-4 pr-10 py-3">
              <p className={`${MK} text-[15px] leading-tight uppercase text-[#fbf6ec]`}>
                Sejak
                <br />
                2019
              </p>
              <Heart className="absolute right-2.5 bottom-2.5 w-6 text-[#e02a2f]" />
            </Torn>
            <Smiley className="absolute right-0 bottom-[8%] z-20 w-16 h-16 sm:w-[72px] sm:h-[72px] rotate-12 animate-[float_7s_ease-in-out_infinite]" />
            <Scribble className="absolute right-[4%] -top-3 z-20 w-12 text-[#e02a2f]" />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="px-5 sm:px-8 pb-24 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
          {STORY.map((s, i) => (
            <div key={s.n} className={`relative ${s.note} px-6 pt-8 pb-7 shadow-[0_16px_22px_-14px_rgba(40,30,10,.55)]`}>
              <Tape seed={50 + i} className={`-top-3 left-1/2 -translate-x-1/2 ${i % 2 ? 'rotate-3' : '-rotate-3'} h-6 w-20`} />
              <p className={`${MK} text-[clamp(2.6rem,7vw,3.4rem)] leading-none text-[#e02a2f]`}>{s.n}</p>
              <p className="mt-2 text-[15px] font-extrabold text-[#161616]">{s.l}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-stone-700">{s.t}</p>
            </div>
          ))}
        </div>
        <Torn seed={36} sides="tblr" amp={8} className="mt-16 max-w-3xl mx-auto rotate-1" inner="relative bg-[#161616] pl-6 pr-14 sm:pl-10 sm:pr-20 py-9 sm:py-10">
          <Strip tone="yellow" seed={37} className="px-3 py-1.5 text-[12.5px] -rotate-2">
            LevelUP percaya
          </Strip>
          <p className={`${MK} mt-4 text-[clamp(1.15rem,3vw,1.6rem)] leading-snug text-[#fbf6ec]`}>
            &ldquo;Kebangkitan generasi bukan sekadar tentang memenuhi sebuah ruangan, tetapi tentang membentuk kehidupan yang{' '}
            <span className="text-[#ffd83d]">diubahkan oleh Kristus</span>.&rdquo;
          </p>
          <p className="mt-4 text-[14px] text-stone-300">Hingga generasi ini bangkit, menjadi murid, dan mengambil bagian dalam penyelesaian Amanat Agung.</p>
          <Heart className="absolute right-5 bottom-6 w-8 text-[#e02a2f] rotate-12" />
        </Torn>
      </section>

      {/* Visi */}
      <section id="visi" className="scroll-mt-6 px-5 sm:px-8 pb-24 max-w-6xl mx-auto">
        <Heading n="01">Visi</Heading>
        <div className="mt-10 grid lg:grid-cols-[1fr_300px] items-center gap-12 lg:gap-8">
          <div className="relative">
            <Tape seed={41} className="-top-3 left-8 -rotate-6 h-7 w-24" />
            <Tape seed={42} className="-top-3 right-10 rotate-6 h-7 w-20" />
            <Torn
              seed={40}
              className="-rotate-1"
              inner="relative bg-[#fffdf7] px-6 sm:px-12 pt-14 pb-16 sm:pt-16 sm:pb-20"
              bg="repeating-linear-gradient(transparent 0 37px, rgba(70,100,170,.16) 37px 38px)"
            >
              <p className="text-[clamp(1.15rem,2.6vw,1.6rem)] font-extrabold leading-[1.5] tracking-[-.01em]">
                Menjadi <span className={HL}>mitra gereja</span> dalam membangun <span className={HL}>generasi muda</span> yang terhubung dengan Tuhan, bertumbuh
                dalam firman dan mengalami proses <span className={HL}>pemberdayaan oleh Roh Kudus</span> sehingga{' '}
                <span className={HL}>hidup mengasihi Tuhan Yesus,</span> <span className={HL}>tidak kompromi terhadap dosa</span> dan memenuhi panggilan Tuhan dalam
                hidupnya sebagai pemimpin di masa depan untuk menyelesaikan{' '}
                <span className="relative inline-block whitespace-nowrap px-1">
                  <span className={`${MK} font-normal text-[#e02a2f]`}>Amanat Agung</span>
                  <Ring />
                </span>
                <Dot />
              </p>
              <Crown className="absolute right-5 top-5 w-11 rotate-12 text-[#e02a2f]" />
              <Smiley className="absolute right-4 bottom-4 sm:right-8 sm:bottom-6 w-12 h-12 sm:w-14 sm:h-14 -rotate-12" />
            </Torn>
          </div>
          <div className="flex lg:flex-col justify-center gap-5">
            <Snap src="/about/visi-pray.jpg" alt="Anak muda berdoa dengan tangan terlipat" sizes="(max-width: 1024px) 45vw, 270px" seed={45} className="w-[48%] lg:w-[90%] -rotate-3 lg:self-start" />
            <Snap src="/about/visi-crowd.jpg" alt="Anak muda LevelUP bersama dalam ibadah" sizes="(max-width: 1024px) 45vw, 270px" seed={46} className="w-[48%] lg:w-[90%] mt-6 lg:mt-0 rotate-2 lg:self-end" />
          </div>
        </div>
      </section>

      {/* Misi */}
      <section id="misi" className="scroll-mt-6 px-5 sm:px-8 pb-28 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[.8fr_1.2fr] items-start gap-12 lg:gap-10">
          <div>
            <Heading n="02">Misi</Heading>
            <div className="relative mt-12 h-[280px] sm:h-[360px] max-w-[440px]">
              <Snap src="/about/misi-worship.jpg" alt="Anak muda menyembah Tuhan dalam ibadah LevelUP" sizes="(max-width: 640px) 70vw, 310px" seed={61} className="absolute left-0 top-0 w-[70%] -rotate-3" />
              <Snap src="/about/misi-hands.jpg" alt="Tangan terangkat dalam penyembahan" sizes="(max-width: 640px) 62vw, 275px" seed={62} className="absolute right-0 bottom-0 w-[62%] rotate-3 z-10" />
              <Heart className="absolute left-[6%] bottom-[4%] z-20 w-10 text-[#e02a2f] -rotate-12" />
            </div>
          </div>
          <ol className="grid sm:grid-cols-2 gap-8 sm:gap-x-6 sm:gap-y-10">
            {MISI.map(([t, note], i) => (
              <li key={i} className={`relative ${note} px-6 pt-8 pb-7 shadow-[0_16px_22px_-14px_rgba(40,30,10,.55)]`}>
                <Tape seed={70 + i} className={`-top-3 left-1/2 -translate-x-1/2 ${i % 2 ? 'rotate-3' : '-rotate-3'} h-6 w-20`} />
                <span className={`${MK} text-[clamp(2.6rem,7vw,3.2rem)] leading-none text-[#e02a2f]`}>{i + 1}</span>
                <p className="mt-3 text-[15px] font-semibold leading-relaxed text-stone-800">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="scroll-mt-6 px-5 sm:px-8 pb-24 max-w-6xl mx-auto">
        <div className="relative inline-block">
          <Heading n="03">Values</Heading>
          <Scribble className="absolute -right-12 -top-6 w-10 text-[#e02a2f]" />
        </div>
        <ul className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-12">
          {VALUES.map((v, i) => (
            <li
              key={v.name}
              className={`w-full max-w-[360px] sm:max-w-none sm:w-[calc(50%-.75rem)] lg:w-[calc((100%-3rem)/3)] ${i % 2 ? 'rotate-[1.2deg]' : '-rotate-[1.2deg]'} transition duration-300 hover:rotate-0 hover:-translate-y-1`}
            >
              <Snap src={v.img} alt={v.alt} ratio="aspect-[3/2]" sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 360px" seed={90 + i}>
                <Strip tone={v.tone} seed={95 + i} className="px-3 py-2 text-[16px] -rotate-1">
                  {v.name}
                </Strip>
                <p className="mt-3 text-[14.5px] leading-relaxed text-stone-700">{v.t}</p>
              </Snap>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-8 pb-16 max-w-5xl mx-auto">
        <div className="relative">
          <Tape seed={81} className="-top-3 left-6 -rotate-12 h-7 w-24" />
          <Tape seed={82} className="-top-3 right-6 rotate-12 h-7 w-24" />
          <Torn seed={84} amp={12} className="-rotate-1" inner="relative bg-[#fffdf7] px-6 py-16 sm:py-20 text-center">
            <Crown className="mx-auto w-14 -rotate-6" />
            <h2 className={`${MK} mt-3 text-[clamp(2.3rem,7.5vw,4.6rem)] leading-[.95] uppercase`}>
              Be part
              <br />
              <span className="relative inline-block text-[#e02a2f]">
                of us
                <Brush className="-bottom-2 h-3.5" />
              </span>
              <Dot />
            </h2>
            <p className="mt-7 text-[15.5px] text-stone-700 max-w-sm mx-auto">LevelUP hadir di 44 kota &amp; kabupaten. Gabung, dapet kartu anggota, ikut event di kotamu.</p>
            <CtaButtons className="mt-8 justify-center" />
            <p className="mt-8 text-[13px] text-stone-600">
              Info lebih lanjut:{' '}
              <a href="mailto:pphtgd.levelup@gmail.com" className="font-semibold text-[#161616] underline decoration-[#e02a2f] underline-offset-4 hover:text-[#e02a2f] transition">
                pphtgd.levelup@gmail.com
              </a>{' '}
              ·{' '}
              <a href="https://www.deeperwp.id" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#161616] underline decoration-[#e02a2f] underline-offset-4 hover:text-[#e02a2f] transition">
                deeperwp.id
              </a>
            </p>
            <Smiley className="absolute left-4 top-6 sm:left-10 sm:top-10 w-14 h-14 -rotate-12" />
            <Heart className="absolute right-5 bottom-6 sm:right-12 sm:bottom-10 w-11 text-[#e02a2f] rotate-12" />
            <Scribble className="absolute right-8 top-8 w-9 text-[#161616]" />
          </Torn>
        </div>
      </section>

      <ZineFooter />
    </ZinePage>
  )
}
