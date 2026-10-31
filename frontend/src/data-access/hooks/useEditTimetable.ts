import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import chronoAPI from "../axios";
import toastHandler from "../errors/toastHandler";

type EditTimetableParams = {
  id: string;
  body: {
    name: string;
    isPrivate: boolean;
    isDraft: boolean;
  };
};

// Shared so every caller sees one edit in flight, wherever it was started.
export const editTimetableKey = ["editTimetable"];

const useEditTimetable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: editTimetableKey,
    mutationFn: (data: EditTimetableParams) => {
      return chronoAPI.post(`/api/timetable/${data.id}/edit`, data.body);
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // Make sure we actually refetch data here!
      await queryClient.invalidateQueries(
        { queryKey: ["timetable", variables.id], refetchType: "all" },
        { throwOnError: true },
      );
    },
    onError: (e) => toastHandler(e, toast),
  });
};

export default useEditTimetable;
