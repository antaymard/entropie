import { Button } from "@/components/shadcn/button";
import { useSlideshowPlayback } from "@/hooks/useSlideshowPlayback";
import { TbPlayerPlay } from "react-icons/tb";

export default function LaunchSlideshowButton({
  slideshowId,
}: {
  slideshowId: string;
}) {
  const { start } = useSlideshowPlayback();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={(e) => {
        e.stopPropagation();
        start(slideshowId);
      }}
    >
      <TbPlayerPlay />
    </Button>
  );
}
