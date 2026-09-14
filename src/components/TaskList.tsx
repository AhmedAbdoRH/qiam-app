import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
import { Plus, Trash2 } from "lucide-react-native";
import * as Crypto from "expo-crypto";

interface BeliefTask {
  id: string;
  text: string;
  severity: number; // 0-9 stored, displayed (sev%10)+1
  healed: boolean;
}

function parse(raw: string): BeliefTask[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) {
      return p.map((t: any) => ({
        id: t.id || Crypto.randomUUID(),
        text: t.text || "",
        severity: typeof t.severity === "number" ? t.severity : 0,
        healed: t.healed === true || t.completed === true,
      }));
    }
    return [{ id: Crypto.randomUUID(), text: String(p), severity: 0, healed: false }];
  } catch {
    return raw.trim() ? [{ id: Crypto.randomUUID(), text: raw.trim(), severity: 0, healed: false }] : [];
  }
}

export const TaskList: React.FC<{ raw: string; onChange: (raw: string) => void }> = ({ raw, onChange }) => {
  const tasks = parse(raw);
  const [draft, setDraft] = useState("");

  const commit = (next: BeliefTask[]) => {
    const sorted = [...next].sort((a, b) => b.severity - a.severity);
    onChange(JSON.stringify(sorted.map(({ id, ...r }) => r)));
  };

  const add = () => {
    if (!draft.trim()) return;
    commit([...tasks, { id: Crypto.randomUUID(), text: draft.trim(), severity: 5, healed: false }]);
    setDraft("");
  };

  return (
    <View className="mt-2">
      {tasks.map((t) => (
        <View key={t.id} className="rounded-lg border border-zinc-800 p-2 mb-2" style={{ backgroundColor: t.healed ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)" }}>
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => commit(tasks.map((x) => (x.id === t.id ? { ...x, healed: !x.healed } : x)))} className={`px-2 py-1 rounded ${t.healed ? "bg-emerald-600" : "bg-zinc-700"}`}>
              <Text className="text-white text-xs">{t.healed ? "تم" : "علاج"}</Text>
            </Pressable>
            <Text className="text-white flex-1 text-right mx-2">{t.text}</Text>
            <Pressable onPress={() => commit(tasks.filter((x) => x.id !== t.id))} className="p-1">
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          </View>
          <View className="flex-row items-center mt-1">
            <Text className="text-zinc-400 text-xs ml-2">الشدة: {(t.severity % 10) + 1}/10</Text>
            <Slider
              style={{ flex: 1 }}
              minimumValue={0}
              maximumValue={9}
              step={1}
              value={t.severity}
              onValueChange={(v) => commit(tasks.map((x) => (x.id === t.id ? { ...x, severity: v } : x)))}
              minimumTrackTintColor="#EF4444"
              maximumTrackTintColor="#27272A"
            />
          </View>
        </View>
      ))}
      <View className="flex-row items-center gap-2">
        <Pressable onPress={add} className="bg-amber-500/20 border border-amber-500/40 rounded-lg p-2">
          <Plus size={18} color="#D4AF37" />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          textAlign="right"
          placeholder="معتقد جديد..."
          placeholderTextColor="#52525B"
          className="flex-1 bg-zinc-900 text-white rounded-lg px-3 py-2 border border-zinc-800"
          onSubmitEditing={add}
        />
      </View>
    </View>
  );
};
