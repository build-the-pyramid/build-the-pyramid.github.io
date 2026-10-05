"use client";

import { useEffect } from "react";

const scriptUrl = "https://pl31675031.profitableratecpmnetwork.com/5b/ba/9a/5bba9a9ee2e56114db8007b70249564c.js";

export function SocialBar() {
  useEffect(() => {
    const start = setTimeout(() => {
      if (document.querySelector(`script[src="${scriptUrl}"]`)) return;
      const script = document.createElement("script");
      script.src = scriptUrl;
      document.body.appendChild(script);
    }, 0);
    // The global script remains for the document lifetime, including history
    // navigation; Strict Mode's discarded mount never appends it.
    return () => clearTimeout(start);
  }, []);

  return null;
}
