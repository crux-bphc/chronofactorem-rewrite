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

const useEditTimetable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EditTimetableParams) => {
      return chronoAPI.post(`/api/timetable/${data.id}/edit`, data.body);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // the edited timetable's own cache entry is stale too (e.g. draft flag
      // flipped by the edit button), otherwise the edit page bounces back
      // with a spurious "non-draft timetables cannot be edited" error
      queryClient.invalidateQueries({ queryKey: ["timetable", variables.id] });
    },
    onError: (e) => toastHandler(e, toast),
  });
};

export default useEditTimetable;
