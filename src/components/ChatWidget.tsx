import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Modal, FlatList, Alert } from "react-native";
import { X, Send } from "lucide-react-native";
import { supabase } from "../lib/supabase";

// Simplified monologue dialog (used on Behavioral + Divinity) — same table: divine_name_monologues
export const ChatWidget: React.FC<{ userId: string; divineName?: string }> = ({ userId, divineName = "عام" }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");

  const load = async () => {
    const q = supabase.from("divine_name_monologues").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(200);
    const { data } = divineName === "عام" ? await q : await q.eq("divine_name", divineName);
    setMessages((data as any) || []);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const send = async () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    const { data, error } = await supabase
      .from("divine_name_monologues")
      .insert({ user_id: userId, divine_name: divineName, message: text } as any)
      .select()
      .single();
    if (error) {
      Alert.alert("خطأ", "تعذر الإرسال");
      return;
    }
    setMessages((p) => [...p, data as any]);
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
        <Text className="text-white text-center">فتح المناجاة — {divineName}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-black pt-12">
          <View className="flex-row items-center justify-between px-4 pb-2 border-b border-zinc-800">
            <Pressable onPress={() => setOpen(false)} className="p-2"><X size={22} color="#fff" /></Pressable>
            <Text className="text-white font-bold">مناجاة — {divineName}</Text>
            <View className="w-10" />
          </View>
          <FlatList
            data={messages}
            keyExtractor={(i, idx) => i.id ?? String(idx)}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2 my-1">
                <Text className="text-white text-right">{item.message}</Text>
              </View>
            )}
          />
          <View className="flex-row items-center p-3 gap-2 border-t border-zinc-800">
            <Pressable onPress={send} className="bg-amber-500 rounded-full p-3"><Send size={18} color="#000" /></Pressable>
            <TextInput value={draft} onChangeText={setDraft} textAlign="right" placeholder="اكتب مناجاتك..." placeholderTextColor="#52525B" className="flex-1 bg-zinc-900 text-white rounded-full px-4 py-3 border border-zinc-800" onSubmitEditing={send} />
          </View>
        </View>
      </Modal>
    </>
  );
};
