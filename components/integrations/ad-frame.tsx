"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { assetPath } from "@/lib/urls";

type AdKind = "banner" | "native";

/** A fresh document preserves the provider's parser-dependent GET CODE and
 * isolates its globals, timers and late responses from client-side navigation. */
function AdFrameInstance({ kind }: { kind: AdKind }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    const host = hostRef.current;
    if (!slot || !host) return;

    let observer: MutationObserver | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    // Deferring creation cancels React Strict Mode's discarded mount before
    // any third-party request starts. Select exactly one size for this visit.
    const start = setTimeout(() => {
      const mobile = !window.matchMedia("(min-width: 768px)").matches;
      const width = mobile ? 320 : 728;
      const height = mobile ? 50 : 90;
      const frame = document.createElement("iframe");
      frame.title = kind === "banner" ? "Banner advertisement" : "Native advertisement";
      frame.className = "ad-frame";
      frame.dataset.adFrame = kind;
      // A usable inner viewport lets native scripts calculate their layout;
      // its outer shell remains collapsed until a creative is present.
      frame.height = String(kind === "banner" ? height : 250);
      if (kind === "banner") {
        frame.width = String(width);
        slot.style.setProperty("--ad-banner-height", `${height}px`);
      }

      let filled = false;
      const inspect = () => {
        if (disposed) return;
        const doc = frame.contentDocument;
        if (!doc?.body) return;
        const root = kind === "native"
          ? doc.getElementById("container-7859c3a65ce4d37cdc3148d414c15909")
          : doc.body;
        if (!root) return;
        const creative = Array.from(root.querySelectorAll("iframe, img, a, video")).some((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.width > 0 && bounds.height > 0;
        });
        if (creative) {
          filled = true;
          slot.dataset.adState = "filled";
          if (kind === "native") {
            // Measure content, not the document viewport, so native can shrink.
            frame.height = String(Math.ceil(Math.max(root.scrollHeight, root.getBoundingClientRect().height)));
          }
        } else if (filled) {
          filled = false;
          slot.dataset.adState = "empty";
          if (kind === "native") frame.height = "0";
        }
      };

      frame.addEventListener("load", () => {
        if (disposed) return;
        const doc = frame.contentDocument;
        if (!doc?.body) return;
        observer?.disconnect();
        resizeObserver?.disconnect();
        observer = new MutationObserver(inspect);
        observer.observe(doc.body, { childList: true, subtree: true, attributes: true });
        resizeObserver = new ResizeObserver(inspect);
        resizeObserver.observe(doc.body);
        inspect();
        // The parser-driven banner has finished by this point. A blocked or
        // empty response should release its reserved space immediately.
        if (kind === "banner" && !filled) slot.dataset.adState = "empty";
      });
      frame.addEventListener("error", () => { slot.dataset.adState = "empty"; });
      frame.src = assetPath(`/ads/${kind === "native" ? "native-banner" : mobile ? "mobile-banner" : "desktop-banner"}.html`);
      host.appendChild(frame);
      poll = setInterval(inspect, 500);
      deadline = setTimeout(() => {
        if (!filled) slot.dataset.adState = "empty";
      }, 10000);
    }, 0);

    return () => {
      disposed = true;
      clearTimeout(start);
      clearInterval(poll);
      clearTimeout(deadline);
      observer?.disconnect();
      resizeObserver?.disconnect();
      host.replaceChildren();
    };
  }, [kind]);

  return (
    <div ref={slotRef} className={`ad-slot ad-slot-${kind}`} data-ad-slot={kind} data-ad-state="loading">
      <div className="ad-label">Advertisement</div>
      <div ref={hostRef} className="ad-host" />
    </div>
  );
}

export function AdFrame({ kind }: { kind: AdKind }) {
  const pathname = usePathname();
  return <AdFrameInstance key={`${pathname}:${kind}`} kind={kind} />;
}
