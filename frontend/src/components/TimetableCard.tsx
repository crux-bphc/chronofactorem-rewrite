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

type Props = {
  timetable: z.infer<typeof timetableType>;
  isPrivate: boolean;
  isDraft: boolean;
};

function TimetableCard({ timetable, isPrivate, isDraft }: Props) {
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
          <Button variant="outline">
            Make {isPrivate ? "Public" : "Private"}
          </Button>
        )}
        <Button variant="ghost" className="rounded-full p-3">
          <Edit2 />
        </Button>
        <Button variant="ghost" className="rounded-full p-3">
          <Trash />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default TimetableCard;
