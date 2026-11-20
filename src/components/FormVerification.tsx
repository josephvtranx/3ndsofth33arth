"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }

export default function FormVerification({ action, attempt }: { action: "booking" | "waitlist"; attempt: number }) {
  const element = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!ready || !element.current || !window.turnstile || !sitekey) return;
    const api = window.turnstile;
    const id = api.render(element.current, {
      sitekey, action, theme: "light", size: "flexible",
      callback: () => setFailed(false),
      "error-callback": () => setFailed(true),
      "expired-callback": () => setFailed(true),
    });
    return () => api.remove(id);
  }, [ready, sitekey, action, attempt]);
  if (!sitekey) return null;
  return (
    <div>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => setFailed(true)} />
      <div ref={element} />
      {failed && <p role="alert" className="mt-2 text-sm text-[#a11]">verification could not finish. please retry the check or reload this page.</p>}
    </div>
  );
}
