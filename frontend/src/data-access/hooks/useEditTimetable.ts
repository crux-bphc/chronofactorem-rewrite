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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (e) => toastHandler(e, toast),
  });
};

export default useEditTimetable;
