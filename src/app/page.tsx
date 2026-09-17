"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Halftone from "@/components/Halftone";
import ProjectDetails from "@/components/ProjectDetails";
import { PROJECTS } from "@/lib/projects";

const SECTIONS = ["ink", "projects", "socials", "contact"] as const;
type SectionId = (typeof SECTIONS)[number];
// labels sit at 12.5 / 37.5 / 62.5 / 87.5% of the rail
const LABEL_POS = [0.125, 0.375, 0.625, 0.875];
const DEFAULT_PROJECT_INDEX = Math.max(PROJECTS.findIndex((project) => project.id === "apoptosis"), 0);

const GALLERY = [
  {
    src: "/images/ink/ink-sleeve-01.jpg",
    alt: "layered black and gray linework sleeve",
    href: "https://www.instagram.com/3ndsofth33arth/p/DcShKYMm73j/",
  },
  {
    src: "/images/ink/ink-shoulder-02.jpg",
    alt: "black and gray shoulder and upper-arm tattoo",
    href: "https://www.instagram.com/3ndsofth33arth/p/DconIaHGXer/",
  },
  {
    src: "/images/ink/ink-hand-03.jpg",
    alt: "three monkeys tattoo on the back of a hand",
    href: "https://www.instagram.com/3ndsofth33arth/p/DcY4u-YG3aN/",
  },
  {
    src: "/images/ink/ink-sleeve-04.jpg",
    alt: "fine-line illustrative upper-arm sleeve",
    href: "https://www.instagram.com/3ndsofth33arth/p/DbzVxs5G-Bk/",
  },
  {
    src: "/images/ink/ink-arms-05.jpg",
    alt: "surreal black and gray tattoos across both arms",
    href: "https://www.instagram.com/3ndsofth33arth/p/DbCWYSFmxjW/",
  },
  {
    src: "/images/ink/ink-sleeve-06.jpg",
    alt: "dense illustrative black and gray forearm tattoo",
    href: "https://www.instagram.com/3ndsofth33arth/p/DahPGAFm_Bv/",
  },
  {
    src: "/images/ink/ink-shoulder-07.jpg",
    alt: "organic black and gray upper-arm tattoo",
    href: "https://www.instagram.com/3ndsofth33arth/p/DaHpNJvlZI1/",
  },
  {
    src: "/images/ink/ink-upper-arm-08.jpg",
    alt: "figurative black and gray upper-arm tattoo",
    href: "https://www.instagram.com/3ndsofth33arth/p/DbQ2FnmG0px/",
  },
  {
    src: "/images/ink/ink-forearm-09.jpg",
    alt: "dark illustrative black and gray forearm tattoo",
    href: "https://www.instagram.com/3ndsofth33arth/p/Da9UBHcmzqw/",
  },
  {
    src: "/images/ink/ink-chest-script-10.jpg",
    alt: "ornamental script tattoo across the chest",
    href: "https://www.instagram.com/3ndsofth33arth/p/DaeWlvwm0tF/",
  },
];

function scrollToId(id: string, ev?: React.MouseEvent) {
  ev?.preventDefault();
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 30, behavior: "smooth" });
}

