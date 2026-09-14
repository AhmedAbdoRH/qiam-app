import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { Plus, Trash2 } from "lucide-react-native";
import { supabase } from "../lib/supabase";

export const ShadowsList: React.FC<{ userId: string }> = ({ userId }) => {
  const [items, setItems] = useState<any[]>([]);
  const [draft, setDraft] = useState("");

  const load = async () => {
    const { data } = await (supabase as any).from("sovereign_shadows").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setItems((data as any) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    const { data, error } = await (supabase as any).from("sovereign_shadows").insert({ user_id: userId, content }).select().single();
    if (error) {
      Alert.alert("خطأ", "تعذر الإضافة");
      return;
    }
    setItems((p) => [data as any, ...p]);
  };

  const remove = async (id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
    await (supabase as any).from("sovereign_shadows").delete().eq("id", id).eq("user_id", userId);
  };

  return (
    <View className="rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-3 mt-3">
      <Text className="text-white font-bold text-base mb-2 text-right">الظلال السيادية</Text>
      <View className="flex-row items-center gap-2 mb-2">
        <Pressable onPress={add} className="bg-amber-500 rounded-lg p-2"><Plus size={18} color="#000" /></Pressable>
        <TextInput value={draft} onChangeText={setDraft} textAlign="right" placeholder="ظل جديد..." placeholderTextColor="#52525B" className="flex-1 bg-zinc-900 text-white rounded-lg px-3 py-2 border border-zinc-800" onSubmitEditing={add} />
      </View>
      {items.map((i) => (
        <View key={i.id} className="flex-row items-center justify-between border border-zinc-800 rounded-xl px-3 py-2 mb-1">
          <Pressable onPress={() => remove(i.id)} className="p-1"><Trash2 size={16} color="#EF4444" /></Pressable>
          <Text className="text-white flex-1 text-right">{i.content}</Text>
        </View>
      ))}
    </View>
  );
};
