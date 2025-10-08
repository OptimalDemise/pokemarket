import { useBackgroundImage } from "@/hooks/use-background-image";

export function BackgroundWrapper({ children }: { children: React.ReactNode }) {
  const { backgroundImage } = useBackgroundImage();

  return (
    <>
      {backgroundImage && (
        <div
          className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            opacity: 0.12,
          }}
        />
      )}
      {children}
    </>
  );
}
