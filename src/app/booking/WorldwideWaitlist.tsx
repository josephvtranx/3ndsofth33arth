"use client";

import { useRef, useState, type FormEvent } from "react";

const inputs = [
  { name: "name", label: "name", type: "text", autoComplete: "name", placeholder: "your name", max: 120 },
  { name: "email", label: "email", type: "email", autoComplete: "email", placeholder: "you@example.com", max: 254 },
  { name: "city", label: "city", type: "text", autoComplete: "address-level2", placeholder: "e.g. London", max: 120 },
  { name: "country", label: "country", type: "text", autoComplete: "country-name", placeholder: "e.g. United Kingdom", max: 120 },
  { name: "instagram", label: "instagram handle", type: "text", autoComplete: "off", placeholder: "@yourhandle", max: 80 },
];

export default function WorldwideWaitlist() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submissionId = useRef("");
  const sending = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    submissionId.current ||= crypto.randomUUID();
    data.set("submissionId", submissionId.current);
    sending.current = true;
    setBusy(true); setMessage(""); setErrors({}); setFailed(false);
    try {
      const response = await fetch("/api/waitlist", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setErrors(result.fieldErrors || {});
        throw new Error(result.error || "please try again.");
      }
      form.reset(); submissionId.current = "";
      setMessage("you’re on the worldwide waitlist! esther may contact you if she plans a visit to your city. this is not a confirmed appointment.");
    } catch (error) {
      setFailed(true); setMessage(error instanceof Error ? error.message : "please try again.");
    } finally { sending.current = false; setBusy(false); }
  }
  return (
    <section className="relative mx-auto max-w-[860px] px-6 pb-20 pt-[30px]">
      <form onSubmit={submit} className="border border-black bg-white p-[clamp(28px,5vw,56px)] text-ink">
        <label className="absolute -left-[10000px]" aria-hidden="true">website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
          <legend className="sr-only">Worldwide waitlist details</legend>
          <div className="grid grid-cols-1 gap-[26px] sm:grid-cols-2">
            {inputs.map(input => <label key={input.name} className={`flex flex-col gap-2 font-mono text-[13px] tracking-[1px] ${input.name === "instagram" ? "sm:col-span-2" : ""}`}>
              {input.label}
              <input required name={input.name} type={input.type} autoComplete={input.autoComplete} maxLength={input.max} placeholder={input.placeholder} aria-invalid={Boolean(errors[input.name])} aria-describedby={errors[input.name] ? `waitlist-${input.name}-error` : undefined} className="w-full min-w-0 border border-black bg-white px-3.5 py-3 text-base text-ink placeholder:!text-[#666] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black" />
              {errors[input.name] && <span id={`waitlist-${input.name}-error`} className="text-xs text-[#a11]">{errors[input.name]}</span>}
            </label>)}
          </div>
          <div className="mt-[26px] flex flex-col gap-4 text-sm leading-relaxed">
            <label className="flex items-start gap-3"><input className="mt-1" type="checkbox" name="is18" value="true" required />i confirm i am 18 or older</label>
            <label className="flex items-start gap-3"><input className="mt-1" type="checkbox" name="consent" value="true" required />i agree to be contacted by email or instagram about visits to my city. this does not reserve an appointment.</label>
            {errors.is18 && <p className="text-[#a11]">{errors.is18}</p>}
            {errors.consent && <p className="text-[#a11]">{errors.consent}</p>}
          </div>
          <button type="submit" className="mt-[26px] min-h-11 w-full cursor-pointer border border-black bg-white px-4 py-3 font-mono text-sm hover:bg-neutral-100 disabled:opacity-60">{busy ? "joining…" : "join worldwide waitlist"}</button>
        </fieldset>
        {message && <p role={failed ? "alert" : "status"} className={`mt-5 text-sm leading-relaxed ${failed ? "text-[#a11]" : "text-ink"}`}>{message}</p>}
      </form>
    </section>
  );
}
