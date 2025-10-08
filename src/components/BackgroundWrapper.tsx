import { useBackgroundImage } from "@/hooks/use-background-image";

export function BackgroundWrapper({ children }: { children: React.ReactNode }) {
  const { backgroundImage, isLoading } = useBackgroundImage();

  return (
    <div className="relative min-h-screen">
      {!isLoading && backgroundImage && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.12,
            zIndex: -1,
          }}
        />
      )}
      {children}
    </div>
  );
}
