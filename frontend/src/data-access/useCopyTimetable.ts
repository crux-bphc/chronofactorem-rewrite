import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import chronoAPI from "./axios";
import toastHandler from "./errors/toastHandler";

const useCopyTimetable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return chronoAPI.post<{ message: string; id: string }>(
        `/api/timetable/${id}/copy`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => toastHandler(error, toast),
  });
};

export default useCopyTimetable;
