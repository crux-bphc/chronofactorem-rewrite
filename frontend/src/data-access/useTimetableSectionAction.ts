import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
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
      const result = await axios.post(
        `/api/timetable/${timetableId}/${action}`,
        { sectionId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
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
