import { z } from "zod";
import { timetableType } from "../../../lib";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Edit2, Trash } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useToast } from "./ui/use-toast";

type Props = {
  timetable: z.infer<typeof timetableType>;
  isPrivate: boolean;
  isDraft: boolean;
};

function TimetableCard({ timetable, isPrivate, isDraft }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => {
      return axios.post(`/api/timetable/${timetable.id}/delete`);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      // TODO: Discuss about error handling
      if (error instanceof AxiosError) {
        toast({
          title: "Error",
          description: error.response?.data.message,
          variant: "destructive",
        });
      }
    },
  });

  const editMutation = useMutation({
    mutationFn: (body: {
      name: string;
      isPrivate: boolean;
      isDraft: boolean;
    }) => {
      return axios.post(`/api/timetable/${timetable.id}/edit`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      // TODO: Discuss about error handling
      if (error instanceof AxiosError) {
        toast({
          title: "Error",
          description: error.response?.data.message,
          variant: "destructive",
        });
      }
    },
  });

  return (
    <Card className="min-h-60 flex flex-col min-w-80 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl">{timetable.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant="default" className="w-fit">
          <p className="flex items-center gap-1">
            <span>{timetable.acadYear}</span>
            <span>|</span>
            <span>{timetable.degrees.join("")}</span>
            <span>|</span>
            <span className="flex-none">{`${timetable.year}-${timetable.semester}`}</span>
          </p>
        </Badge>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 mt-auto">
        {!isDraft && (
          <Button
            variant="outline"
            onClick={() =>
              editMutation.mutate({
                name: timetable.name,
                isPrivate: !isPrivate,
                isDraft: timetable.draft,
              })
            }
          >
            Make {isPrivate ? "Public" : "Private"}
          </Button>
        )}
        <Button
          variant="ghost"
          className="rounded-full p-3"
          onClick={() =>
            editMutation.mutate({
              name: timetable.name,
              isPrivate: timetable.private,
              isDraft: true,
            })
          }
        >
          <Edit2 />
        </Button>
        <Button
          variant="ghost"
          className="rounded-full p-3"
          onClick={() => deleteMutation.mutate()}
        >
          <Trash />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default TimetableCard;
