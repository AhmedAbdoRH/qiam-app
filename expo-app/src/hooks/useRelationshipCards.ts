import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export type RelationshipLevel = "A+" | "A" | "B" | "C";

export interface IhsanTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RelationshipCard {
  id: string;
  user_id: string;
  name: string;
  contact_phone: string | null;
  contact_messenger: string | null;
  level: RelationshipLevel;
  tasks: IhsanTask[];
  sort_order: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const LEVEL_ORDER: Record<RelationshipLevel, number> = {
  "A+": 0,
  A: 1,
  B: 2,
  C: 3,
};

const toast = {
  success: (m: string) => console.log("[ok]", m),
  error: (m: string) => Alert.alert("تنبيه", m),
};

export const useRelationshipCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<RelationshipCard[]>([]);
  const [loading, setLoading] = useState(true);

  const sortCards = (list: RelationshipCard[]) =>
    [...list].sort((a, b) => {
      const d = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
      if (d !== 0) return d;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const sortByManual = (list: RelationshipCard[]) =>
    [...list].sort((a, b) => {
      const d = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
      if (d !== 0) return d;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

  const loadCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("relationship_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped: RelationshipCard[] = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        contact_phone: row.contact_phone,
        contact_messenger: row.contact_messenger,
        level: row.level as RelationshipLevel,
        tasks: Array.isArray(row.tasks) ? (row.tasks as IhsanTask[]) : [],
        sort_order: row.sort_order ?? 0,
        avatar_url: row.avatar_url ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      setCards(sortCards(mapped));
    } catch (err) {
      console.error("Error loading relationship cards:", err);
      toast.error("خطأ في تحميل بطاقات العلاقات");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const addCard = async (data: {
    name: string;
    contact_phone?: string;
    contact_messenger?: string;
    level: RelationshipLevel;
  }) => {
    if (!user) return;
    try {
      const sameLevel = cards.filter((c) => c.level === data.level);
      const maxOrder = sameLevel.reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0);
      const nextOrder = maxOrder + 10;
      const { data: inserted, error } = await supabase
        .from("relationship_cards")
        .insert({
          user_id: user.id,
          name: data.name,
          contact_phone: data.contact_phone || null,
          contact_messenger: data.contact_messenger || null,
          level: data.level,
          tasks: [],
          sort_order: nextOrder,
        })
        .select()
        .single();
      if (error) throw error;
      const newCard: RelationshipCard = {
        id: (inserted as any).id,
        user_id: (inserted as any).user_id,
        name: (inserted as any).name,
        contact_phone: (inserted as any).contact_phone,
        contact_messenger: (inserted as any).contact_messenger,
        level: (inserted as any).level as RelationshipLevel,
        tasks: [],
        sort_order: (inserted as any).sort_order ?? nextOrder,
        avatar_url: (inserted as any).avatar_url ?? null,
        created_at: (inserted as any).created_at,
        updated_at: (inserted as any).updated_at,
      };
      setCards((prev) => sortCards([...prev, newCard]));
      toast.success("تمت إضافة البطاقة");
    } catch (err) {
      console.error("Error adding card:", err);
      toast.error("خطأ في إضافة البطاقة");
    }
  };

  const updateCard = async (
    id: string,
    updates: Partial<Pick<RelationshipCard, "name" | "contact_phone" | "contact_messenger" | "level">>
  ) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("relationship_cards")
        .update(updates as any)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      setCards((prev) => sortCards(prev.map((c) => (c.id === id ? { ...c, ...updates } : c))));
      toast.success("تم التحديث");
    } catch (err) {
      console.error("Error updating card:", err);
      toast.error("خطأ في التحديث");
    }
  };

  const deleteCard = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("relationship_cards").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success("تم حذف البطاقة");
    } catch (err) {
      console.error("Error deleting card:", err);
      toast.error("خطأ في حذف البطاقة");
    }
  };

