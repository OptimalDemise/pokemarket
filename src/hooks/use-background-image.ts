import { useState, useEffect } from "react";

const STORAGE_KEY = "pokemarket-background-image";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function useBackgroundImage() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load background from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setBackgroundImage(saved);
    }
    setIsLoading(false);
  }, []);

  const saveBackground = (imageData: string) => {
    setBackgroundImage(imageData);
    localStorage.setItem(STORAGE_KEY, imageData);
  };

  const removeBackground = () => {
    setBackgroundImage(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const validateAndConvertFile = async (file: File): Promise<{ success: boolean; data?: string; error?: string }> => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Please select a valid image file" };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "Image size must be less than 2MB" };
    }

    // Convert to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve({ success: true, data: result });
      };
      reader.onerror = () => {
        resolve({ success: false, error: "Failed to read image file" });
      };
      reader.readAsDataURL(file);
    });
  };

  return {
    backgroundImage,
    isLoading,
    saveBackground,
    removeBackground,
    validateAndConvertFile,
  };
}
