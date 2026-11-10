import Link from "next/link";
import { Brush, LIFT, MK, PRESS, Strip, Tape } from "@/components/landing/zine";
import { EventThumb } from "@/components/pwa/ui";
import type { WwLaporan } from "@/lib/air-hidup";
import { DropIcon, WATER } from "./bar";
import { fmtTanggal } from "./feed";

/** Bagian landing (gaya zine): penghitung + Kabar Terbaru (laporan WW per kota dengan Amin). Tanpa bar air per kota supaya kota tidak saling dibandingkan. Hanya baca. */
export function AirHidupLanding({
  nasional,
  laporan,
  ctaHref,
}: {
  nasional: { orang: number; kota: number };
  laporan: WwLaporan[];
  ctaHref: string;
}) {
  return (
    <section className="px-5 sm:px-8 pb-24 max-w-6xl mx-auto">
      <div className="flex items-end justify-between gap-4">
        <h2
          className={`${MK} relative text-[clamp(2rem,6vw,3.4rem)] leading-none uppercase`}
        >
          Minum <span style={{ color: WATER }}>Air Hidup</span>
          <Brush className="-bottom-3 h-3" />
        </h2>
        <Link href={ctaHref} className={`shrink-0 ${LIFT} ${PRESS}`}>
          <Strip
            tone="ink"
            seed={95}
            className="px-3.5 py-2 text-[13px] rotate-2"
          >
            Masuk
          </Strip>
        </Link>
      </div>
      <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-stone-700">
        Melayani itu menguras tenaga. WW adalah tempat kita minum lagi. Setiap
        kota yang sudah minum membagikan kabarnya, supaya kota lain ikut datang
        dan minum.
      </p>

      <div className="relative mt-8 max-w-md rotate-[-1deg] bg-[#fffdf7] px-5 py-4 shadow-[0_14px_22px_-12px_rgba(40,30,10,.5)]">
        <Tape seed={31} className="-top-3 left-6 -rotate-3 h-6 w-20" />
        <p className="flex items-center gap-2 text-[22px] font-extrabold leading-none">
          <DropIcon className="h-6 w-6" />
          <span style={{ color: WATER }}>{nasional.orang}</span> orang dari{" "}
          {nasional.kota} kota
        </p>
        <p className="mt-1.5 text-[13px] text-stone-600">
          sudah minum Air Hidup dalam 30 hari terakhir.
        </p>
      </div>

      {laporan.length > 0 && (
        <>
          <h3
            className={`${MK} mt-14 text-[clamp(1.5rem,4vw,2.2rem)] leading-none uppercase`}
          >
            Kabar Terbaru
          </h3>
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {laporan.slice(0, 6).map((l, i) => (
              <div
                key={l.id}
                className={`relative ${i % 2 ? "rotate-[1.2deg]" : "-rotate-[1.2deg]"}`}
              >
                <Tape
                  seed={i + 41}
                  className={`-top-3 left-1/2 -translate-x-1/2 ${i % 2 ? "rotate-3" : "-rotate-2"} h-6 w-20`}
                />
                <div className="bg-[#fffdf7] p-2.5 pb-4 shadow-[0_14px_22px_-12px_rgba(40,30,10,.5)]">
                  <EventThumb src={l.foto} className="w-full aspect-[16/10]" />
                  <div className="px-1 pt-3">
                    <Strip
                      tone="yellow"
                      seed={i + 51}
                      className="px-2.5 py-1.5 text-[11.5px]"
                    >
                      {fmtTanggal(l.tanggal)}
                    </Strip>
                    <h3 className="mt-2.5 text-[17px] font-extrabold leading-snug text-[#161616]">
                      {l.namaKota}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-stone-600 line-clamp-3">
                      “{l.isi}”
                    </p>
                    <p className="mt-3 text-[12.5px] font-bold text-stone-500">
                      {l.jumlah} orang · Amin {l.amin}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
