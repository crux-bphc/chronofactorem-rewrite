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

function Announcements() {
  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await axios.get("api/user/announcements");
      return response.data;
    },
  });

  const [open, setOpen] = useState(true);

  return (
    <>
      {announcements?.length && (
        <Dialog open={open} onOpenChange={() => setOpen(!open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Announcements</DialogTitle>
              <DialogDescription>
                {
                  <div className="flex mx-3 mt-5 gap-3 flex-col-reverse divide-y divide-y-reverse">
                    {announcements.map(
                      (announcement: { title: string; message: string }) => (
                        <div className="flex gap-1 flex-col">
                          <h1 className="font-bold">{announcement.title}</h1>
                          <p className="opacity-90 mb-3">
                            {announcement.message}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                }
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default Announcements;
