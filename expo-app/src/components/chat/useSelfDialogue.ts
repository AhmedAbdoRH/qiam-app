import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import {
  ChatMessage,
  ChatMode,
  modeVariants,
  normalizeMode,
} from "./types";

const TABLE = "self_dialogue_messages";
const PAGE_SIZE = 50;
const CACHE_PREFIX = "self_dialogue_cache:v1";

interface UseSelfDialogueOptions {
  userId: string;
  mode: ChatMode;
  sessionTitle?: string;
  pageSize?: number;
}

interface UseSelfDialogueResult {
  messages: ChatMessage[];
  loading: boolean;
  loadingMore: boolean;
  sending: boolean;
  refreshing: boolean;
  isOffline: boolean;
  hasMore: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<boolean>;
  retryMessage: (id: string) => Promise<boolean>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  archiveActiveSession: () => Promise<boolean>;
  clearError: () => void;
}

const cacheKey = (userId: string, mode: ChatMode) =>
  `${CACHE_PREFIX}:${userId}:${normalizeMode(mode)}`;

function toChatMessage(row: any): ChatMessage {
  return {
    id: String(row.id),
    user_id: String(row.user_id ?? ""),
    message: String(row.message ?? ""),
    sender: String(row.sender ?? "me"),
    chat_mode: String(row.chat_mode ?? "nafs"),
    is_archived: (row.is_archived as boolean | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    session_title: (row.session_title as string | null) ?? null,
    archive_session_id: (row.archive_session_id as string | null) ?? null,
    status: "sent",
  };
}

async function readCache(key: string): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function writeCache(key: string, messages: ChatMessage[]): void {
  // Newest-first slice keeps the cache small; fire-and-forget.
  const snapshot = [...messages]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, PAGE_SIZE)
    .map(({ status: _status, ...rest }) => rest);
  AsyncStorage.setItem(key, JSON.stringify(snapshot)).catch(() => {});
}

/**
 * All data-access for the self-dialogue chat: Supabase queries, per-mode
 * caching, optimistic sends, cursor pagination and archiving.
 * Messages are exposed oldest-first (container reverses for the inverted list).
 */
export function useSelfDialogue({
  userId,
  mode,
  sessionTitle = "جلسة حوار",
  pageSize = PAGE_SIZE,
}: UseSelfDialogueOptions): UseSelfDialogueResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const key = cacheKey(userId, mode);
  const variants = modeVariants(mode);

  /** Single shared query builder — every fetch filters the active session. */
  const baseQuery = useCallback(() => {
    return supabase
      .from(TABLE)
      .select("*")
      .eq("user_id", userId)
      .in_("chat_mode", variants)
      .or("is_archived.is.null,is_archived.eq.false");
  }, [userId, variants.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPage = useCallback(
    async (from: number, to: number): Promise<ChatMessage[]> => {
      const { data, error: fetchError } = await baseQuery()
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (fetchError) throw fetchError;
      return ((data as any[]) || []).map(toChatMessage);
    },
    [baseQuery]
  );

  const initialLoad = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    setHasMore(true);

    // 1) Instant offline/fallback render from cache.
    const cached = await readCache(key);
    if (current !== requestId.current) return;
    if (cached.length > 0) {
      setMessages(
        [...cached].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      );
    }

    // 2) Fresh page from Supabase.
    try {
      const page = await fetchPage(0, pageSize - 1);
      if (current !== requestId.current) return;
      const asc = [...page].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      setMessages(asc);
      setHasMore(page.length === pageSize);
      setIsOffline(false);
      writeCache(key, asc);
    } catch {
      if (current !== requestId.current) return;
      // Keep cached rows visible; surface offline state only when empty.
      setIsOffline(true);
      if (cached.length === 0) setError("تعذر تحميل الرسائل — تحقق من الاتصال");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [key, fetchPage, pageSize]);

  // Reset + reload whenever the identity (user/mode) changes. Single effect.
  useEffect(() => {
    setMessages([]);
    void initialLoad();
  }, [userId, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(messages.length, messages.length + pageSize - 1);
      const merged = new Map<string, ChatMessage>();
      [...messages, ...page].forEach((m) => merged.set(m.id, m));
      const asc = [...merged.values()].sort((a, b) =>
        a.created_at < b.created_at ? -1 : 1
      );
      setMessages(asc);
      setHasMore(page.length === pageSize);
      setIsOffline(false);
      writeCache(key, asc);
    } catch {
      setIsOffline(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, messages, fetchPage, pageSize, key]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await initialLoad();
    setRefreshing(false);
  }, [initialLoad]);

  const persistMessage = useCallback(
    async (text: string) => {
      const { data, error: insertError } = await supabase
        .from(TABLE)
        .insert({
          user_id: userId,
          sender: "me",
          chat_mode: normalizeMode(mode),
          message: text,
          session_title: sessionTitle,
        } as any)
        .select()
        .single();
      if (insertError) throw insertError;
      return toChatMessage(data);
    },
    [userId, mode, sessionTitle]
  );

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || sending) return false;
      setSending(true);
      setError(null);

      const tempId = `local-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        user_id: userId,
        message: trimmed,
        sender: "me",
        chat_mode: normalizeMode(mode),
        is_archived: false,
        created_at: new Date().toISOString(),
        session_title: sessionTitle,
        status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const saved = await persistMessage(trimmed);
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === tempId ? saved : m));
          writeCache(key, next);
          return next;
        });
        setIsOffline(false);
        return true;
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" as const } : m))
        );
        setError("تعذر إرسال الرسالة — تحقق من الاتصال وحاول مجددًا");
        return false;
      } finally {
        setSending(false);
      }
    },
    [userId, mode, sessionTitle, sending, persistMessage, key]
  );

  const retryMessage = useCallback(
    async (id: string): Promise<boolean> => {
      const target = messages.find((m) => m.id === id);
      if (!target || target.status !== "failed") return false;
      setMessages((prev) => prev.filter((m) => m.id !== id));
      return sendMessage(target.message);
    },
    [messages, sendMessage]
  );

  /**
   * Archive the active (unarchived) session for this mode and start fresh.
   * Rows are stamped with a shared `archive_session_id` so the archived
   * session stays queryable as a unit.
   */
  const archiveActiveSession = useCallback(async (): Promise<boolean> => {
    setError(null);
    const archiveSessionId = `arch-${Date.now()}`;
    try {
      const { error: archiveError } = await supabase
        .from(TABLE)
        .update({ is_archived: true, archive_session_id: archiveSessionId } as any)
        .eq("user_id", userId)
        .in_("chat_mode", variants)
        .or("is_archived.is.null,is_archived.eq.false");
      if (archiveError) throw archiveError;
      setMessages([]);
      setHasMore(false);
      await AsyncStorage.removeItem(key).catch(() => {});
      return true;
    } catch {
      setError("تعذر أرشفة الرسائل — حاول مجددًا");
      return false;
    }
  }, [userId, variants.join("|"), key]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    loading,
    loadingMore,
    sending,
    refreshing,
    isOffline,
    hasMore,
    error,
    sendMessage,
    retryMessage,
    loadMore,
    refresh,
    archiveActiveSession,
    clearError,
  };
}
