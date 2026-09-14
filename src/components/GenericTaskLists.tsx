import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
import { Plus, Trash2 } from "lucide-react-native";
import * as Crypto from "expo-crypto";

interface Item {
  id: string;
  text: string;
  intensity: number;
}

// Behavioral: green HIGH, red LOW (intensity 0-10)
export const BehavioralTaskList: React.FC<{ raw: string; onChange: (raw: string) => void }> = ({ raw, onChange }) => {
  const items: Item[] = React.useMemo(() => {
    try {
      const p = JSON.parse(raw || "[]");
      return Array.isArray(p) ? p.map((t: any) => ({ id: t.id || Crypto.randomUUID(), text: t.text || "", intensity: t.intensity ?? 0 })) : [];
    } catch {
      return [];
    }
  }, [raw]);
  const [draft, setDraft] = useState("");
  const commit = (n: Item[]) => onChange(JSON.stringify(n));
  return (
    <View>
      {items.map((t) => (
        <View key={t.id} className="border border-zinc-800 rounded-xl p-2 mb-2">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => commit(items.filter((x) => x.id !== t.id))}><Trash2 size={15} color="#EF4444" /></Pressable>
            <Text className="text-white flex-1 text-right">{t.text}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xs w-12" style={{ color: t.intensity >= 7 ? "#22C55E" : "#EF4444" }}>{t.intensity}/10</Text>
            <Slider style={{ flex: 1 }} minimumValue={0} maximumValue={10} step={1} value={t.intensity} onValueChange={(v) => commit(items.map((x) => (x.id === t.id ? { ...x, intensity: v } : x)))} minimumTrackTintColor="#22C55E" maximumTrackTintColor="#27272A" />
          </View>
        </View>
      ))}
      <View className="flex-row gap-2">
        <Pressable onPress={() => { if (draft.trim()) { commit([...items, { id: Crypto.randomUUID(), text: draft.trim(), intensity: 5 }]); setDraft(""); } }} className="bg-amber-500 rounded-lg p-2"><Plus size={16} color="#000" /></Pressable>
        <TextInput value={draft} onChangeText={setDraft} textAlign="right" placeholder="سلوك جديد..." placeholderTextColor="#52525B" className="flex-1 bg-zinc-900 text-white rounded-lg px-3 py-2 border border-zinc-800" />
      </View>
    </View>
  );
};

// Feeling/cleansing variant: green LOW, red HIGH
export const FeelingTaskList: React.FC<{ raw: string; onChange: (raw: string) => void }> = ({ raw, onChange }) => {
  const items: Item[] = React.useMemo(() => {
    try {
      const p = JSON.parse(raw || "[]");
      return Array.isArray(p) ? p.map((t: any) => ({ id: t.id || Crypto.randomUUID(), text: t.text || "", intensity: t.intensity ?? 0 })) : [];
    } catch {
      return [];
    }
  }, [raw]);
  const [draft, setDraft] = useState("");
  const commit = (n: Item[]) => onChange(JSON.stringify(n));
  return (
    <View>
      {items.map((t) => (
        <View key={t.id} className="border border-zinc-800 rounded-xl p-2 mb-2">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => commit(items.filter((x) => x.id !== t.id))}><Trash2 size={15} color="#EF4444" /></Pressable>
            <Text className="text-white flex-1 text-right">{t.text}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xs w-12" style={{ color: t.intensity <= 3 ? "#22C55E" : "#EF4444" }}>{t.intensity}/10</Text>
            <Slider style={{ flex: 1 }} minimumValue={0} maximumValue={10} step={1} value={t.intensity} onValueChange={(v) => commit(items.map((x) => (x.id === t.id ? { ...x, intensity: v } : x)))} minimumTrackTintColor="#EF4444" maximumTrackTintColor="#27272A" />
          </View>
        </View>
      ))}
      <View className="flex-row gap-2">
        <Pressable onPress={() => { if (draft.trim()) { commit([...items, { id: Crypto.randomUUID(), text: draft.trim(), intensity: 5 }]); setDraft(""); } }} className="bg-amber-500 rounded-lg p-2"><Plus size={16} color="#000" /></Pressable>
        <TextInput value={draft} onChangeText={setDraft} textAlign="right" placeholder="شعور جديد..." placeholderTextColor="#52525B" className="flex-1 bg-zinc-900 text-white rounded-lg px-3 py-2 border border-zinc-800" />
      </View>
    </View>
  );
};
