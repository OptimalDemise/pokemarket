import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";

export function UpdateLogsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const updateLogs = useQuery(api.updateLogs.getAllUpdateLogs);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "feature":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "bug fix":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "improvement":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
            aria-label="View update logs"
          >
            <Megaphone className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </motion.button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Megaphone className="h-6 w-6 text-primary" />
              Update Logs
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {!updateLogs || updateLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No updates yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {updateLogs.map((log, index) => (
                    <motion.div
                      key={log._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{log.title}</h3>
                            <Badge className={getCategoryColor(log.category || "Update")}>
                              {log.category || "Update"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {log.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
