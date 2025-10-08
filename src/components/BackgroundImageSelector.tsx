import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Image, Upload, X } from "lucide-react";
import { useBackgroundImage } from "@/hooks/use-background-image";
import { toast } from "sonner";

export function BackgroundImageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { backgroundImage, saveBackground, removeBackground, validateAndConvertFile } = useBackgroundImage();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await validateAndConvertFile(file);
    if (result.success && result.data) {
      setPreviewImage(result.data);
    } else {
      toast.error(result.error || "Failed to load image");
    }
  };

  const handleSave = () => {
    if (previewImage) {
      saveBackground(previewImage);
      toast.success("Background image saved!");
      setIsOpen(false);
      setPreviewImage(null);
    }
  };

  const handleRemove = () => {
    removeBackground();
    setPreviewImage(null);
    toast.success("Background image removed");
  };

  const handleCancel = () => {
    setPreviewImage(null);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={backgroundImage ? "default" : "ghost"}
        size="icon"
        onClick={() => setIsOpen(true)}
        className="cursor-pointer h-6 w-6 sm:h-8 sm:w-8"
      >
        <Image className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom Background Image</DialogTitle>
            <DialogDescription>
              Upload an image to use as your page background. Max size: 2MB
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Input */}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>

            {/* Preview */}
            {(previewImage || backgroundImage) && (
              <div className="relative border rounded-lg overflow-hidden bg-muted">
                <img
                  src={previewImage || backgroundImage || ""}
                  alt="Background preview"
                  className="w-full h-48 object-cover opacity-30"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded">
                    Preview (actual opacity will be lower)
                  </p>
                </div>
              </div>
            )}

            {/* Current Status */}
            {backgroundImage && !previewImage && (
              <p className="text-sm text-muted-foreground">
                You currently have a background image set
              </p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {backgroundImage && (
              <Button
                variant="destructive"
                onClick={handleRemove}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Remove Background
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!previewImage}
                className="flex-1 sm:flex-none"
              >
                <Upload className="mr-2 h-4 w-4" />
                Use as Background
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
