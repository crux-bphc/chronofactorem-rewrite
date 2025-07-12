import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import toastHandler from "./errors/toastHandler";

const useDeleteTimetable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return axios.post(`/api/timetable/${id}/delete`);
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
