import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Download } from "lucide-react-native";
import { useAuth } from "../../src/context/AuthContext";
import { CalendarTaskList } from "../../src/components/CalendarTaskList";
import { ShadowsList } from "../../src/components/ShadowsList";
import { DivineCommandsTaskList } from "../../src/components/DivineCommandsTaskList";
import { DailyHabitsTracker } from "../../src/components/DailyHabitsTracker";
import { SelfDialogueChat } from "../../src/components/SelfDialogueChat";
import { ChatWidget } from "../../src/components/ChatWidget";
import { downloadComprehensiveReport, downloadMasculineValuesReport } from "../../src/utils/reportGenerator";

// Port of src/pages/Behavioral.tsx — sovereign hub (default / route)
export default function BehavioralScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [monologueOpen] = useState(false);

  React.useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading]);

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">جاري التحميل...</Text>
      </View>
    );
  }
  if (!user) return null;

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-white text-xl font-bold text-right mb-3">الذات السيادية</Text>
        <CalendarTaskList userId={user.id} />
        <ShadowsList userId={user.id} />
        <DivineCommandsTaskList userId={user.id} />
        <DailyHabitsTracker userId={user.id} />
        <View className="flex-row gap-2 mt-4">
          <Pressable
            onPress={() => downloadComprehensiveReport(user.id, user.email)}
            className="flex-1 bg-amber-500 rounded-xl p-3 flex-row items-center justify-center gap-2"
          >
            <Download size={18} color="#000" />
            <Text className="text-black font-bold">التقرير الشامل</Text>
          </Pressable>
          <Pressable
            onPress={() => downloadMasculineValuesReport(user.id, user.email)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-3 flex-row items-center justify-center gap-2"
          >
            <Download size={18} color="#fff" />
            <Text className="text-white font-bold">تقرير القيم</Text>
          </Pressable>
        </View>
        <View className="mt-3">
          <ChatWidget userId={user.id} divineName="عام" />
        </View>
        <Pressable onPress={() => router.push("/nurturing")} className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <Text className="text-white text-center">فتح صفحة الاحتواء</Text>
        </Pressable>
      </ScrollView>
      <SelfDialogueChat userId={user.id} />
    </View>
  );
}
