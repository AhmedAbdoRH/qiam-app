import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import Slider from "@react-native-community/slider";
import { Plus, Trash2, Pin } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { supabase } from "../lib/supabase";

interface CalTask {
  id: string;
  title: string;
  progress: number;
  tags: string[];
  pinned?: boolean;
}

export const CalendarTaskList: React.FC<{ userId: string }> = ({ userId }) => {
  const [tasks, setTasks] = useState<CalTask[]>([]);
  const [draft, setDraft] = useState("");

  const load = async () => {
    const { data } = await supabase.from("anima_calendar").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    setTasks(((data as any) || []).map((r: any) => ({ id: r.id, title: r.title, progress: r.progress ?? 0, tags: r.tags ?? [], pinned: r.pinned ?? false })));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!draft.trim()) return;
    const title = draft.trim();
    setDraft("");
    const { data, error } = await supabase.from("anima_calendar").insert({ user_id: userId, title, progress: 0, tags: [] } as any).select().single();
    if (error) {
      Alert.alert("خطأ", "تعذر الإضافة");
      return;
    }
    setTasks((p) => [...p, { id: (data as any).id, title, progress: 0, tags: [] }]);
  };

  const update = async (id: string, patch: Partial<CalTask>) => {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await supabase.from("anima_calendar").update(patch as any).eq("id", id).eq("user_id", userId);
  };

  const remove = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
    await supabase.from("anima_calendar").delete().eq("id", id).eq("user_id", userId);
  };

  const sorted = [...tasks].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));

  return (
    <View className="rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-3">
      <Text className="text-white font-bold text-base mb-2 text-right">قائمة التذكيرية</Text>
      <View className="flex-row items-center gap-2 mb-2">
        <Pressable onPress={add} className="bg-amber-500 rounded-lg p-2"><Plus size={18} color="#000" /></Pressable>
        <TextInput value={draft} onChangeText={setDraft} textAlign="right" placeholder="مهمة جديدة..." placeholderTextColor="#52525B" className="flex-1 bg-zinc-900 text-white rounded-lg px-3 py-2 border border-zinc-800" onSubmitEditing={add} />
      </View>
      {sorted.map((t) => (
        <View key={t.id} className="border border-zinc-800 rounded-xl p-2 mb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row gap-1">
              <Pressable onPress={() => update(t.id, { pinned: !t.pinned })} className="p-1"><Pin size={16} color={t.pinned ? "#D4AF37" : "#52525B"} /></Pressable>
              <Pressable onPress={() => remove(t.id)} className="p-1"><Trash2 size={16} color="#EF4444" /></Pressable>
            </View>
            <Text className="text-white flex-1 text-right">{t.title}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-amber-400 text-xs w-12">{Number(t.progress).toFixed(1)}/10</Text>
            <Slider style={{ flex: 1 }} minimumValue={0} maximumValue={10} step={0.1} value={t.progress} onValueChange={(v) => setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, progress: v } : x)))} onSlidingComplete={(v) => update(t.id, { progress: v })} minimumTrackTintColor="#D4AF37" maximumTrackTintColor="#27272A" />
          </View>
        </View>
      ))}
      {sorted.length === 0 && <Text className="text-zinc-500 text-center py-2">لا توجد مهام بعد</Text>}
    </View>
  );
};
