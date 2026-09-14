/**
 * Shared types for the self-dialogue chat.
 * Single source of truth for the message shape across all modes.
 */

export type ChatMode = "nafs" | "self" | "anima" | "sovereign" | "nurturing";

/** Canonical modes used for storage & queries (`self` is a legacy alias of `nafs`). */
export type CanonicalChatMode = "nafs" | "anima" | "sovereign" | "nurturing";

/** Canonical Arabic labels for the mode selector. */
export const MODE_LABEL: Record<CanonicalChatMode, string> = {
  nafs: "نفس",
  anima: "أنوثة",
  sovereign: "سيادة",
  nurturing: "احتواء",
};

export const CANONICAL_MODES = Object.keys(MODE_LABEL) as CanonicalChatMode[];

/** Map any accepted mode value to its canonical (stored) form. */
export function normalizeMode(mode: ChatMode): CanonicalChatMode {
  return mode === "self" ? "nafs" : mode;
}

/**
 * All stored variants of a mode (covers legacy rows written as `self`
 * alongside the canonical `nafs`). Used with `.in("chat_mode", …)`.
 */
export function modeVariants(mode: ChatMode): string[] {
  const canonical = normalizeMode(mode);
  return canonical === "nafs" ? ["nafs", "self"] : [canonical];
}

export type MessageStatus = "sending" | "sent" | "failed";

/**
 * Standardized message interface shared by every mode.
 * Mirrors `public.self_dialogue_messages` (+ local-only `status`).
 */
export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  sender: string;
  chat_mode: string;
  is_archived: boolean | null;
  created_at: string;
  session_title?: string | null;
  archive_session_id?: string | null;
  /** Local-only delivery state (never persisted). */
  status?: MessageStatus;
}

export function isOwnMessage(msg: Pick<ChatMessage, "sender">): boolean {
  return msg.sender === "me";
}
