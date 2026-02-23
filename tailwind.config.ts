import type { Config } from "tailwindcss";

/**
 * Tailwind 4 provides built-in `rtl:` variant.
 * Layout uses logical properties (ms-/me-, ps-/pe-) in sidebar and header for RTL.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
} satisfies Config;
