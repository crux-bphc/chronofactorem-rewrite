import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const useCreateTimetable = () =>
  useMutation({
    mutationFn: () => {
      return axios.post<{ message: string; id: string }>(
        "/api/timetable/create",
      );
    },
  });

export default useCreateTimetable;
