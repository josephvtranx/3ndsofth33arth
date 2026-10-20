import type { Metadata } from "next";
import Link from "next/link";
import WorldwideWaitlist from "./WorldwideWaitlist";

export const metadata: Metadata = {
  title: "Worldwide waitlist | 3ndsofth33arth",
  robots: { index: false, follow: false },
};

export default function WaitlistPage() {
  return (
    <main className="relative min-h-screen overflow-clip border-l-[6px] border-[#4a4a4a]">
      <Link href="/home" className="fixed right-11 top-8 z-50 font-mono text-sm tracking-[1px]">
        ← esther ko
      </Link>
      <header className="mx-auto max-w-[860px] px-6 pb-[30px] pt-[110px]">
        <h1 className="m-0 text-[clamp(40px,6vw,76px)] font-extralight tracking-[-0.03em]">
          3ndsofth33arth
        </h1>
        <h2 className="mt-7 font-mono text-sm tracking-[1px]">worldwide waitlist</h2>
        <p className="mt-[22px] max-w-[640px] text-lg leading-[1.55]">
          Outside Seattle? let me know where you are. join the worldwide waitlist to hear from me if I plan a visit to your city. joining expresses interest it does not confirm an appointment or guarantee a visit.
        </p>
      </header>
      <WorldwideWaitlist />
    </main>
  );
}
