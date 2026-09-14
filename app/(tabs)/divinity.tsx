import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Modal, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { X, Pin, PinOff, Send, ExternalLink } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/context/AuthContext";
import { getBalanceColor } from "../../src/utils/balanceCalculator";
import { DivineCommandsTaskList } from "../../src/components/DivineCommandsTaskList";

const divineNames: string[] = [
  "الرحمن", "الرحيم", "العلم", "الحكيم", "التواب",
  "السميع", "العزيز", "الحي", "القيوم", "العلي",
  "العظيم", "الوهاب", "الغني", "الغفور", "القوي",
  "اللطيف", "الكبير", "القهار", "البصير", "الخالق",
  "الحميد", "العدل", "القدير", "الفتاح", "الغفار",
  "الحق", "الملك", "البر", "الرزاق", "المتين",
  "الأول", "الآخر", "الولي", "الطاهر", "الباطن",
  "القدوس", "السلام", "المؤمن", "المهيمن", "الجبار",
  "المتكبر", "الخالق", "البارئ", "المصور", "الودود",
  "الصمد",
];

// Port of src/pages/Divinity.tsx — الإيمان: 51 names grid + per-name sheet (monologue + notes/slider/link)
export default function DivinityScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "note">("chat");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [progress, setProgress] = useState(50);
  const [monologues, setMonologues] = useState<any[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading]);

  useEffect(() => {
    AsyncStorage.getItem("divinity_pinned").then((raw) => {
      if (raw) {
        try {
          setPinned(new Set(JSON.parse(raw)));
        } catch {}
      }
    });
  }, []);

  const togglePin = async (n: string) => {
    const next = new Set(pinned);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    setPinned(next);
    await AsyncStorage.setItem("divinity_pinned", JSON.stringify([...next]));
  };

  const { data: rows } = useQuery({
    queryKey: ["divineNamesData", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("divine_names").select("*").eq("user_id", user!.id);
      return (data as any) || [];
    },
    enabled: !!user,
  });

  const byName = useMemo(() => {
    const m: Record<string, any> = {};
    (rows || []).forEach((r: any) => {
      m[r.divine_name] = r;
    });
    return m;
  }, [rows]);

  const sorted = useMemo(() => {
    const pin = divineNames.filter((n) => pinned.has(n));
    const rest = divineNames.filter((n) => !pinned.has(n));
    const byProg = (a: string, b: string) => (byName[a]?.progress ?? 50) - (byName[b]?.progress ?? 50);
    return [...pin.sort(byProg), ...rest.sort(byProg)];
  }, [pinned, byName]);

  const openName = async (n: string) => {
    setSelected(n);
    setTab("chat");
    const r = byName[n];
    setNote(r?.notes ?? "");
    setLink(r?.verses_link ?? "");
    setProgress(r?.progress ?? 50);
    const { data } = await supabase.from("divine_name_monologues").select("*").eq("user_id", user!.id).eq("divine_name", n).order("created_at", { ascending: true });
    setMonologues((data as any) || []);
  };

  const sendMonologue = async () => {
    if (!draft.trim() || !selected) return;
    const text = draft.trim();
    setDraft("");
    const { data, error } = await supabase.from("divine_name_monologues").insert({ user_id: user!.id, divine_name: selected, message: text } as any).select().single();
    if (!error) setMonologues((p) => [...p, data as any]);
    else Alert.alert("خطأ", "تعذر الإرسال");
  };

  const saveNote = async () => {
    if (!selected) return;
    const { error } = await supabase.from("divine_names").upsert({ user_id: user!.id, divine_name: selected, notes: note, progress, verses_link: link } as any, { onConflict: "user_id,divine_name" });
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["divineNamesData", user!.id] });
      Alert.alert("تم", "تم الحفظ");
    } else Alert.alert("خطأ", "تعذر الحفظ");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center"><Text className="text-white">جاري التحميل...</Text></View>
    );
  }
  if (!user) return null;

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-white text-xl font-bold text-right mb-3">الإيمان — الأسماء الإلهية</Text>
        <DivineCommandsTaskList userId={user.id} />
        <View className="flex-row flex-wrap justify-between mt-3">
          {sorted.map((n) => {
            const p = byName[n]?.progress ?? 50;
            const color = getBalanceColor(p);
            return (
              <Pressable key={n} onPress={() => openName(n)} className="w-[48%] mb-2 rounded-2xl border bg-[#0A0A0A] p-3" style={{ borderColor: color }}>
                <View className="flex-row items-center justify-between">
                  <Pressable onPress={() => togglePin(n)} className="p-1">
                    {pinned.has(n) ? <Pin size={14} color="#D4AF37" /> : <PinOff size={14} color="#52525B" />}
                  </Pressable>
                  <Text className="text-white font-bold">{n}</Text>
                </View>
                <Text className="text-zinc-400 text-xs text-right mt-1">{p}%</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <Modal visible={selected != null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        <View className="flex-1 bg-black pt-12">
          <View className="flex-row items-center justify-between px-4 pb-2 border-b border-zinc-800">
            <Pressable onPress={() => setSelected(null)} className="p-2"><X size={22} color="#fff" /></Pressable>
            <Text className="text-white font-bold text-lg">{selected}</Text>
            <View className="w-10" />
          </View>
          <View className="flex-row p-2 gap-2">
            <Pressable onPress={() => setTab("chat")} className={`flex-1 rounded-full p-2 ${tab === "chat" ? "bg-amber-500" : "bg-zinc-800"}`}>
              <Text className={`text-center ${tab === "chat" ? "text-black font-bold" : "text-white"}`}>مناجاة</Text>
            </Pressable>
            <Pressable onPress={() => setTab("note")} className={`flex-1 rounded-full p-2 ${tab === "note" ? "bg-amber-500" : "bg-zinc-800"}`}>
              <Text className={`text-center ${tab === "note" ? "text-black font-bold" : "text-white"}`}>ملاحظة وحفظ</Text>
            </Pressable>
          </View>
          {tab === "chat" ? (
            <View className="flex-1">
              <ScrollView className="flex-1 px-3">
                {monologues.map((m, i) => (
                  <View key={m.id ?? i} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2 my-1">
                    <Text className="text-white text-right">{m.message}</Text>
                  </View>
                ))}
              </ScrollView>
              <View className="flex-row items-center p-3 gap-2 border-t border-zinc-800">
                <Pressable onPress={sendMonologue} className="bg-amber-500 rounded-full p-3"><Send size={18} color="#000" /></Pressable>
                <TextInput value={draft} onChangeText={setDraft} textAlign="right" placeholder="اكتب مناجاتك..." placeholderTextColor="#52525B" className="flex-1 bg-zinc-900 text-white rounded-full px-4 py-3 border border-zinc-800" onSubmitEditing={sendMonologue} />
              </View>
            </View>
          ) : (
            <ScrollView className="flex-1 px-4 py-2">
              <Text className="text-zinc-400 mb-1 text-right">التقدم: {Math.round(progress)}%</Text>
              <Slider minimumValue={0} maximumValue={100} step={1} value={progress} onValueChange={setProgress} minimumTrackTintColor="#D4AF37" maximumTrackTintColor="#27272A" />
              <Text className="text-zinc-400 mt-2 mb-1 text-right">ملاحظة</Text>
              <TextInput value={note} onChangeText={setNote} multiline textAlign="right" className="bg-zinc-900 text-white rounded-xl p-3 min-h-[120px] border border-zinc-800" placeholder="ملاحظتك..." placeholderTextColor="#52525B" />
              <Text className="text-zinc-400 mt-2 mb-1 text-right">رابط الآيات</Text>
              <TextInput value={link} onChangeText={setLink} textAlign="right" className="bg-zinc-900 text-white rounded-xl px-3 py-2 border border-zinc-800" placeholder="https://..." placeholderTextColor="#52525B" />
              {link ? (
                <Pressable onPress={() => Linking.openURL(link)} className="flex-row items-center justify-end gap-1 mt-2">
                  <Text className="text-amber-400">فتح الرابط</Text>
                  <ExternalLink size={14} color="#D4AF37" />
                </Pressable>
              ) : null}
              <Pressable onPress={saveNote} className="bg-amber-500 rounded-xl p-3 mt-4">
                <Text className="text-black font-bold text-center">حفظ</Text>
              </Pressable>
              <View className="h-10" />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
