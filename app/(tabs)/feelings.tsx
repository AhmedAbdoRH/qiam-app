import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Heart, Download } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/context/AuthContext";
import { VALUES, DEFAULT_BALANCE_PERCENTAGES, ValueData } from "../../src/types/value";
import { MASCULINE_VALUE_NAMES } from "../../src/types/behavioralValue";
import { ValueCard } from "../../src/components/ValueCard";
import { ValueSheet } from "../../src/components/ValueSheet";
import { downloadAllValuesReport } from "../../src/utils/reportGenerator";

// Port of src/pages/Index.tsx — /feelings الأنوثة: 50-value grid + ValueSheet + overall rating
export default function FeelingsScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading]);

  const { data: rows } = useQuery({
    queryKey: ["spiritual_values", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("spiritual_values").select("*").eq("user_id", user!.id);
      return (data as any) || [];
    },
    enabled: !!user,
  });

  const values: ValueData[] = useMemo(() => {
    const byId: Record<string, any> = {};
    (rows || []).forEach((r: any) => {
      byId[r.value_id] = r;
    });
    return (VALUES as readonly string[]).map((name, idx) => {
      const r = byId[String(idx)];
      return {
        id: String(idx),
        name,
        feelingsBeingHealed: r?.selected_feelings ?? [],
        feelingsHealed: r?.positive_feelings ?? [],
        feelingsHealedDates: r?.positive_feeling_dates ?? {},
        beliefs: r?.beliefs ?? {},
        notes: r?.notes ?? "",
        truth: r?.truth ?? "",
        balancePercentage: r?.balance_percentage ?? DEFAULT_BALANCE_PERCENTAGES[name] ?? 50,
        isPinned: r?.is_pinned ?? false,
      } as ValueData;
    });
  }, [rows]);

  const overall = useMemo(() => {
    if (!values.length) return 0;
    return Math.round(values.reduce((a, v) => a + v.balancePercentage, 0) / values.length);
  }, [values]);
  const rating = overall / 10;

  const masculine = values.filter((v) => (MASCULINE_VALUE_NAMES as readonly string[]).includes(v.name));
  const feminine = values.filter((v) => !(MASCULINE_VALUE_NAMES as readonly string[]).includes(v.name));
  const sortFn = (a: ValueData, b: ValueData) =>
    Number(b.isPinned ?? false) - Number(a.isPinned ?? false) || a.balancePercentage - b.balancePercentage;

  const selected = selectedId != null ? values.find((v) => v.id === selectedId) ?? null : null;

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center"><Text className="text-white">جاري التحميل...</Text></View>
    );
  }
  if (!user) return null;

  const renderGrid = (list: ValueData[]) => (
    <View className="flex-row flex-wrap justify-between">
      {[...list].sort(sortFn).map((v) => (
        <View key={v.id} className="w-[31%] mb-2">
          <ValueCard name={v.name} balancePercentage={v.balancePercentage} isPinned={v.isPinned} onPress={() => setSelectedId(v.id)} />
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View className="items-center py-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 mb-4">
          <Heart size={40} color="#D4AF37" fill="#D4AF37" />
          <Text className="text-white text-2xl font-bold mt-1">{overall}%</Text>
          <Text className="text-zinc-400 text-sm">التقييم العام: {rating.toFixed(1)}/10</Text>
        </View>
        <Text className="text-white font-bold text-right mb-2">القيم العليا ({masculine.length})</Text>
        {renderGrid(masculine)}
        <Text className="text-white font-bold text-right mt-3 mb-2">القيم الأنثوية ({feminine.length})</Text>
        {renderGrid(feminine)}
      </ScrollView>
      <Pressable
        onPress={() => user && downloadAllValuesReport(user.id, user.email)}
        className="absolute bottom-24 left-4 w-14 h-14 rounded-full bg-amber-500 items-center justify-center"
      >
        <Download size={24} color="#000" />
      </Pressable>
      <ValueSheet
        visible={selectedId != null}
        value={selected}
        valueId={selectedId ?? "0"}
        userId={user.id}
        onClose={() => {
          setSelectedId(null);
          queryClient.invalidateQueries({ queryKey: ["spiritual_values", user.id] });
        }}
      />
    </View>
  );
}
