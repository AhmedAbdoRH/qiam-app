import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Image, Linking, Alert } from "react-native";
import { Phone, MessageCircle, ChevronUp, ChevronDown, Trash2, Plus, Check } from "lucide-react-native";
import { RelationshipCard, useRelationshipCards } from "../hooks/useRelationshipCards";

const LEVEL_COLOR: Record<string, string> = {
  "A+": "#D4AF37",
  A: "#22C55E",
  B: "#3B82F6",
  C: "#71717A",
};

export const RelationshipCardView: React.FC<{ card: RelationshipCard }> = ({ card }) => {
  const { addTask, toggleTask, deleteTask, moveCard, deleteCard, uploadAvatar, removeAvatar } = useRelationshipCards();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");

  const done = card.tasks.filter((t) => t.completed).length;

  return (
    <View className="rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-3 mb-3">
      <Pressable onPress={() => setExpanded(!expanded)} className="flex-row items-center">
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: LEVEL_COLOR[card.level] }}>
          <Text className="text-black text-xs font-bold">{card.level}</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-white font-bold text-base">{card.name}</Text>
          <Text className="text-zinc-500 text-xs">{done}/{card.tasks.length} مهام إحسان</Text>
        </View>
        <Pressable onPress={() => uploadAvatar(card.id)} className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center overflow-hidden">
          {card.avatar_url ? (
            <Image source={{ uri: card.avatar_url }} className="w-12 h-12 rounded-full" />
          ) : (
            <Text className="text-xl">{card.name.slice(0, 1)}</Text>
          )}
        </Pressable>
      </Pressable>
      {expanded && (
        <View className="mt-2">
          <View className="flex-row gap-2 justify-end mb-2">
            {card.contact_phone && (
              <Pressable onPress={() => Linking.openURL(`tel:${card.contact_phone}`)} className="bg-zinc-800 rounded-full p-2">
                <Phone size={16} color="#fff" />
              </Pressable>
            )}
            {card.contact_messenger && (
              <Pressable onPress={() => Linking.openURL(card.contact_messenger!)} className="bg-zinc-800 rounded-full p-2">
                <MessageCircle size={16} color="#fff" />
              </Pressable>
            )}
            <Pressable onPress={() => moveCard(card.id, "up")} className="bg-zinc-800 rounded-full p-2"><ChevronUp size={16} color="#fff" /></Pressable>
            <Pressable onPress={() => moveCard(card.id, "down")} className="bg-zinc-800 rounded-full p-2"><ChevronDown size={16} color="#fff" /></Pressable>
            <Pressable onPress={() => { if (card.avatar_url) removeAvatar(card.id); }} className="bg-zinc-800 rounded-full px-2 py-2">
              <Text className="text-zinc-300 text-[10px]">حذف الصورة</Text>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert("حذف", `حذف بطاقة ${card.name}؟`, [{ text: "إلغاء", style: "cancel" }, { text: "حذف", style: "destructive", onPress: () => deleteCard(card.id) }])}
              className="bg-red-500/20 rounded-full p-2"
            >
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          </View>
          {card.tasks.map((t) => (
            <View key={t.id} className="flex-row items-center justify-between border border-zinc-800 rounded-xl px-3 py-2 mb-1">
              <Pressable onPress={() => deleteTask(card.id, t.id)}><Trash2 size={14} color="#52525B" /></Pressable>
              <Text className={`flex-1 text-right mx-2 ${t.completed ? "text-zinc-500 line-through" : "text-white"}`}>{t.title}</Text>
              <Pressable onPress={() => toggleTask(card.id, t.id)} className={`w-6 h-6 rounded-full items-center justify-center ${t.completed ? "bg-emerald-500" : "border border-zinc-600"}`}>
                {t.completed && <Check size={14} color="#000" />}
              </Pressable>
            </View>
          ))}
          <View className="flex-row items-center gap-2 mt-1">
            <Pressable onPress={() => { if (draft.trim()) { addTask(card.id, draft.trim()); setDraft(""); } }} className="bg-amber-500 rounded-lg p-2">
              <Plus size={16} color="#000" />
            </Pressable>
            <TextInput value={draft} onChangeText={setDraft} textAlign="right" placeholder="مهمة إحسان..." placeholderTextColor="#52525B" className="flex-1 bg-zinc-900 text-white rounded-lg px-3 py-2 border border-zinc-800" onSubmitEditing={() => { if (draft.trim()) { addTask(card.id, draft.trim()); setDraft(""); } }} />
          </View>
        </View>
      )}
    </View>
  );
};
