import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import Slider from "@react-native-community/slider";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react-native";
import { supabase } from "../lib/supabase";

export const DEFAULT_HABITS = [
  { key: "sleep", label: "النوم السليم", icon: "🌙" },
  { key: "eating", label: "نظام الأكل الصحي", icon: "🥗" },
  { key: "exercise", label: "الرياضة / الجيم", icon: "💪" },
  { key: "chastity", label: "حفظ الفرج", icon: "🛡️" },
  { key: "intimacy", label: "التواصل الحميمي", icon: "💞" },
  { key: "work", label: "الالتزام بوقت العمل", icon: "⏱️" },
  { key: "silence", label: "الصمت وعدم الكلام الخفيف", icon: "🤫" },
  { key: "quran", label: "ورد القرآن والأذكار", icon: "📖" },
  { key: "mindfulness", label: "الحضور الذهني", icon: "🧘" },
  { key: "purification", label: "جلسة تطهير شعور كاملة", icon: "✨" },
] as const;

type HabitKey = (typeof DEFAULT_HABITS)[number]["key"];
type Scores = Partial<Record<HabitKey, number>>;
type Labels = Partial<Record<HabitKey, string>>;

const formatDateISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const formatArabicDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const calcAverage = (s: Scores) => DEFAULT_HABITS.map((h) => s[h.key] ?? 0).reduce((a, b) => a + b, 0) / DEFAULT_HABITS.length;
const getLabel = (key: HabitKey, labels: Labels) => labels[key]?.trim() || DEFAULT_HABITS.find((h) => h.key === key)?.label || key;

const scoreColor = (s: number) => (s >= 8 ? "#34D399" : s >= 6 ? "#A3E635" : s >= 4 ? "#FBBF24" : s >= 2 ? "#FB923C" : "#F87171");

export const DailyHabitsTracker: React.FC<{ userId: string }> = ({ userId }) => {
  const [dateIso, setDateIso] = useState(formatDateISO(new Date()));
  const [scores, setScores] = useState<Scores>({});
  const [labels, setLabels] = useState<Labels>({});

  const load = async (iso: string) => {
    const [habitsRes, settingsRes] = await Promise.all([
      (supabase as any).from("daily_habits").select("*").eq("user_id", userId).eq("date", iso).maybeSingle(),
      (supabase as any).from("habit_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    const row = habitsRes.data;
    const s: Scores = {};
    DEFAULT_HABITS.forEach((h) => {
      if (row && typeof row[h.key] === "number") s[h.key] = row[h.key];
    });
    setScores(s);
    if (settingsRes.data?.labels) setLabels(settingsRes.data.labels);
  };

  useEffect(() => {
    load(dateIso);
  }, [dateIso]);

  const shiftDay = (delta: number) => {
    const d = new Date(dateIso + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setDateIso(formatDateISO(d));
  };

  const saveScore = async (key: HabitKey, v: number) => {
    setScores((p) => ({ ...p, [key]: v }));
    await (supabase as any).from("daily_habits").upsert({ user_id: userId, date: dateIso, [key]: v }, { onConflict: "user_id,date" });
  };

  const copyYesterday = async () => {
    const d = new Date(dateIso + "T12:00:00");
    d.setDate(d.getDate() - 1);
    const y = formatDateISO(d);
    const { data } = await (supabase as any).from("daily_habits").select("*").eq("user_id", userId).eq("date", y).maybeSingle();
    if (!data) {
      Alert.alert("تنبيه", "لا توجد بيانات للأمس");
      return;
    }
    const s: Scores = {};
    DEFAULT_HABITS.forEach((h) => {
      if (typeof data[h.key] === "number") s[h.key] = data[h.key];
    });
    setScores(s);
    await (supabase as any).from("daily_habits").upsert({ user_id: userId, date: dateIso, ...s }, { onConflict: "user_id,date" });
  };

  const avg = useMemo(() => calcAverage(scores), [scores]);

  return (
    <View className="rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-3 mt-3">
      <View className="flex-row items-center justify-between mb-1">
        <Pressable onPress={() => shiftDay(-1)} className="p-2"><ChevronLeft size={20} color="#fff" /></Pressable>
        <View className="items-center">
          <Text className="text-white font-bold">العادات اليومية</Text>
          <Text className="text-zinc-400 text-xs">{formatArabicDate(dateIso)}</Text>
        </View>
        <Pressable onPress={() => shiftDay(1)} className="p-2"><ChevronRight size={20} color="#fff" /></Pressable>
      </View>
      <View className="flex-row items-center justify-between mb-2">
        <Pressable onPress={copyYesterday} className="flex-row items-center gap-1 bg-zinc-800 rounded-full px-3 py-1">
          <Copy size={14} color="#fff" />
          <Text className="text-white text-xs">نسخ الأمس</Text>
        </Pressable>
        <Text className="text-white font-bold">المتوسط: {avg.toFixed(1)}/10</Text>
      </View>
      <View className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
        <View className="h-2 rounded-full bg-amber-500" style={{ width: `${(avg / 10) * 100}%` }} />
      </View>
      {DEFAULT_HABITS.map((h) => {
        const v = scores[h.key] ?? 0;
        return (
          <View key={h.key} className="border border-zinc-800 rounded-xl p-2 mb-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-bold text-sm" style={{ color: scoreColor(v) }}>{v.toFixed(1)}/10</Text>
              <Text className="text-white text-sm">{h.icon} {getLabel(h.key, labels)}</Text>
            </View>
            <Slider minimumValue={0} maximumValue={10} step={0.1} value={v} onValueChange={(val) => setScores((p) => ({ ...p, [h.key]: val }))} onSlidingComplete={(val) => saveScore(h.key, val)} minimumTrackTintColor={scoreColor(v)} maximumTrackTintColor="#27272A" />
            <TextInput
              value={labels[h.key] ?? ""}
              onChangeText={(t) => setLabels((p) => ({ ...p, [h.key]: t }))}
              onEndEditing={async () => {
                await (supabase as any).from("habit_settings").upsert({ user_id: userId, labels }, { onConflict: "user_id" });
              }}
              textAlign="right"
              placeholder={h.label}
              placeholderTextColor="#52525B"
              className="text-zinc-400 text-xs mt-1"
            />
          </View>
        );
      })}
    </View>
  );
};
