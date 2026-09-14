import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import Slider from "@react-native-community/slider";
import { Plus, Trash2 } from "lucide-react-native";
import { supabase } from "../lib/supabase";

interface CmdTask {
  id: string;
  title: string;
  progress: number;
}

export const DivineCommandsTaskList: React.FC<{ userId: string }> = ({ userId }) => {
  const [tasks, setTasks] = useState<CmdTask[]>([]);
  const [draft, setDraft] = useState("");

  const load = async () => {
    const { data } = await (supabase as any).from("divine_commands_tasks").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    setTasks(((data as any) || []).map((r: any) => ({ id: r.id, title: r.title, progress: r.progress ?? 0 })));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!draft.trim()) return;
    const title = draft.trim();
    setDraft("");
    const { data, error } = await (supabase as any).from("divine_commands_tasks").insert({ user_id: userId, title, progress: 0 }).select().single();
    if (error) {
      Alert.alert("خطأ", "تعذر الإضافة");
      return;
    }
    setTasks((p) => [...p, { id: (data as any).id, title, progress: 0 }].sort((a, b) => a.progress - b.progress));
  };

  const update = async (id: string, progress: number) => {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, progress } : t)));
    await (supabase as any).from("divine_commands_tasks").update({ progress }).eq("id", id).eq("user_id", userId);
  };

  const remove = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
    await (supabase as any).from("divine_commands_tasks").delete().eq("id", id).eq("user_id", userId);
  };

  return (
    <View className="rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-3 mt-3">
      <Text className="text-white font-bold text-base mb-2 text-right">الأوامر الإلهية</Text>
      <View className="flex-row items-center gap-2 mb-2">
        <Pressable onPress={add} className="bg-amber-500 rounded-lg p-2"><Plus size={18} color="#000" /></Pressable>
        <TextInput value={draft} onChangeText={setDraft} textAlign="right" placeholder="أمر جديد..." placeholderTextColor="#52525B" className="flex-1 bg-zinc-900 text-white rounded-lg px-3 py-2 border border-zinc-800" onSubmitEditing={add} />
      </View>
      {[...tasks].sort((a, b) => a.progress - b.progress).map((t) => (
        <View key={t.id} className="border border-zinc-800 rounded-xl p-2 mb-2">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => remove(t.id)} className="p-1"><Trash2 size={16} color="#EF4444" /></Pressable>
            <Text className="text-white flex-1 text-right">{t.title}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-amber-400 text-xs w-12">{Number(t.progress).toFixed(1)}/10</Text>
            <Slider style={{ flex: 1 }} minimumValue={0} maximumValue={10} step={0.1} value={t.progress} onValueChange={(v) => setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, progress: v } : x)))} onSlidingComplete={(v) => update(t.id, v)} minimumTrackTintColor="#D4AF37" maximumTrackTintColor="#27272A" />
          </View>
        </View>
      ))}
    </View>
  );
};
