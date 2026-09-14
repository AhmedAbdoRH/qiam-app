/**
 * MilestoneParser — pure parsing + display helpers for special chat tags.
 *
 * Supported tags (kept in sync with `reportGenerator.parseMilestone`):
 * - `__KISS__`, `__TOUCH__`, `__SHOWER__`, `__SELFHUG__`
 * - `__REALITY__|…`, `__DREAM__|…`, `__FALL__|…`, `__MILESTONE__…`
 */

export type MilestoneKind =
  | "kiss"
  | "touch"
  | "shower"
  | "selfhug"
  | "reality"
  | "dream"
  | "fall"
  | "milestone"
  | "text";

export interface ParsedMilestone {
  kind: MilestoneKind;
  /** Short Arabic label shown as a badge in the bubble. */
  label: string | null;
  /** Remaining free-text detail (notes / description), if any. */
  detail: string | null;
  /** True when the raw message is a tag rather than plain text. */
  isSpecial: boolean;
}

const SIMPLE_TAGS: Record<string, { kind: MilestoneKind; label: string }> = {
  __KISS__: { kind: "kiss", label: "قبلة حميمية" },
  __TOUCH__: { kind: "touch", label: "لمس حنون" },
  __SHOWER__: { kind: "shower", label: "دش دافئ حميمي" },
  __SELFHUG__: { kind: "selfhug", label: "حضن ذاتي" },
};

const PREFIXED_TAGS: Array<{ prefix: string; kind: MilestoneKind; label: string }> = [
  { prefix: "__REALITY__", kind: "reality", label: "حدث في الواقع" },
  { prefix: "__DREAM__", kind: "dream", label: "حلم" },
  { prefix: "__FALL__", kind: "fall", label: "سقوط" },
  { prefix: "__MILESTONE__", kind: "milestone", label: "معلم" },
];

export function parseMilestoneTag(raw: string): ParsedMilestone {
  const message = (raw ?? "").trim();

  const simple = SIMPLE_TAGS[message];
  if (simple) {
    return { kind: simple.kind, label: simple.label, detail: null, isSpecial: true };
  }

  for (const { prefix, kind, label } of PREFIXED_TAGS) {
    if (message.startsWith(prefix)) {
      const rest = message.slice(prefix.length).replace(/^\|/, "").trim();
      // For __MILESTONE__ the first pipe-segment is the type; keep it as the label detail.
      let detail: string | null = rest || null;
      let resolvedLabel = label;
      if (kind === "milestone" && rest) {
        const [type, ...others] = rest.split("|").map((s) => s.trim());
        if (type) resolvedLabel = type;
        detail = others.filter(Boolean).join(" — ") || null;
      }
      return { kind, label: resolvedLabel, detail, isSpecial: true };
    }
  }

  return { kind: "text", label: null, detail: null, isSpecial: false };
}

/** Human-readable text for a bubble (badge label + detail, or the raw text). */
export function formatMilestoneText(raw: string): string {
  const parsed = parseMilestoneTag(raw);
  if (!parsed.isSpecial) return raw;
  if (parsed.detail) return `${parsed.label} — ${parsed.detail}`;
  return parsed.label ?? raw;
}

/** Quick-send milestone chips shown above the input bar. */
export interface QuickMilestone {
  tag: string;
  label: string;
}

export const QUICK_MILESTONES: QuickMilestone[] = [
  { tag: "__KISS__", label: "قبلة" },
  { tag: "__TOUCH__", label: "لمسة" },
  { tag: "__SHOWER__", label: "دش" },
  { tag: "__SELFHUG__", label: "حضن" },
];
