"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Halftone from "@/components/Halftone";
import { ARTIST_EMAIL, HOURLY_RATE, DEPOSIT } from "@/lib/site";
import {
  BOOKING_IMAGE_TYPES,
  MAX_BOOKING_IMAGES,
  MAX_BOOKING_TOTAL_BYTES,
  WORK_TYPES,
  type DesignType,
  type WorkType,
} from "@/lib/booking";
import { MAX_SOURCE_IMAGE_BYTES, prepareBookingImage } from "./prepare-image";

type Attached = { file: File; url: string };
type SubmitStatus = "idle" | "submitting" | "success" | "error";

const inputCls =
  "w-full box-border bg-[#7d7d7d] border border-[#999] text-white px-3.5 py-3 text-base outline-none font-mono tracking-[0.5px]";
const labelCls = "font-mono text-[13px] tracking-[1px]";
const hintCls = "mb-2.5 mt-1.5 text-sm leading-[1.5] text-[#d5d5d5]";

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
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
    name: "", email: "", ig: "", placement: "", size: "", design: "", budget: "", avail: "",
  });
  const [is18, setIs18] = useState(false);
  const [files, setFiles] = useState<Attached[]>([]);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [preparingImages, setPreparingImages] = useState(false);
  const preparingRef = useRef(false);
  const mountedRef = useRef(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<Attached[]>([]);
  const submissionIdRef = useRef("");

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      filesRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, []);

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const addFiles = async (list: FileList) => {
    if (preparingRef.current || status === "submitting") return;
    const incoming = Array.from(list);
    if (!incoming.length) return;
    let error = "";

    if (filesRef.current.length + incoming.length > MAX_BOOKING_IMAGES) error = `please attach no more than ${MAX_BOOKING_IMAGES} images.`;
    else if (incoming.some((file) => !BOOKING_IMAGE_TYPES.includes(file.type as (typeof BOOKING_IMAGE_TYPES)[number]))) {
      error = "images must be JPG, PNG, or WebP files.";
    } else if (incoming.some((file) => file.size > MAX_SOURCE_IMAGE_BYTES)) {
      error = "each original photo must be 20 MB or smaller.";
    }

    if (error) {
      setFileError(error);
      return;
    }

    preparingRef.current = true;
    setPreparingImages(true);
    setFileError("");
    setFieldErrors((current) => ({ ...current, images: "" }));
    try {
      const prepared: File[] = [];
      // Process sequentially to avoid decoding ten full-resolution photos at once.
      for (const file of incoming) {
        prepared.push(await prepareBookingImage(file, Math.floor(MAX_BOOKING_TOTAL_BYTES / MAX_BOOKING_IMAGES)));
        if (!mountedRef.current) return;
      }
      const next = filesRef.current.concat(prepared.map((file) => ({ file, url: URL.createObjectURL(file) })));
      filesRef.current = next;
      setFiles(next);
      submissionIdRef.current = "";
    } catch (error) {
      if (mountedRef.current) {
        setFileError(error instanceof Error ? error.message : "photos could not be prepared. please try again.");
      }
    } finally {
      preparingRef.current = false;
      if (mountedRef.current) setPreparingImages(false);
    }
  };

  const removeFile = (index: number) => {
    if (preparingRef.current || status === "submitting") return;
    URL.revokeObjectURL(filesRef.current[index].url);
    filesRef.current = filesRef.current.filter((_, fileIndex) => fileIndex !== index);
    setFiles(filesRef.current);
    submissionIdRef.current = "";
    setFileError("");
  };

  const fallbackMessage = (() => {
    const v = (s: string) => s.trim() || "—";
    return [
      "hi esther! i'd like to book with you :)",
      "",
      `name: ${v(fields.name)}`,
      `email: ${v(fields.email)}`,
      `ig: ${v(fields.ig)}`,
      `work type: ${workType}`,
      `placement: ${v(fields.placement)}`,
      `size: ${v(fields.size)}`,
      `type: ${designType}`,
      `design: ${v(fields.design)}`,
      `budget: ${v(fields.budget)}`,
      `availability: ${v(fields.avail)}`,
      "",
      files.length ? `(i'll attach ${files.length} reference image${files.length > 1 ? "s" : ""})` : "",
    ].join("\n");
  })();

  const mailtoHref =
    `mailto:${ARTIST_EMAIL}?subject=${encodeURIComponent(`booking inquiry — ${workType}`)}` +
    `&body=${encodeURIComponent(fallbackMessage)}`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preparingRef.current || status === "submitting") return;
    setStatus("submitting");
    setStatusMessage("");
    setFieldErrors({});

    if (!submissionIdRef.current) submissionIdRef.current = crypto.randomUUID();

    const formData = new FormData(event.currentTarget);
    formData.set("submissionId", submissionIdRef.current);
    formData.set("workType", workType);
    formData.set("designType", designType);
    formData.set("is18", String(is18));
    files.forEach(({ file }) => formData.append("images", file, file.name));

    try {
      const response = await fetch("/api/booking", { method: "POST", body: formData });
      const result = (await response.json().catch(() => null)) as
        | { success: boolean; error?: string; fieldErrors?: Record<string, string>; confirmationSent?: boolean }
        | null;

      if (!response.ok || !result?.success) {
        setStatus("error");
        setFieldErrors(result?.fieldErrors ?? {});
        setStatusMessage(result?.error ?? "your inquiry could not be sent. please try again.");
        return;
      }

      files.forEach(({ url }) => URL.revokeObjectURL(url));
      filesRef.current = [];
      setFiles([]);
      setFields({ name: "", email: "", ig: "", placement: "", size: "", design: "", budget: "", avail: "" });
      setWorkType("tattoo");
      setDesignType("custom");
      setIs18(false);
      submissionIdRef.current = "";
      setStatus("success");
      setStatusMessage(
        result.confirmationSent
          ? "your inquiry is in esther's inbox — check your email for a confirmation."
          : "your inquiry is in esther's inbox. esther will reply within a couple business days.",
      );
    } catch {
      setStatus("error");
      setStatusMessage("your inquiry could not be sent. please try again or email esther directly.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-clip border-l-[6px] border-[#4a4a4a]">
      <div className="fixed left-[34px] top-7 z-50 text-[30px] leading-none">✺</div>
      <Link href="/home" className="fixed right-11 top-8 z-50 font-mono text-sm tracking-[1px]">
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
        <form
          onSubmit={handleSubmit}
          className="bg-[#6b6b6b] p-[clamp(28px,5vw,56px)] text-[#f2f2f2]"
        >
          <label className="absolute -left-[10000px]" aria-hidden="true">
            website
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
          <div className="flex flex-col gap-[26px]">
            <div>
              <p className={`${labelCls} mb-2.5`}>work type</p>
              <div className="flex gap-2.5">
                {WORK_TYPES.map((w) => (
                  <Toggle key={w} on={workType === w} onClick={() => setWorkType(w)}>{w}</Toggle>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              <label className={`flex flex-col gap-2 ${labelCls}`}>
                name
                <input
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  autoComplete="name"
                  value={fields.name}
                  onChange={set("name")}
                  placeholder="your name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={inputCls}
                />
                {fieldErrors.name && <span className="text-xs text-[#fff1a8]">{fieldErrors.name}</span>}
              </label>
              <label className={`flex flex-col gap-2 ${labelCls}`}>
                email
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={fields.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={inputCls}
                />
                {fieldErrors.email && <span className="text-xs text-[#fff1a8]">{fieldErrors.email}</span>}
              </label>
            </div>

            <label className={`flex flex-col gap-2 ${labelCls}`}>
              instagram handle <span className="text-[#d5d5d5]">(optional)</span>
              <input
                name="instagram"
                type="text"
                maxLength={80}
                value={fields.ig}
                onChange={set("ig")}
                placeholder="@yourhandle"
                aria-invalid={Boolean(fieldErrors.instagram)}
                className={inputCls}
              />
              {fieldErrors.instagram && <span className="text-xs text-[#fff1a8]">{fieldErrors.instagram}</span>}
            </label>

            <div>
              <p className={labelCls}>placement on body</p>
              <p className={hintCls}>
                describe the placement. if you&apos;re comfortable, send a photo of the area with the spot marked
                (attach it below).
              </p>
              <input
                name="placement"
                type="text"
                required
                maxLength={500}
                value={fields.placement}
                onChange={set("placement")}
                placeholder="e.g. left upper arm, outer side"
                aria-invalid={Boolean(fieldErrors.placement)}
                className={inputCls}
              />
              {fieldErrors.placement && <p className="mt-2 text-xs text-[#fff1a8]">{fieldErrors.placement}</p>}
            </div>

            <div>
              <p className={labelCls}>size</p>
              <p className={hintCls}>
                approximate width × height in inches. when we stencil we can resize and adjust as much as you&apos;d like!
              </p>
              <input
                name="size"
                type="text"
                required
                maxLength={120}
                value={fields.size}
                onChange={set("size")}
                placeholder="e.g. 4 × 6 in"
                aria-invalid={Boolean(fieldErrors.size)}
                className={inputCls}
              />
              {fieldErrors.size && <p className="mt-2 text-xs text-[#fff1a8]">{fieldErrors.size}</p>}
            </div>

            <div>
              <p className={labelCls}>design</p>
              <p className={hintCls}>
                for <em>custom designs</em>: a detailed visual description, how much creative freedom you&apos;d like me
                to have, and reference images (pinterest, other artists, or my account) — attach references below.
                for <em>flash</em>: which design, plus any adjustments.
              </p>
              <div className="mb-2.5 flex gap-2.5">
                <Toggle on={designType === "custom"} onClick={() => setDesignType("custom")}>custom</Toggle>
                <Toggle on={designType === "flash"} onClick={() => setDesignType("flash")}>flash</Toggle>
              </div>
              <textarea
                name="design"
                rows={4}
                required
                maxLength={3000}
                value={fields.design}
                onChange={set("design")}
                placeholder="describe your idea + how much creative freedom i get"
                aria-invalid={Boolean(fieldErrors.design)}
                className={`${inputCls} resize-y`}
              />
              {fieldErrors.design && <p className="mt-2 text-xs text-[#fff1a8]">{fieldErrors.design}</p>}
            </div>

            <div>
              <p className={`${labelCls} mb-2.5`}>references &amp; placement photos</p>
              <input
                ref={fileRef}
                type="file"
                accept={BOOKING_IMAGE_TYPES.join(",")}
                multiple
                disabled={preparingImages || status === "submitting"}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={preparingImages || status === "submitting" || files.length >= MAX_BOOKING_IMAGES}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                className="w-full cursor-pointer border border-dashed border-[#aaa] bg-[#7d7d7d] p-[22px] text-center font-mono text-[13px] tracking-[1px] text-[#e5e5e5] hover:bg-[#858585] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-60"
              >
                {preparingImages ? "preparing photos…" : files.length >= MAX_BOOKING_IMAGES ? "all 10 photos added" : files.length ? "+ add more images" : "click or drag images here to attach"}
              </button>
              <p role="status" className="mt-2 text-xs text-[#d5d5d5]">
                {preparingImages ? "resizing your photos — this may take a moment." : `${files.length} of ${MAX_BOOKING_IMAGES} photos attached`}
              </p>
              {(fileError || fieldErrors.images) && (
                <p role="alert" className="mt-2 text-xs text-[#fff1a8]">{fileError || fieldErrors.images}</p>
              )}
              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {files.map((f, i) => (
                    <div key={f.url} className="relative w-[84px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.file.name} className="block h-[84px] w-[84px] border border-[#999] object-cover" />
                      <button
                        type="button"
                        aria-label={`remove ${f.file.name}`}
                        disabled={preparingImages || status === "submitting"}
                        onClick={() => removeFile(i)}
                        className="absolute -right-2 -top-2 h-[22px] w-[22px] cursor-pointer rounded-full border-none bg-ink text-xs leading-none text-white"
                      >
                        ✕
                      </button>
                      <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] text-[#ddd]">{f.file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              <div>
                <p className={labelCls}>budget</p>
                <p className={hintCls}>so i can quote &amp; tailor the design.</p>
                <input
                  name="budget"
                  type="text"
                  required
                  maxLength={120}
                  value={fields.budget}
                  onChange={set("budget")}
                  placeholder="e.g. $250–350"
                  aria-invalid={Boolean(fieldErrors.budget)}
                  className={inputCls}
                />
                {fieldErrors.budget && <p className="mt-2 text-xs text-[#fff1a8]">{fieldErrors.budget}</p>}
              </div>
              <div>
                <p className={labelCls}>availability</p>
                <p className={hintCls}>what month, specific dates, or range</p>
                <input
                  name="availability"
                  type="text"
                  required
                  maxLength={500}
                  value={fields.avail}
                  onChange={set("avail")}
                  placeholder="e.g. october 5–12, weekends"
                  aria-invalid={Boolean(fieldErrors.availability)}
                  className={inputCls}
                />
                {fieldErrors.availability && <p className="mt-2 text-xs text-[#fff1a8]">{fieldErrors.availability}</p>}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-[15px]">
              <input
                type="checkbox"
                required
                checked={is18}
                onChange={(e) => setIs18(e.target.checked)}
                aria-invalid={Boolean(fieldErrors.is18)}
                className="h-[18px] w-[18px] accent-ink"
              />
              i confirm i am 18 or older
            </label>
            {fieldErrors.is18 && <p className="-mt-4 text-xs text-[#fff1a8]">{fieldErrors.is18}</p>}

            <button
              type="submit"
              disabled={status === "submitting" || preparingImages}
              className="cursor-pointer border-none bg-ink p-4 font-mono text-[15px] tracking-[2px] text-white hover:bg-[#333] disabled:cursor-wait disabled:opacity-60"
            >
              {status === "submitting" ? "sending inquiry…" : "submit my inquiry ↓"}
            </button>

            {statusMessage && (
              <div
                role={status === "error" ? "alert" : "status"}
                aria-live="polite"
                className={`border border-dashed p-[18px] ${
                  status === "success" ? "border-[#d6efc7] bg-[#53654e]" : "border-[#ffd3c9] bg-[#6d4f4b]"
                }`}
              >
                <p className="m-0 font-mono text-sm leading-[1.6] text-white">{statusMessage}</p>
                {status === "error" && (
                  <a
                    href={mailtoHref}
                    className="mt-4 inline-block bg-paper px-5 py-3 font-mono text-[13px] tracking-[1px] !text-ink no-underline hover:bg-[#ddd]"
                  >
                    email esther instead →
                  </a>
                )}
              </div>
            )}

            <p className="m-0 text-center text-sm text-[#d5d5d5]">i will get back to you within a couple business days!</p>
          </div>
        </form>
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
                than happy to adjust pricing to fit your budget. mention it in your inquiry so we can discuss what works
                best for you!
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
              <li>i&apos;m also happy to do add-ons to previous pieces. shoot me an email and i&apos;ll get back to you with a consultation.</li>
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
          ✺ <Link href="/home">esther ko</Link> · @3ndsofth33arth
        </p>
      </section>
    </div>
  );
}
