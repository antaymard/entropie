"use client";

import * as React from "react";

import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "react-i18next";

import {
  CalendarIcon,
  ChevronRightIcon,
  Columns3Icon,
  FileCodeIcon,
  FilmIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PenToolIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  RadicalIcon,
  SquareIcon,
  TableIcon,
  TableOfContentsIcon,
} from "lucide-react";
import { KEYS } from "platejs";
import { type PlateEditor, useEditorRef } from "platejs/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  insertBlock,
  insertInlineElement,
} from "@/components/plate/transforms";

import { ToolbarButton, ToolbarMenuGroup } from "../shadcn/toolbar";

type Group = {
  group: string;
  items: Item[];
};

type Item = {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  focusEditor?: boolean;
  label?: string;
};

export function InsertToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  const groups: Group[] = React.useMemo(() => [
    {
      group: t("editor.basicBlocks"),
      items: [
        {
          icon: <PilcrowIcon />,
          label: t("editor.paragraph"),
          value: KEYS.p,
        },
        {
          icon: <Heading1Icon />,
          label: "Heading 1",
          value: "h1",
        },
        {
          icon: <Heading2Icon />,
          label: "Heading 2",
          value: "h2",
        },
        {
          icon: <Heading3Icon />,
          label: "Heading 3",
          value: "h3",
        },
        {
          icon: <TableIcon />,
          label: t("editor.table"),
          value: KEYS.table,
        },
        {
          icon: <FileCodeIcon />,
          label: t("editor.code"),
          value: KEYS.codeBlock,
        },
        {
          icon: <QuoteIcon />,
          label: t("editor.quote"),
          value: KEYS.blockquote,
        },
        {
          icon: <MinusIcon />,
          label: t("editor.divider"),
          value: KEYS.hr,
        },
      ].map((item) => ({
        ...item,
        onSelect: (editor, value) => {
          insertBlock(editor, value);
        },
      })),
    },
    {
      group: t("editor.lists"),
      items: [
        {
          icon: <ListIcon />,
          label: t("editor.bulletedList"),
          value: KEYS.ul,
        },
        {
          icon: <ListOrderedIcon />,
          label: t("editor.numberedList"),
          value: KEYS.ol,
        },
        {
          icon: <SquareIcon />,
          label: "To-do list",
          value: KEYS.listTodo,
        },
        {
          icon: <ChevronRightIcon />,
          label: t("editor.toggleList"),
          value: KEYS.toggle,
        },
      ].map((item) => ({
        ...item,
        onSelect: (editor, value) => {
          insertBlock(editor, value);
        },
      })),
    },
    {
      group: t("editor.media"),
      items: [
        {
          icon: <ImageIcon />,
          label: t("editor.image"),
          value: KEYS.img,
        },
        {
          icon: <FilmIcon />,
          label: t("editor.embedLabel"),
          value: KEYS.mediaEmbed,
        },
      ].map((item) => ({
        ...item,
        onSelect: (editor, value) => {
          insertBlock(editor, value);
        },
      })),
    },
    {
      group: t("editor.advancedBlocks"),
      items: [
        {
          icon: <TableOfContentsIcon />,
          label: t("editor.tableOfContents"),
          value: KEYS.toc,
        },
        {
          icon: <Columns3Icon />,
          label: "3 columns",
          value: "action_three_columns",
        },
        {
          focusEditor: false,
          icon: <RadicalIcon />,
          label: t("editor.equation"),
          value: KEYS.equation,
        },
        {
          icon: <PenToolIcon />,
          label: t("editor.excalidraw"),
          value: KEYS.excalidraw,
        },
      ].map((item) => ({
        ...item,
        onSelect: (editor, value) => {
          insertBlock(editor, value);
        },
      })),
    },
    {
      group: t("editor.inline"),
      items: [
        {
          icon: <Link2Icon />,
          label: t("editor.link"),
          value: KEYS.link,
        },
        {
          focusEditor: true,
          icon: <CalendarIcon />,
          label: t("editor.date"),
          value: KEYS.date,
        },
        {
          focusEditor: false,
          icon: <RadicalIcon />,
          label: t("editor.inlineEquation"),
          value: KEYS.inlineEquation,
        },
      ].map((item) => ({
        ...item,
        onSelect: (editor, value) => {
          insertInlineElement(editor, value);
        },
      })),
    },
  ], [t]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={t("editor.insert")} isDropdown>
          <PlusIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex max-h-[500px] min-w-0 flex-col overflow-y-auto"
        align="start"
      >
        {groups.map(({ group, items: nestedItems }) => (
          <ToolbarMenuGroup key={group} label={group}>
            {nestedItems.map(({ icon, label, value, onSelect }) => (
              <DropdownMenuItem
                key={value}
                className="min-w-[180px]"
                onSelect={() => {
                  onSelect(editor, value);
                  editor.tf.focus();
                }}
              >
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </ToolbarMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
