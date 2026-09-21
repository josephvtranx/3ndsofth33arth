"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Clicks use native links; typing and activation keys also enter. */
export default function LandingInteractions() {
  const router = useRouter();

  useEffect(() => {
    let entering = false;
    const enter = () => {
      if (entering) return;
      entering = true;
      router.push("/home");
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.isComposing) return;
      // Preserve Tab navigation and activation of the focused booking link.
      if (event.target instanceof Element) {
        const control = event.target.closest("a, button, input, textarea, select");
        if (control && control.getAttribute("href") !== "/home") return;
      }
      if (event.key.length === 1 || ["Enter", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "PageDown", "PageUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        enter();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
    };
  }, [router]);

  return null;
}
