import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import chronoAPI from "./axios";
import toastHandler from "./errors/toastHandler";

const useCreateTimetable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return chronoAPI.post<{ message: string; id: string }>(
        "/api/timetable/create",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
    onError: (e) => toastHandler(e, toast),
  });
};

export default useCreateTimetable;
