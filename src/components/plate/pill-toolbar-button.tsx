"use client";

import * as React from "react";

import { useEditorRef, useEditorSelector } from "platejs/react";

import { cn } from "@/lib/utils";
import { colors } from "@/components/ui/styles";
import type { colorsEnum } from "@/types/domain/style.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ToolbarButton } from "../shadcn/toolbar";

export function PillToolbarButton({
  children,
  tooltip,
}: {
  tooltip?: string;
  children?: React.ReactNode;
}) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  // Vérifier si le mark pill est actif
  const pillColor = useEditorSelector(
    (editor) => editor.api.mark("pill") as colorsEnum | undefined,
    []
  );

  const updateColor = React.useCallback(
    (colorKey: colorsEnum) => {
      if (editor.selection) {
        editor.tf.select(editor.selection);
        editor.tf.focus();
        editor.tf.addMarks({ pill: colorKey });
      }
      setOpen(false);
    },
    [editor]
  );

  const clearPill = React.useCallback(() => {
    if (editor.selection) {
      editor.tf.select(editor.selection);
      editor.tf.focus();
      editor.tf.removeMarks("pill");
    }
    setOpen(false);
  }, [editor]);

  // Générer dynamiquement les options depuis colors
  const colorOptions = React.useMemo(
    () =>
      Object.entries(colors).map(([key, value]) => ({
        key: key as colorsEnum,
        label: value.label,
        classes: value,
      })),
    []
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={!!pillColor} tooltip={tooltip}>
          {children}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <div className="flex flex-col gap-1 p-2">
          {colorOptions.map(({ key, label, classes }) => (
            <DropdownMenuItem
              key={key}
              onClick={() => updateColor(key)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                pillColor === key && "bg-accent"
              )}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded border",
                  classes.nodeBg,
                  classes.nodeBorder
                )}
              />
              <span>{label}</span>
            </DropdownMenuItem>
          ))}
          {pillColor && (
            <DropdownMenuItem onClick={clearPill} className="text-destructive">
              Supprimer le pill
            </DropdownMenuItem>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
