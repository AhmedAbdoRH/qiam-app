import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useRelationshipCards, RelationshipLevel } from "../../src/hooks/useRelationshipCards";
import { RelationshipCardView } from "../../src/components/RelationshipCard";

// Port of src/pages/Tasks.tsx — العلاقات grouped A+/A/B/C + FAB add-modal
const LEVELS: RelationshipLevel[] = ["A+", "A", "B", "C"];

export default function TasksScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { cards, loading: cardsLoading, addCard } = useRelationshipCards();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [messenger, setMessenger] = useState("");
  const [level, setLevel] = useState<RelationshipLevel>("A");

  React.useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof cards> = { "A+": [], A: [], B: [], C: [] };
    cards.forEach((c) => {
      (g[c.level] ?? (g[c.level] = [])).push(c);
    });
    return g;
  }, [cards]);

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center"><Text className="text-white">جاري التحميل...</Text></View>
    );
  }
  if (!user) return null;

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("تنبيه", "أدخل الاسم");
      return;
    }
    await addCard({ name: name.trim(), contact_phone: phone.trim() || undefined, contact_messenger: messenger.trim() || undefined, level });
    setName("");
    setPhone("");
    setMessenger("");
    setLevel("A");
    setModal(false);
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-white text-xl font-bold text-right">العلاقات ({cards.length})</Text>
        <View className="flex-row gap-2 my-2 justify-end">
          {LEVELS.map((l) => (
            <View key={l} className="bg-zinc-800 rounded-full px-3 py-1">
              <Text className="text-white text-xs">{l}: {grouped[l]?.length ?? 0}</Text>
            </View>
          ))}
        </View>
        {cardsLoading && <Text className="text-zinc-400 text-center">جاري تحميل البطاقات...</Text>}
        {LEVELS.map((l) => (
          <View key={l}>
            {(grouped[l]?.length ?? 0) > 0 && <Text className="text-amber-400 font-bold text-right mt-2 mb-1">مستوى {l}</Text>}
            {(grouped[l] ?? []).map((c) => (
              <RelationshipCardView key={c.id} card={c} />
            ))}
          </View>
        ))}
        {cards.length === 0 && !cardsLoading && <Text className="text-zinc-500 text-center mt-6">لا توجد علاقات بعد — أضف بطاقتك الأولى</Text>}
      </ScrollView>
      <Pressable onPress={() => setModal(true)} className="absolute bottom-24 left-4 w-14 h-14 rounded-full bg-amber-500 items-center justify-center">
        <Plus size={26} color="#000" />
      </Pressable>
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#0A0A0A] rounded-t-3xl p-5 border-t border-zinc-800">
            <View className="flex-row items-center justify-between mb-3">
              <Pressable onPress={() => setModal(false)} className="p-2"><X size={22} color="#fff" /></Pressable>
              <Text className="text-white font-bold text-lg">بطاقة علاقة جديدة</Text>
              <View className="w-10" />
            </View>
            <TextInput value={name} onChangeText={setName} textAlign="right" placeholder="الاسم *" placeholderTextColor="#52525B" className="bg-zinc-900 text-white rounded-xl px-4 py-3 mb-2 border border-zinc-800" />
            <TextInput value={phone} onChangeText={setPhone} textAlign="right" placeholder="الهاتف" placeholderTextColor="#52525B" keyboardType="phone-pad" className="bg-zinc-900 text-white rounded-xl px-4 py-3 mb-2 border border-zinc-800" />
            <TextInput value={messenger} onChangeText={setMessenger} textAlign="right" placeholder="رابط ماسنجر" placeholderTextColor="#52525B" className="bg-zinc-900 text-white rounded-xl px-4 py-3 mb-2 border border-zinc-800" />
            <View className="flex-row gap-2 justify-end my-2">
              {LEVELS.map((l) => (
                <Pressable key={l} onPress={() => setLevel(l)} className={`px-4 py-2 rounded-full border ${level === l ? "bg-amber-500 border-amber-500" : "border-zinc-700"}`}>
                  <Text className={level === l ? "text-black font-bold" : "text-zinc-300"}>{l}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={submit} className="bg-amber-500 rounded-xl p-3 mt-2">
              <Text className="text-black font-bold text-center">إضافة البطاقة</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
