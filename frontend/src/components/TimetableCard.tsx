import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import axios from "axios";
import { Edit2, Eye, EyeOff, Trash } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import toastHandler from "@/data-access/errors/toastHandler";
import type { timetableType } from "../../../lib/src/index";
import { router } from "../main";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Switch } from "./ui/switch";
import { useToast } from "./ui/use-toast";

type Props = {
  timetable: z.infer<typeof timetableType>;
  showFooter: boolean;
};

function TimetableCard({ timetable, showFooter }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [timetableName, setTimetableName] = useState<null | string>(null);
  const [timetableVisibility, setTimetableVisibility] = useState<
    null | boolean
  >(null);

  const deleteMutation = useMutation({
    mutationFn: () => {
      return axios.post(`/api/timetable/${timetable.id}/delete`);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => toastHandler(error, toast),
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
    onError: (error) => toastHandler(error, toast),
  });

  const editAndNavigateMutation = useMutation({
    mutationFn: (body: {
      name: string;
      isPrivate: boolean;
      isDraft: boolean;
    }) => {
      return axios.post(`/api/timetable/${timetable.id}/edit`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.navigate({
        to: "/edit/$timetableId",
        params: { timetableId: timetable.id },
      });
    },
    onError: (error) => toastHandler(error, toast),
  });

  return (
    <TooltipProvider>
      <Card className="min-h-60 flex flex-col min-w-80 max-w-80 max-h-96 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="relative text-xl md:text-2xl text-wrap justify-between items-center">
            <Link
              to={timetable.draft ? "/edit/$timetableId" : "/view/$timetableId"}
              params={{
                timetableId: timetable.id,
              }}
            >
              {timetable.name}
            </Link>
            <span className="absolute right-2 top-2">
              {timetable.archived && (timetable.private ? <EyeOff /> : <Eye />)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="default" className="w-fit">
            <p className="flex items-center gap-1">
              <span>
                {timetable.acadYear}-
                {(timetable.acadYear + 1).toString().slice(2)}
              </span>
              <span>|</span>
              <span>{timetable.degrees.join("")}</span>
              <span>|</span>
              <span className="flex-none">{`${timetable.year}-${timetable.semester}`}</span>
            </p>
          </Badge>
        </CardContent>
        {showFooter && (
          <CardFooter className="flex justify-end gap-2 mt-auto">
            {!timetable.draft && (
              <Button
                variant="outline"
                onClick={() =>
                  editMutation.mutate({
                    name: timetable.name,
                    isPrivate: !timetable.private,
                    isDraft: timetable.draft,
                  })
                }
              >
                Make {timetable.private ? "Public" : "Private"}
              </Button>
            )}

            {!timetable.archived ? (
              <Button
                variant="ghost"
                className="rounded-full p-3"
                onClick={() => {
                  editAndNavigateMutation.mutate({
                    name: timetable.name,
                    isPrivate: true,
                    isDraft: true,
                  });
                }}
              >
                <Edit2 />
              </Button>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-3">
                    <Edit2 />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Archived Timetable</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={timetableName ?? timetable.name}
                        onChange={(e) => setTimetableName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="mx-auto">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="visibility"
                          checked={timetableVisibility ?? timetable.private}
                          onCheckedChange={setTimetableVisibility}
                        />
                        <Label htmlFor="visibility">Private</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        type="submit"
                        onClick={() => {
                          editMutation.mutate({
                            name: timetableName ?? timetable.name,
                            isPrivate: timetableVisibility ?? timetable.private,
                            isDraft: false,
                          });
                        }}
                      >
                        Save changes
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <AlertDialog>
              <Tooltip>
                <AlertDialogTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-full p-3 hover:bg-destructive/90 hover:text-destructive-foreground"
                    >
                      <Trash />
                    </Button>
                  </TooltipTrigger>
                </AlertDialogTrigger>
                <TooltipContent>
                  <p>Delete Timetable</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent className="p-8">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl">
                    Are you sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-destructive text-lg font-bold">
                    All your progress on this timetable will be lost, and
                    unrecoverable.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogPrimitive.Action asChild>
                    <Button
                      variant="destructive"
                      onClick={() => deleteMutation.mutate()}
                    >
                      Delete
                    </Button>
                  </AlertDialogPrimitive.Action>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  );
}

export default TimetableCard;