export default function Home() {
  const [active, setActive] = useState<SectionId>("ink");
  const [markerP, setMarkerP] = useState(0);
  const [projIndex, setProjIndex] = useState(DEFAULT_PROJECT_INDEX);
  const currentProject = PROJECTS[projIndex];

  useEffect(() => {
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    // each section owns 25% of the rail regardless of its real height;
    // a section "starts" when its title reaches the middle of the viewport
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.min(max, Math.max(0, window.scrollY));
      const starts = SECTIONS.map((id) => {
        const el = document.getElementById(id);
        return el
          ? Math.min(max, Math.max(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5))
          : 0;
      });
      let p: number;
      if (y < starts[0]) {
        p = starts[0] > 0 ? clamp(y / starts[0]) * LABEL_POS[0] : 0;
      } else {
        let i = SECTIONS.length - 1;
        for (let k = 0; k < SECTIONS.length - 1; k++) {
          if (y < starts[k + 1]) { i = k; break; }
        }
        const segStart = starts[i];
        const segEnd = i < SECTIONS.length - 1 ? starts[i + 1] : max;
        const t = segEnd > segStart ? clamp((y - segStart) / (segEnd - segStart)) : 1;
        const from = LABEL_POS[i];
        const to = i < SECTIONS.length - 1 ? LABEL_POS[i + 1] : 1;
        p = from + t * (to - from);
      }
      setMarkerP(p);
    };
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id as SectionId); });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    measure();
    const t = setTimeout(measure, 1200);
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, []);

  const spin = (dir: number) => setProjIndex((i) => (i + dir + PROJECTS.length) % PROJECTS.length);
  const navCls = (id: SectionId) =>
    `absolute right-0 -translate-y-1/2 underline underline-offset-4 tracking-[1px] transition-colors duration-300 ${
      active === id ? "font-bold text-ink" : "font-normal text-[#b5b5b5]"
    }`;

  return (
    <div className="relative min-h-screen overflow-clip border-l-[6px] border-[#4a4a4a]">
      <div className="fixed left-[34px] top-7 z-50 text-[30px] leading-none">✺</div>

      {/* mobile booking link (rail is hidden below md) */}
      <Link
        href="/booking"
        className="fixed right-5 top-7 z-50 bg-ink px-3.5 py-2 font-mono text-[13px] tracking-[1px] !text-paper no-underline md:hidden"
      >
        booking →
      </Link>

      {/* rail nav */}
      <nav className="fixed right-11 top-1/2 z-50 hidden h-[46vh] w-[130px] -translate-y-1/2 font-mono text-[15px] md:block">
        <div className="absolute -right-[18px] bottom-0 top-0 w-[3px] rounded-sm bg-[#ddd]" />
        <div
          className="absolute -right-[25px] h-[17px] w-[17px] -mt-[8.5px] rounded-full bg-ink transition-[top] duration-[120ms] ease-linear"
          style={{ top: `${markerP * 100}%` }}
        />
        <a href="#ink" onClick={(e) => scrollToId("ink", e)} className={`${navCls("ink")} top-[12.5%]`}>ink</a>
        <a href="#projects" onClick={(e) => scrollToId("projects", e)} className={`${navCls("projects")} top-[37.5%]`}>projects</a>
        <a href="#socials" onClick={(e) => scrollToId("socials", e)} className={`${navCls("socials")} top-[62.5%]`}>socials</a>
        <a href="#contact" onClick={(e) => scrollToId("contact", e)} className={`${navCls("contact")} top-[87.5%]`}>contact</a>
        <Link
          href="/booking"
          className="absolute right-0 top-[calc(100%+34px)] whitespace-nowrap bg-ink px-3.5 py-2 tracking-[1px] !text-paper no-underline hover:bg-[#444]"
        >
          booking →
        </Link>
      </nav>

      {/* hero */}
      <header className="relative flex min-h-[96vh] items-center justify-center">
        <Halftone className="left-[12%] top-[6%]" size={300} dot={2.4} gap={16} color="#dcdcdc" />
        <Halftone className="right-[10%] top-[14%]" size={420} dot={3} gap={22} color="#e3e3e3" inner={15} outer={68} />
        <Halftone className="bottom-[4%] left-[30%]" size={260} dot={1.8} gap={11} inner={25} outer={72} />
        <div className="px-6 text-center">
          <h1 className="m-0 font-pixel text-[clamp(64px,10vw,132px)] font-normal tracking-[-2px]">esther ko</h1>
          <p className="mt-2.5 font-mono text-[15px] tracking-[2px] text-[#888]">tattoo · writing · mixed media</p>
        </div>
      </header>

      {/* artist statement */}
      <section className="relative mx-auto max-w-[1120px] px-6 pb-[140px] pt-20 md:pt-10">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-12 md:gap-x-10 md:gap-y-20">
          <p className="m-0 text-[21px] leading-[1.5] tracking-[-0.02em] md:col-span-7 md:col-start-2">
          is a multidisciplinary artist<br />
          she is either tattooing, writing, or working on mixed media pieces with one intention in mind:
          </p>

          <figure className="m-0 md:col-span-5">
            <Image
              src="/images/artist/esther-tattooing.jpg"
              width={640}
              height={480}
              sizes="(max-width: 767px) calc(100vw - 48px), 42vw"
              alt="Esther tattooing a client's chest"
              className="block h-auto w-full grayscale contrast-[1.04]"
            />
          </figure>

          <p className="m-0 text-[21px] leading-[1.5] tracking-[-0.02em] md:col-span-5 md:col-start-7 md:self-center">
            will she be apart of building a kingdom that will die with her, or a Kingdom that will outlive any other?
          </p>

          <p className="m-0 text-[21px] leading-[1.5] tracking-[-0.02em] md:col-span-5 md:col-start-2 md:self-center">
            this Kingdom is marked by sharing, so she will share what she discovers about it along the way. there is no
            obligation to come along for the ride, but her hope is that her process might invite you to think more deeply
            about your own.
          </p>

          <figure className="m-0 md:col-span-5 md:col-start-7">
            <Image
              src="/images/artist/esther-drawing.jpg"
              width={1349}
              height={1800}
              sizes="(max-width: 767px) calc(100vw - 48px), 42vw"
              alt="Esther sketching on a tablet in her studio"
              className="block h-auto w-full grayscale contrast-[1.04]"
            />
          </figure>
        </div>
      </section>

      {/* ink gallery */}
      <section id="ink" className="relative px-[6vw] pb-[60px] pt-20">
        <Halftone className="right-[16%] top-[30px]" size={340} dot={2.6} gap={18} color="#e2e2e2" inner={18} />
        <h2 className="mb-3 text-[clamp(56px,7vw,96px)] font-medium tracking-[-0.04em]">ink</h2>
        <p className="mb-11 font-mono text-sm tracking-[1px] text-[#888]">black &amp; gray · fine line · engraving</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[18px]">
          {GALLERY.map((g) => (
            <a
              key={g.src}
              href={g.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`view ${g.alt} on Instagram`}
              className="group block h-[380px] overflow-hidden bg-ink"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.src}
                alt={g.alt}
                loading="lazy"
                className="block h-[380px] w-full object-cover grayscale contrast-[1.05] transition-transform duration-[600ms] ease-swoop group-hover:scale-105"
              />
            </a>
          ))}
        </div>
        <p className="mt-9 text-center font-mono text-sm">
          <Link href="/booking" className="tracking-[1px]">want one? → booking &amp; policies</Link>
        </p>
      </section>

      {/* projects carousel */}
      <section id="projects" className="relative px-6 pb-20 pt-[100px]">
        <Halftone className="left-[8%] top-[60px]" size={280} dot={2} gap={13} color="#e4e4e4" inner={22} />
        <h2 className="mb-2 text-center text-[clamp(56px,7vw,96px)] font-light tracking-[-0.02em]">projects</h2>
        <p className="mb-5 text-center font-mono text-sm tracking-[1px] text-[#888]">
          hover to look closer · click the center to visit · sides to spin
        </p>
        <div className="relative mb-[70px] ml-[calc(50%-50vw)] h-[clamp(380px,52vw,640px)] w-screen overflow-visible">
          {PROJECTS.map((p, i) => {
            const n = PROJECTS.length;
            const rel = (i - projIndex + n) % n; // 0 center, 1 right, 2 left
            const pos =
              rel === 0
                ? { left: "50%", top: "46%", zIndex: 5 }
                : rel === 1
                  ? { left: "calc(100% - 5vw)", top: "68%", zIndex: 3 }
                  : { left: "5vw", top: "68%", zIndex: 3 };
            const scaleCls = rel === 0 ? "scale-100 hover:scale-105" : "scale-[0.72] hover:scale-[0.8]";
            return (
              <div
                key={p.id}
                className="absolute h-[clamp(320px,50vw,600px)] w-[clamp(320px,50vw,600px)] -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-[650ms] ease-swoop"
                style={pos}
              >
                <button
                  type="button"
                  title={p.name}
                  aria-label={rel === 0 ? `${p.name}, active project` : `show ${p.name}`}
                  aria-pressed={rel === 0}
                  aria-controls="project-details"
                  onClick={() => (rel === 0 ? scrollToId(p.id) : setProjIndex(i))}
                  className={`relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 p-0 transition-[transform,box-shadow] duration-[650ms] ease-swoop hover:shadow-[0_24px_70px_rgba(0,0,0,0.22)] ${scaleCls}`}
                  style={{
                    background: "#d6d6d6",
                    backgroundImage: "radial-gradient(circle, #c6c6c6 2px, transparent 2.2px)",
                    backgroundSize: "12px 12px",
                  }}
                >
                  {p.cover.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.cover.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  {p.cover.label && (
                    <span
                      className="relative text-[clamp(24px,3.4vw,40px)] font-light tracking-[0.04em]"
                      style={{ color: p.cover.labelColor }}
                    >
                      {p.cover.label}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
          <button
            onClick={() => spin(-1)}
            aria-label="previous project"
            className="absolute left-3 top-[78%] z-10 -translate-y-1/2 cursor-pointer border-none bg-transparent p-2.5 text-[84px] font-extralight leading-none text-[#9a9a9a] hover:text-ink md:left-[calc(50%-clamp(160px,25vw,300px)-70px)]"
          >
            ‹
          </button>
          <button
            onClick={() => spin(1)}
            aria-label="next project"
            className="absolute right-3 top-[78%] z-10 -translate-y-1/2 cursor-pointer border-none bg-transparent p-2.5 text-[84px] font-extralight leading-none text-[#9a9a9a] hover:text-ink md:right-[calc(50%-clamp(160px,25vw,300px)-70px)]"
          >
            ›
          </button>
        </div>

        <div id="project-details" aria-live="polite">
          <ProjectDetails key={currentProject.id} project={currentProject} />
        </div>
      </section>

      {/* socials */}
      <section id="socials" className="relative px-6 py-[120px] text-center">
        <Halftone className="bottom-[10%] right-[12%]" size={320} dot={2.4} gap={17} color="#e3e3e3" />
        <h2 className="mb-10 text-[clamp(48px,6vw,80px)] font-light tracking-[-0.02em]">socials</h2>
        <div className="flex flex-col items-center gap-5 font-mono text-[17px]">
          <a href="https://instagram.com/3ndsofth33arth" target="_blank" rel="noopener noreferrer" className="tracking-[1px]">
            instagram — @3ndsofth33arth
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="tracking-[1px]">
            youtube — testimonies
          </a>
        </div>
      </section>

      {/* contact */}
      <section id="contact" className="relative px-6 pb-40 pt-[60px] text-center">
        <h2 className="mb-7 text-[clamp(48px,6vw,80px)] font-light tracking-[-0.02em]">contact</h2>
        <p className="mb-9 text-[19px] leading-[1.6]">
          tattoo inquiries go through the booking form.<br />
          everything else — DM me.
        </p>
        <Link
          href="/booking"
          className="inline-block bg-ink px-[34px] py-4 font-mono text-base tracking-[2px] !text-paper no-underline hover:bg-[#444]"
        >
          book a tattoo →
        </Link>
        <p className="mt-[90px] font-mono text-xs tracking-[1px] text-[#aaa]">✺ esther ko · 3ndsofth33arth</p>
      </section>
    </div>
  );
}
