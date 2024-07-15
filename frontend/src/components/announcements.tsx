import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { useState } from "react";

const fetchAnnouncements = async () => {
  const response = await axios.get("api/user/announcements");
  console.log(response.data);
  return response.data;
}

function Announcements() {
  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={() => setOpen(!open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Announcements</DialogTitle>
          <DialogDescription>
            <div className="flex mx-3 mt-5 gap-3 flex-col-reverse divide-y divide-y-reverse">
              {
                announcements?.length ?
                  announcements.
                    sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                    .map(
                      (announcement) => (
                        <div className="flex gap-1 flex-col">
                          <h1 className="font-bold text-base">
                            {announcement.title}
                          </h1>
                          <p className="opacity-70 text-xs">
                            {new Date(announcement.createdAt).toLocaleString().slice(0, -3)}
                          </p>
                          <p className="opacity-90 mb-3">
                            {announcement.message}
                          </p>
                        </div>
                      ),
                    )
                  : <p>No announcements</p>
              }
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default Announcements;