  const updateTasks = async (cardId: string, tasks: IhsanTask[]) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("relationship_cards")
        .update({ tasks: tasks as any })
        .eq("id", cardId)
        .eq("user_id", user.id);
      if (error) throw error;
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, tasks } : c)));
    } catch (err) {
      console.error("Error updating tasks:", err);
      toast.error("خطأ في تحديث المهام");
    }
  };

  const addTask = async (cardId: string, title: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const newTask: IhsanTask = { id: Date.now().toString(), title, completed: false };
    await updateTasks(cardId, [...card.tasks, newTask]);
  };

  const toggleTask = async (cardId: string, taskId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    await updateTasks(
      cardId,
      card.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = async (cardId: string, taskId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    await updateTasks(cardId, card.tasks.filter((t) => t.id !== taskId));
  };

  // Native avatar upload via expo-image-picker + FileSystem base64 → arraybuffer
  const uploadAvatar = async (cardId: string): Promise<string | null> => {
    if (!user) return null;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return null;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error("يلزم إذن الوصول للصور");
      return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.[0]) return null;
    const asset = res.assets[0];
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${cardId}.${ext}`;
      if (card.avatar_url) {
        try {
          const oldPath = card.avatar_url.split("/relationship-avatars/")[1]?.split("?")[0];
          if (oldPath) await supabase.storage.from("relationship-avatars").remove([oldPath]);
        } catch {}
      }
      const { error: uploadErr } = await supabase.storage
        .from("relationship-avatars")
        .upload(path, bytes, { upsert: true, contentType: "image/jpeg" });
      if (uploadErr) throw uploadErr;
      const { data: signedData, error: signedErr } = await supabase.storage
        .from("relationship-avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signedErr) throw signedErr;
      const publicUrl = signedData.signedUrl;
      const { error: dbErr } = await supabase
        .from("relationship_cards")
        .update({ avatar_url: publicUrl } as any)
        .eq("id", cardId)
        .eq("user_id", user.id);
      if (dbErr) throw dbErr;
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, avatar_url: publicUrl } : c)));
      toast.success("تم تحديث الصورة");
      return publicUrl;
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("خطأ في رفع الصورة");
      return null;
    }
  };

  const removeAvatar = async (cardId: string) => {
    if (!user) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card?.avatar_url) return;
    try {
      const oldPath = card.avatar_url.split("/relationship-avatars/")[1]?.split("?")[0];
      if (oldPath) await supabase.storage.from("relationship-avatars").remove([oldPath]);
      const { error: dbErr } = await supabase
        .from("relationship_cards")
        .update({ avatar_url: null } as any)
        .eq("id", cardId)
        .eq("user_id", user.id);
      if (dbErr) throw dbErr;
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, avatar_url: null } : c)));
      toast.success("تم حذف الصورة");
    } catch (err) {
      console.error("Error removing avatar:", err);
      toast.error("خطأ في حذف الصورة");
    }
  };

  const moveCard = async (cardId: string, direction: "up" | "down") => {
    if (!user) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const ordered = sortByManual(cards);
    const sameLevel = ordered.filter((c) => c.level === card.level);
    const idx = sameLevel.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const swapWith = direction === "up" ? sameLevel[idx - 1] : sameLevel[idx + 1];
    if (!swapWith) return;
    const a = card.sort_order ?? 0;
    const b = swapWith.sort_order ?? 0;
    try {
      const results = await Promise.all([
        supabase.from("relationship_cards").update({ sort_order: b } as any).eq("id", card.id).eq("user_id", user.id),
        supabase.from("relationship_cards").update({ sort_order: a } as any).eq("id", swapWith.id).eq("user_id", user.id),
      ]);
      const firstErr = results.find((r) => (r as any).error);
      if ((firstErr as any)?.error) throw (firstErr as any).error;
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === card.id) return { ...c, sort_order: b };
          if (c.id === swapWith.id) return { ...c, sort_order: a };
          return c;
        })
      );
    } catch (err) {
      console.error("Error reordering card:", err);
      toast.error("خطأ في إعادة الترتيب");
    }
  };

  return {
    cards,
    loading,
    addCard,
    updateCard,
    deleteCard,
    addTask,
    toggleTask,
    deleteTask,
    moveCard,
    uploadAvatar,
    removeAvatar,
    refetch: loadCards,
  };
};
