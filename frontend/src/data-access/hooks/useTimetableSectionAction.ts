import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import chronoAPI from "../axios";
import toastHandler from "../errors/toastHandler";

type SectionAction = "add" | "remove";

export const useAddRemoveTimetableSection = (
  timetableId: string | undefined,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sectionId,
      action,
    }: {
      sectionId: string;
      action: SectionAction;
    }) => {
      if (timetableId === undefined) return;
      const result = await chronoAPI.post(
        `/api/timetable/${timetableId}/${action}`,
        { sectionId },
      );

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable", timetableId] });
    },
    onError: (error) => toastHandler(error, toast),
  });
};

export const useSwapTimetableSections = (timetableId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sectionId,
      newSectionId,
    }: {
      sectionId: string;
      newSectionId: string;
    }) => {
      if (timetableId === undefined) return;
      await chronoAPI.post(`/api/timetable/${timetableId}/remove`, {
        sectionId,
      });
      await chronoAPI.post(`/api/timetable/${timetableId}/add`, {
        sectionId: newSectionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable", timetableId] });
    },
    onError: (error) => toastHandler(error, toast),
  });
};
