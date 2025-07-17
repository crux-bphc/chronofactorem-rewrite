import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import chronoAPI from "../axios";
import toastHandler from "../errors/toastHandler";

const useDeleteTimetable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return chronoAPI.post(`/api/timetable/${id}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
    onError: (e) => toastHandler(e, toast),
  });
};

export default useDeleteTimetable;
