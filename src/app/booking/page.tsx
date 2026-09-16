"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Halftone from "@/components/Halftone";
import { ARTIST_EMAIL, HOURLY_RATE, DEPOSIT } from "@/lib/site";

type WorkType = "tattoo" | "touch up" | "cover up";
type DesignType = "custom" | "flash";
type Attached = { name: string; url: string };

const inputCls =
  "w-full box-border bg-[#7d7d7d] border border-[#999] text-white px-3.5 py-3 text-base outline-none font-mono tracking-[0.5px]";
const labelCls = "font-mono text-[13px] tracking-[1px]";
const hintCls = "mb-2.5 mt-1.5 text-sm leading-[1.5] text-[#d5d5d5]";

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 cursor-pointer border border-[#999] p-2.5 font-mono text-[13px] tracking-[1px] ${
        on ? "bg-paper text-ink" : "bg-transparent text-[#ddd]"
      }`}
    >
      {children}
    </button>
  );
}

export default function BookingPage() {
  const [workType, setWorkType] = useState<WorkType>("tattoo");
  const [designType, setDesignType] = useState<DesignType>("custom");
  const [fields, setFields] = useState({
    name: "", ig: "", placement: "", size: "", design: "", budget: "", avail: "",
  });
  const [is18, setIs18] = useState(false);
  const [files, setFiles] = useState<Attached[]>([]);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const addFiles = (list: FileList) => {
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => prev.concat(imgs.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))));
  };

  const generate = () => {
    if (!is18) {
      setMessage("");
      setNote("please confirm you are 18+ first.");
      return;
    }
    const v = (s: string) => s.trim() || "—";
    const msg =
      "hi esther! i'd like to book with you :)\n\n" +
      `name: ${v(fields.name)}\n` +
      `ig: ${v(fields.ig)}\n` +
      `work type: ${workType}\n` +
      `placement: ${v(fields.placement)}\n` +
      `size (w × h, inches): ${v(fields.size)}\n` +
      `type: ${designType}\n` +
      `design: ${v(fields.design)}\n` +
      `budget: ${v(fields.budget)}\n` +
      `availability: ${v(fields.avail)}\n\n` +
      (files.length
        ? `(attaching ${files.length} image${files.length > 1 ? "s" : ""}: ${files.map((f) => f.name).join(", ")})`
        : "(i'll attach references + placement photo to this email)");
    setMessage(msg);
    setCopied(false);
    setNote("review your inquiry, then send it — remember to attach your images to the email:");
  };

  const copyMsg = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const mailtoHref =
    `mailto:${ARTIST_EMAIL}?subject=${encodeURIComponent(`booking inquiry — ${workType}`)}` +
    `&body=${encodeURIComponent(message)}`;

  return (
    <div className="relative min-h-screen overflow-clip border-l-[6px] border-[#4a4a4a]">
      <div className="fixed left-[34px] top-7 z-50 text-[30px] leading-none">✺</div>
      <Link href="/" className="fixed right-11 top-8 z-50 font-mono text-sm tracking-[1px]">
        ← esther ko
      </Link>

      <Halftone className="right-[8%] top-10" size={360} dot={2.6} gap={18} inner={18} />
      <Halftone className="left-[4%] top-[500px]" size={280} dot={2} gap={12} color="#e5e5e5" inner={22} />

      <header className="mx-auto max-w-[860px] px-6 pb-[30px] pt-[110px]">
        <h1 className="m-0 text-[clamp(40px,6vw,76px)] font-extralight tracking-[-0.03em]">
          3ndsofth33arth <strong className="font-bold">booking</strong>
        </h1>
        <p className="mt-[22px] max-w-[640px] text-lg leading-[1.55]">
          <strong>18+ only.</strong> fill this out and hit submit — your inquiry goes straight to my inbox with
          everything i need in one message. i reply in order, so please don&apos;t send follow-ups while you wait; it
          prolongs your spot in the waitlist.
        </p>
      </header>

      <section className="relative mx-auto max-w-[860px] px-6 pb-20 pt-[30px]">
        <div className="bg-[#6b6b6b] p-[clamp(28px,5vw,56px)] text-[#f2f2f2]">
          <div className="flex flex-col gap-[26px]">
            <div>
              <p className={`${labelCls} mb-2.5`}>work type</p>
              <div className="flex gap-2.5">
                {(["tattoo", "touch up", "cover up"] as WorkType[]).map((w) => (
                  <Toggle key={w} on={workType === w} onClick={() => setWorkType(w)}>{w}</Toggle>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              <label className={`flex flex-col gap-2 ${labelCls}`}>
                name
                <input type="text" value={fields.name} onChange={set("name")} placeholder="your name" className={inputCls} />
              </label>
              <label className={`flex flex-col gap-2 ${labelCls}`}>
                instagram handle
                <input type="text" value={fields.ig} onChange={set("ig")} placeholder="@yourhandle" className={inputCls} />
              </label>
            </div>

            <div>
              <p className={labelCls}>placement on body</p>
              <p className={hintCls}>
                describe the placement. if you&apos;re comfortable, send a photo of the area with the spot marked
                (attach it in the DM).
              </p>
              <input type="text" value={fields.placement} onChange={set("placement")} placeholder="e.g. left upper arm, outer side" className={inputCls} />
            </div>

            <div>
              <p className={labelCls}>size</p>
              <p className={hintCls}>
                approximate width × height in inches. when we stencil we can resize and adjust as much as you&apos;d like!
              </p>
              <input type="text" value={fields.size} onChange={set("size")} placeholder="e.g. 4 × 6 in" className={inputCls} />
            </div>

            <div>
              <p className={labelCls}>design</p>
              <p className={hintCls}>
                for <em>custom designs</em>: a detailed visual description, how much creative freedom you&apos;d like me
                to have, and reference images (pinterest, other artists, or my account) — attach references in the DM.
                for <em>flash</em>: which design, plus any adjustments.
              </p>
              <div className="mb-2.5 flex gap-2.5">
                <Toggle on={designType === "custom"} onClick={() => setDesignType("custom")}>custom</Toggle>
                <Toggle on={designType === "flash"} onClick={() => setDesignType("flash")}>flash</Toggle>
              </div>
              <textarea
                rows={4}
                value={fields.design}
                onChange={set("design")}
                placeholder="describe your idea + how much creative freedom i get"
                className={`${inputCls} resize-y`}
              />
            </div>

            <div>
              <p className={labelCls}>references &amp; placement photos</p>
              <p className={hintCls}>
                attach reference images or a photo of the placement area — attach these to the email before sending.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                className="cursor-pointer border border-dashed border-[#aaa] bg-[#7d7d7d] p-[22px] text-center font-mono text-[13px] tracking-[1px] text-[#e5e5e5] hover:bg-[#858585]"
              >
                {files.length ? "+ add more images" : "click or drag images here to attach"}
              </div>
              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {files.map((f, i) => (
                    <div key={f.url} className="relative w-[84px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.name} className="block h-[84px] w-[84px] border border-[#999] object-cover" />
                      <button
                        type="button"
                        title="remove"
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute -right-2 -top-2 h-[22px] w-[22px] cursor-pointer rounded-full border-none bg-ink text-xs leading-none text-white"
                      >
                        ✕
                      </button>
                      <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] text-[#ddd]">{f.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              <div>
                <p className={labelCls}>budget</p>
                <p className={hintCls}>so i can quote &amp; tailor the design.</p>
                <input type="text" value={fields.budget} onChange={set("budget")} placeholder="e.g. $250–350" className={inputCls} />
              </div>
              <div>
                <p className={labelCls}>availability</p>
                <p className={hintCls}>what month &amp; specific dates work.</p>
                <input type="text" value={fields.avail} onChange={set("avail")} placeholder="e.g. early october, weekends" className={inputCls} />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-[15px]">
              <input
                type="checkbox"
                checked={is18}
                onChange={(e) => setIs18(e.target.checked)}
                className="h-[18px] w-[18px] accent-ink"
              />
              i confirm i am 18 or older
            </label>

            <button
              type="button"
              onClick={generate}
              className="cursor-pointer border-none bg-ink p-4 font-mono text-[15px] tracking-[2px] text-white hover:bg-[#333]"
            >
              submit my inquiry ↓
            </button>

            {(message || note) && (
              <div className="border border-dashed border-[#aaa] bg-[#545454] p-[18px]">
                <p className="mb-2.5 font-mono text-xs tracking-[1px] text-[#ddd]">{note}</p>
                {message && (
                  <pre className="mb-4 whitespace-pre-wrap font-mono text-sm leading-[1.6] text-white">{message}</pre>
                )}
                {message && (
                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href={mailtoHref}
                      className="bg-paper px-5 py-3 font-mono text-[13px] tracking-[1px] !text-ink no-underline hover:bg-[#ddd]"
                    >
                      send it — open my email →
                    </a>
                    <button
                      type="button"
                      onClick={copyMsg}
                      className="cursor-pointer border border-[#aaa] bg-transparent px-5 py-3 font-mono text-[13px] tracking-[1px] text-white hover:bg-[#666]"
                    >
                      {copied ? "copied ✓" : "copy message instead"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="m-0 text-center text-sm text-[#d5d5d5]">i will get back to you within a couple business days!</p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[720px] px-6 pb-[60px] pt-5">
        <h2 className="mb-9 text-[clamp(40px,5vw,64px)] font-bold tracking-[-0.03em]">PRICING</h2>
        <div className="flex flex-col gap-10">
          <div>
            <h3 className="mb-2.5 text-[26px] font-bold tracking-[-0.02em]">minimum rates</h3>
            <ul className="flex list-disc flex-col gap-1.5 pl-[22px] text-[17px] leading-[1.65]">
              <li>rates start at <em>{HOURLY_RATE} per hour</em> as a baseline guide.</li>
              <li>price increases depending on size, placement, and level of detail.</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2.5 text-[26px] font-bold tracking-[-0.02em]">deposit policy (for new clients)</h3>
            <ul className="flex list-disc flex-col gap-1.5 pl-[22px] text-[17px] leading-[1.65]">
              <li>a <em>{DEPOSIT} deposit</em> is required for new clients to secure your appointment &amp; start designing your tattoo.</li>
              <li>this deposit goes toward your final payment on the day of your tattoo.</li>
              <li>deposits are non-refundable, but may be transferred if you reschedule in advance.</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2.5 text-[26px] font-bold tracking-[-0.02em]">financial barriers</h3>
            <ul className="list-disc pl-[22px] text-[17px] leading-[1.65]">
              <li>
                i understand that finances may sometimes be a barrier. hourly rates serve as a guideline, but i am more
                than happy to adjust pricing to fit your budget. just let me know in your DM to discuss what works best
                for you!
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[720px] px-6 pb-[140px] pt-5">
        <Halftone className="-right-[10%] bottom-10" size={300} dot={2.4} gap={16} color="#e3e3e3" />
        <h2 className="mb-9 text-[clamp(40px,5vw,64px)] font-bold tracking-[-0.03em]">NOTES</h2>
        <div className="flex flex-col gap-10">
          <div>
            <h3 className="mb-2.5 text-[26px] font-bold tracking-[-0.02em]">touch ups</h3>
            <ul className="flex list-disc flex-col gap-1.5 pl-[22px] text-[17px] leading-[1.65]">
              <li>touch-ups on my previous work are always free for returning clients.</li>
              <li>touch-ups on work done by others will be charged at my standard hourly rate.</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2.5 text-[26px] font-bold tracking-[-0.02em]">cover ups</h3>
            <ul className="flex list-disc flex-col gap-1.5 pl-[22px] text-[17px] leading-[1.65]">
              <li>i&apos;m open to doing cover-ups, but only depending on the style of the existing work.</li>
              <li>i&apos;m also happy to do add-ons to previous pieces. shoot me a DM for a consultation.</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2.5 text-[26px] font-bold tracking-[-0.02em]">misc.</h3>
            <ul className="flex list-disc flex-col gap-1.5 pl-[22px] text-[17px] leading-[1.65]">
              <li>i don&apos;t do color.</li>
              <li>i don&apos;t accept requests that include sacrilegious symbols or excessively violent imagery. thank you for understanding. :3</li>
            </ul>
          </div>
        </div>
        <p className="mt-[100px] text-center font-mono text-xs tracking-[1px] text-[#aaa]">
          ✺ <Link href="/">esther ko</Link> · @3ndsofth33arth
        </p>
      </section>
    </div>
  );
}
