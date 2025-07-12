import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import chronoAPI from "./axios";
import toastHandler from "./errors/toastHandler";

type SectionAction = "add" | "remove";

const useTimetableSectionAction = (timetableId: string | undefined) => {
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

export default useTimetableSectionAction;
