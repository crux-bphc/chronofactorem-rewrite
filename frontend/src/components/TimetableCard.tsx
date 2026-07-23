import { Link } from "@tanstack/react-router";
import type { timetableType } from "lib";
import { Edit2, Eye, EyeOff, Trash } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import DeleteTimetableDialog from "@/components/DeleteTimetableDialog";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import useEditTimetable from "@/data-access/hooks/useEditTimetable";
import { router } from "../router";
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

type Props = {
  timetable: z.infer<typeof timetableType>;
  showFooter: boolean;
};

function TimetableCard({ timetable, showFooter }: Props) {
  const [timetableName, setTimetableName] = useState<null | string>(null);
  const [timetableVisibility, setTimetableVisibility] = useState<
    null | boolean
  >(null);

  const { mutate: editTimetable } = useEditTimetable();

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
                  editTimetable({
                    id: timetable.id,
                    body: {
                      name: timetable.name,
                      isPrivate: !timetable.private,
                      isDraft: timetable.draft,
                    },
                  })
                }
              >
                Make {timetable.private ? "Public" : "Private"}
              </Button>
            )}

            {timetable.archived ? (
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
                          editTimetable({
                            id: timetable.id,
                            body: {
                              name: timetableName ?? timetable.name,
                              isPrivate:
                                timetableVisibility ?? timetable.private,
                              isDraft: false,
                            },
                          });
                        }}
                      >
                        Save changes
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                variant="ghost"
                className="rounded-full p-3"
                onClick={() => {
                  editTimetable(
                    {
                      id: timetable.id,
                      body: {
                        name: timetable.name,
                        isPrivate: true,
                        isDraft: true,
                      },
                    },
                    {
                      onSuccess: () => {
                        router.navigate({
                          to: "/edit/$timetableId",
                          params: { timetableId: timetable.id },
                        });
                      },
                    },
                  );
                }}
              >
                <Edit2 />
              </Button>
            )}

            <DeleteTimetableDialog timetableId={timetable.id}>
              <Trash />
            </DeleteTimetableDialog>
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  );
}

export default TimetableCard;
