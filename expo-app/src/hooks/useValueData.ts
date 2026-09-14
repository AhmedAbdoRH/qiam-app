import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Port of web useValueData.ts — same table/columns, RN-safe
export const useValueData = () => {
  const [valueData, setValueData] = useState<Record<string, any>>({});

  const fetchValueData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("spiritual_values")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      const map = (data ?? []).reduce((acc: Record<string, any>, item: any) => {
        acc[item.value_id] = {
          balancePercentage: item.balance_percentage ?? 50,
          feelingsBeingHealed: item.selected_feelings ?? item.feelings_being_healed ?? [],
          feelingsHealed: item.positive_feelings ?? [],
          feelingsHealedDates: item.positive_feeling_dates ?? {},
          beliefs: item.beliefs ?? item.feeling_notes ?? {},
          feelingTasks: item.feeling_tasks ?? null,
          truth: item.truth ?? "",
          notes: item.notes ?? "",
          isPinned: item.is_pinned ?? false,
        };
        return acc;
      }, {});
      setValueData(map);
    } catch (e) {
      console.error("Error fetching value data:", e);
    }
  };

  const getValueData = (valueId: string) => {
    return (
      valueData[valueId] || {
        balancePercentage: 50,
        feelingsBeingHealed: [],
        beliefs: {},
        notes: "",
      }
    );
  };

  useEffect(() => {
    fetchValueData();
  }, []);

  return { valueData, getValueData, refresh: fetchValueData };
};
