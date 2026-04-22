import { useCallback, useRef } from "react";
import { prepareWithSegments, measureNaturalWidth } from "@chenglou/pretext";

interface UsePretextWidthOptions {
  font: string; // ex: "700 24px Inter"
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
}

export function usePretextWidth(options: UsePretextWidthOptions) {
  const cache = useRef<Record<string, number>>({});

  const measure = useCallback(
    (text: string) => {
      if (cache.current[text]) return cache.current[text];
      const prepared = prepareWithSegments(text || " ", options.font);
      let width = measureNaturalWidth(prepared);
      width += options.padding ?? 24;
      if (options.minWidth) width = Math.max(width, options.minWidth);
      if (options.maxWidth) width = Math.min(width, options.maxWidth);
      cache.current[text] = width;
      return width;
    },
    [options],
  );
  return measure;
}
