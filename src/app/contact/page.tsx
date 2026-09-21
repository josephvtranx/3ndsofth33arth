import PortfolioHeader from "../home/PortfolioHeader";
import Link from "next/link";


export default function Page() {
  return <main className="min-h-screen bg-white"><PortfolioHeader />
      {/* contact */}
      <section id="contact" className="relative px-6 pb-40 pt-[60px] text-center">
        <h2 className="mb-7 text-[clamp(48px,6vw,80px)] font-light tracking-[-0.02em]">contact</h2>
        <p className="mb-9 text-[19px] leading-[1.6]">
          tattoo inquiries go through the booking form.<br />
          everything else — <a href="https://instagram.com/3ndsofth33arth" className="underline underline-offset-4">DM me</a>.
        </p>
        <Link
          href="/booking"
          className="inline-block bg-ink px-[34px] py-4 font-mono text-base tracking-[2px] !text-paper no-underline hover:bg-[#444]"
        >
          book a tattoo →
        </Link>
        <p className="mt-[90px] font-mono text-xs tracking-[1px] text-[#aaa]">✺ esther ko · 3ndsofth33arth</p>
      </section>
  </main>;
}
