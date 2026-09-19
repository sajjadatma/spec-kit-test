"use client";

import { useState } from "react";

type Props = { originalSrc: string; resultSrc: string; originalAlt: string; resultAlt: string };
export function ImageComparison({ originalSrc, resultSrc, originalAlt, resultAlt }: Props) {
  const [showResult, setShowResult] = useState(true);
  return <section aria-label="Image comparison">
    <button type="button" aria-pressed={showResult} onClick={() => setShowResult((current) => !current)}>{showResult ? "Show original" : "Show generated result"}</button>
    <img src={showResult ? resultSrc : originalSrc} alt={showResult ? resultAlt : originalAlt} />
  </section>;
}
