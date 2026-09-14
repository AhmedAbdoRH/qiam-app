/**
 * Backwards-compatible entry point.
 * Implementation lives in `./chat/` — this module re-exports the public API
 * so existing imports (`components/SelfDialogueChat`) keep working.
 */
export { SelfDialogueChat, type ChatMode } from "./chat/SelfDialogueChat";
