"use client";

import * as React from "react";

import type { PlateEditor, PlateElementProps } from "platejs/react";
import { useTranslation } from "react-i18next";

import {
  CalendarIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  LightbulbIcon,
  ListIcon,
  ListOrdered,
  PenToolIcon,
  PilcrowIcon,
  Quote,
  RadicalIcon,
  Square,
  Table,
  TableOfContentsIcon,
} from "lucide-react";
import { type TComboboxInputElement, KEYS } from "platejs";
import { PlateElement } from "platejs/react";

import {
  insertBlock,
  insertInlineElement,
} from "@/components/plate/transforms";

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from "./inline-combobox";

type Group = {
  group: string;
  items: {
    icon: React.ReactNode;
    value: string;
    onSelect: (editor: PlateEditor, value: string) => void;
    className?: string;
    focusEditor?: boolean;
    keywords?: string[];
    label?: string;
  }[];
};

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;
  const { t } = useTranslation();

  const groups: Group[] = React.useMemo(() => [
    {
      group: t("editor.basicBlocks"),
      items: [
        {
          icon: <PilcrowIcon />,
          keywords: ["paragraph"],
          label: t("editor.text"),
          value: KEYS.p,
        },
        {
          icon: <Heading1Icon />,
          keywords: ["title", "h1"],
          label: "Heading 1",
          value: KEYS.h1,
        },
        {
          icon: <Heading2Icon />,
          keywords: ["subtitle", "h2"],
          label: "Heading 2",
          value: KEYS.h2,
        },
        {
          icon: <Heading3Icon />,
          keywords: ["subtitle", "h3"],
          label: "Heading 3",
          value: KEYS.h3,
        },
        {
          icon: <ListIcon />,
          keywords: ["unordered", "ul", "-"],
          label: t("editor.bulletedList"),
          value: KEYS.ul,
        },
        {
          icon: <ListOrdered />,
          keywords: ["ordered", "ol", "1"],
          label: t("editor.numberedList"),
          value: KEYS.ol,
        },
        {
          icon: <Square />,
          keywords: ["checklist", "task", "checkbox", "[]"],
          label: "To-do list",
          value: KEYS.listTodo,
        },
        {
          icon: <ChevronRightIcon />,
          keywords: ["collapsible", "expandable"],
          label: t("editor.toggle"),
          value: KEYS.toggle,
        },
        {
          icon: <Code2 />,
          keywords: ["```"],
          label: t("editor.codeBlock"),
          value: KEYS.codeBlock,
        },
        {
          icon: <Table />,
          label: t("editor.table"),
          value: KEYS.table,
        },
        {
          icon: <Quote />,
          keywords: ["citation", "blockquote", "quote", ">"],
          label: "Blockquote",
          value: KEYS.blockquote,
        },
        {
          description: "Insert a highlighted block.",
          icon: <LightbulbIcon />,
          keywords: ["note"],
          label: "Callout",
          value: KEYS.callout,
        },
      ].map((item) => ({
        ...item,
        onSelect: (editor, value) => {
          insertBlock(editor, value, { upsert: true });
        },
      })),
    },
    {
      group: t("editor.advancedBlocks"),
      items: [
        {
          icon: <TableOfContentsIcon />,
          keywords: ["toc"],
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
        // {
        //   icon: <PenToolIcon />,
        //   keywords: ['excalidraw'],
        //   label: 'Excalidraw',
        //   value: KEYS.excalidraw,
        // },
      ].map((item) => ({
        ...item,
        onSelect: (editor, value) => {
          insertBlock(editor, value, { upsert: true });
        },
      })),
    },
    {
      group: t("editor.inline"),
      items: [
        {
          focusEditor: true,
          icon: <CalendarIcon />,
          keywords: ["time"],
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
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                )
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
