import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, ScrollView, Alert } from "react-native";
import Slider from "@react-native-community/slider";
import { X, Pin, Download } from "lucide-react-native";
import { FEELINGS, ValueData } from "../types/value";
import { calculateBalance } from "../utils/balanceCalculator";
import { supabase } from "../lib/supabase";
import { buildValueMarkdown, shareMarkdown } from "../utils/reportGenerator";
import { TaskList } from "./TaskList";

interface Props {
  visible: boolean;
  value: ValueData | null;
  valueId: string;
  onClose: (updated?: ValueData) => void;
  userId: string;
}

export const ValueSheet: React.FC<Props> = ({ visible, value, valueId, onClose, userId }) => {
  const [local, setLocal] = useState<ValueData | null>(null);
  const active = local ?? value;

  React.useEffect(() => {
    setLocal(value);
  }, [value, visible]);

  if (!active) return null;

  const toggleFeeling = (f: string, kind: "healing" | "healed") => {
    const healing = new Set(active.feelingsBeingHealed);
    const healed = new Set(active.feelingsHealed ?? []);
    if (kind === "healing") {
      if (healing.has(f)) healing.delete(f);
      else {
        healing.add(f);
        healed.delete(f);
      }
    } else {
      if (healed.has(f)) healed.delete(f);
      else {
        healed.add(f);
        healing.delete(f);
      }
    }
    const healingArr = [...healing];
    setLocal({ ...active, feelingsBeingHealed: healingArr, feelingsHealed: [...healed], balancePercentage: calculateBalance(healingArr.length) });
  };

  const save = async (next: ValueData) => {
    try {
      const { error } = await supabase.from("spiritual_values").upsert(
        {
          user_id: userId,
          value_id: valueId,
          value_name: next.name,
          balance_percentage: next.balancePercentage,
          selected_feelings: next.feelingsBeingHealed,
          positive_feelings: next.feelingsHealed ?? [],
          positive_feeling_dates: next.feelingsHealedDates ?? {},
          beliefs: next.beliefs,
          truth: next.truth ?? "",
          notes: next.notes,
          is_pinned: next.isPinned ?? false,
        } as any,
        { onConflict: "user_id,value_id" }
      );
      if (error) throw error;
    } catch (e) {
      console.error(e);
      Alert.alert("خطأ", "تعذر الحفظ");
    }
  };

  const handleClose = async () => {
    if (local && value && JSON.stringify(local) !== JSON.stringify(value)) {
      await save(local);
      onClose(local);
    } else {
      onClose();
    }
  };

  const downloadOne = async () => {
    const md = buildValueMarkdown({
      valueId,
      valueName: active.name,
      balancePercentage: active.balancePercentage,
      isPinned: active.isPinned,
      feelingsBeingHealed: active.feelingsBeingHealed,
      feelingsHealed: active.feelingsHealed,
      feelingsHealedDates: active.feelingsHealedDates,
      beliefs: active.beliefs,
      notes: active.notes,
    });
    await shareMarkdown(`value-${active.name}.md`, md);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View className="flex-1 bg-black pt-10">
        <View className="flex-row items-center justify-between px-4 pb-3 border-b border-zinc-800">
          <Pressable onPress={handleClose} className="p-2"><X size={22} color="#fff" /></Pressable>
          <Text className="text-white text-lg font-bold">{active.name} — {active.balancePercentage}%</Text>
          <View className="flex-row">
            <Pressable onPress={() => setLocal({ ...active, isPinned: !active.isPinned })} className="p-2">
              <Pin size={20} color={active.isPinned ? "#D4AF37" : "#71717A"} />
            </Pressable>
            <Pressable onPress={downloadOne} className="p-2"><Download size={20} color="#fff" /></Pressable>
          </View>
        </View>
        <ScrollView className="flex-1 px-4 py-3">
          <Text className="text-zinc-400 mb-2">المشاعر (جاري علاجها — أحمر / تم علاجها — أخضر)</Text>
          {(FEELINGS as readonly string[]).map((f) => {
            const healing = active.feelingsBeingHealed.includes(f);
            const healed = (active.feelingsHealed ?? []).includes(f);
            return (
              <View key={f} className="mb-3 rounded-xl border border-zinc-800 p-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-bold">{f}</Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => toggleFeeling(f, "healing")}
                      className={`px-3 py-1 rounded-full ${healing ? "bg-red-500" : "bg-zinc-800"}`}
                    >
                      <Text className="text-white text-xs">علاج</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => toggleFeeling(f, "healed")}
                      className={`px-3 py-1 rounded-full ${healed ? "bg-emerald-500" : "bg-zinc-800"}`}
                    >
                      <Text className="text-white text-xs">شُفي</Text>
                    </Pressable>
                  </View>
                </View>
                <TaskList
                  raw={active.beliefs[f] || ""}
                  onChange={(raw) => setLocal({ ...active, beliefs: { ...active.beliefs, [f]: raw } })}
                />
              </View>
            );
          })}
          <Text className="text-zinc-400 mt-2 mb-1">الحقيقة</Text>
          <TextInput
            value={active.truth ?? ""}
            onChangeText={(t) => setLocal({ ...active, truth: t })}
            multiline
            textAlign="right"
            className="bg-zinc-900 text-white rounded-xl p-3 min-h-[80px] border border-zinc-800"
            placeholder="اكتب الحقيقة المحررة..."
            placeholderTextColor="#52525B"
          />
          <Text className="text-zinc-400 mt-3 mb-1">ملاحظات وتأملات</Text>
          <TextInput
            value={active.notes}
            onChangeText={(t) => setLocal({ ...active, notes: t })}
            multiline
            textAlign="right"
            className="bg-zinc-900 text-white rounded-xl p-3 min-h-[100px] border border-zinc-800"
            placeholder="ملاحظات..."
            placeholderTextColor="#52525B"
          />
          <Text className="text-zinc-400 mt-3">الاتزان: {active.balancePercentage}%</Text>
          <Slider
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={active.balancePercentage}
            onValueChange={(v) => setLocal({ ...active, balancePercentage: Math.round(v) })}
            minimumTrackTintColor="#D4AF37"
            maximumTrackTintColor="#27272A"
          />
          <View className="h-10" />
        </ScrollView>
      </View>
    </Modal>
  );
};
