import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import toastHandler from "./errors/toastHandler";

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
      return axios.post(`/api/timetable/${data.id}/edit`, data.body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (e) => toastHandler(e, toast),
  });
};

export default useEditTimetable;
