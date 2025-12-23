import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { useCanvasStore } from "@/stores/canvasStore";
import { useWindowsStore } from "@/stores/windowsStore";
import { LuMousePointer, LuGitBranchPlus } from "react-icons/lu";
import { TbFrame } from "react-icons/tb";
import { RiRobot2Fill } from "react-icons/ri";
import MinimizedWindow from "@/components/canvas/on-canvas-ui/MinimizedWindow";
import { memo } from "react";
import { useShallow } from "zustand/shallow";

function CanvasToolbar() {
  const { currentTool, setCurrentTool, isAiPanelOpen, setIsAiPanelOpen } =
    useCanvasStore(
      useShallow((state) => ({
        currentTool: state.currentCanvasTool,
        setCurrentTool: state.setCurrentCanvasTool,
        isAiPanelOpen: state.isAiPanelOpen,
        setIsAiPanelOpen: state.setIsAiPanelOpen,
      }))
    );

  const openWindows = useWindowsStore(useShallow((state) => state.openWindows));

  const tools = [
    {
      value: "default",
      label: "Sélectionner",
      icon: LuMousePointer,
    },
    {
      value: "edge",
      label: "Ajouter une connexion",
      icon: LuGitBranchPlus,
    },
    {
      value: "frame",
      label: "Ajouter une frame",
      icon: TbFrame,
    },
  ] as const;

  return (
    <div className="bg-white p-2 rounded h-full border border-gray-300 flex flex-col gap-1 items-center">
      {/* <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            variant={isAiPanelOpen ? "default" : "ghost"}
            // className={`p-2 rounded hover:bg-slate-100 ${isActive ? "bg-slate-200 border-slate-300" : "border-transparent text-slate-300"}`}
          >
            <RiRobot2Fill size={20} />
          </Button>
        </TooltipTrigger>
        <TooltipContent align="start">Assistant Nolë</TooltipContent>
      </Tooltip>
      <Separator /> */}
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentTool === tool.value;
        return (
          <Tooltip key={tool.value} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={() => setCurrentTool(tool.value)}
                variant={isActive ? "default" : "ghost"}
                // className={`p-2 rounded hover:bg-slate-100 ${isActive ? "bg-slate-200 border-slate-300" : "border-transparent text-slate-500"}`}
              >
                <Icon size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent align="start">{tool.label}</TooltipContent>
          </Tooltip>
        );
      })}
      {openWindows.length > 0 && <Separator />}
      {openWindows.map((window) => (
        <MinimizedWindow key={window.id} window={window} />
      ))}
    </div>
  );
}

export default memo(CanvasToolbar, () => true);
