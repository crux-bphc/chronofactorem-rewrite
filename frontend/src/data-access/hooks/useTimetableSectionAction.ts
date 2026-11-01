import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { haptic } from "@/lib/haptics";
import chronoAPI from "../axios";
import toastHandler from "../errors/toastHandler";

type SectionAction = "add" | "remove";

export const useAddRemoveTimetableSection = (
  timetableId: string | undefined,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["sections", timetableId],
    scope: { id: `sections:${timetableId}` },
    mutationFn: async ({
      sectionId,
      action,
    }: {
      sectionId: string;
      action: SectionAction;
    }) => {
      if (timetableId === undefined) throw new Error("Timetable is not loaded");
      const result = await chronoAPI.post(
        `/api/timetable/${timetableId}/${action}`,
        { sectionId },
      );

      return result.data;
    },
    onSuccess: () => {
      // home lists timetables by last edit
      queryClient.invalidateQueries({ queryKey: ["user"] });
      return queryClient.invalidateQueries({
        queryKey: ["timetable", timetableId],
      });
    },
    onError: (error) => {
      haptic("error");
      toastHandler(error, toast);
    },
  });
};

export const useSwapTimetableSections = (timetableId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["sections", timetableId],
    scope: { id: `sections:${timetableId}` },
    mutationFn: async ({
      sectionId,
      newSectionId,
    }: {
      sectionId: string;
      newSectionId: string;
    }) => {
      if (timetableId === undefined) throw new Error("Timetable is not loaded");
      await chronoAPI.post(`/api/timetable/${timetableId}/swap`, {
        sectionId,
        newSectionId,
      });
    },
    onSuccess: () => {
      // home lists timetables by last edit
      queryClient.invalidateQueries({ queryKey: ["user"] });
      return queryClient.invalidateQueries({
        queryKey: ["timetable", timetableId],
      });
    },
    onError: (error) => {
      haptic("error");
      toastHandler(error, toast);
    },
  });
};
