"use client";

import * as React from "react";

import type { TComboboxInputElement, TMentionElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { useStore } from "@xyflow/react";
import toast from "react-hot-toast";

import { getMentionOnSelectItem } from "@platejs/mention";
import { IS_APPLE, KEYS } from "platejs";
import {
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from "platejs/react";

import type { Id } from "@/../convex/_generated/dataModel";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { useWindowsStore } from "@/stores/windowsStore";
import type { nodeTypes } from "@/types/domain/nodeTypes";
import {
  getNodeDataTitle,
  getNodeIcon,
} from "@/components/utils/nodeDataDisplayUtils";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from "./inline-combobox";

type MentionWithNodeDataKey = TMentionElement & {
  key?: Id<"nodeDatas">;
};

type MentionItem = {
  key: Id<"nodeDatas">;
  text: string;
};

const OPENABLE_WINDOW_TYPES: Set<nodeTypes> = new Set([
  "document",
  "embed",
  "file",
  "image",
]);

function isOpenableNodeType(type: string): type is nodeTypes {
  return OPENABLE_WINDOW_TYPES.has(type as nodeTypes);
}

const onSelectItem = getMentionOnSelectItem();

export function MentionElement(
  props: PlateElementProps<TMentionElement> & {
    prefix?: string;
  },
) {
  const element = props.element;
  const mentionElement = element as MentionWithNodeDataKey;
  const nodeDataId = mentionElement.key;

  const selected = useSelected();
  const focused = useFocused();
  const mounted = useMounted();
  const readOnly = useReadOnly();

  const nodes = useStore((state) => state.nodes);
  const openWindow = useWindowsStore((state) => state.openWindow);
  const nodeDatas = useNodeDataStore((state) => state.nodeDatas);
  const nodeType = nodeDataId ? nodeDatas.get(nodeDataId)?.type : undefined;
  const MentionIcon = getNodeIcon(nodeType);

  const handleClick = React.useCallback(() => {
    if (readOnly || !nodeDataId) return;

    const nodeData = nodeDatas.get(nodeDataId);

    if (!nodeData) {
      toast("Node introuvable dans ce canvas.");
      return;
    }

    if (!isOpenableNodeType(nodeData.type)) {
      toast("Ce type de node ne peut pas etre ouvert en fenetre.");
      return;
    }

    const xyNode = nodes.find((node) => node.data?.nodeDataId === nodeDataId);

    if (!xyNode) {
      toast("Ce node n'est pas visible sur ce canvas.");
      return;
    }

    openWindow({
      xyNodeId: xyNode.id,
      nodeDataId,
      nodeType: nodeData.type,
    });
  }, [nodeDataId, nodeDatas, nodes, openWindow, readOnly]);

  return (
    <PlateElement
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 align-baseline font-medium text-sm",
        !readOnly && "cursor-pointer",
        selected && focused && "ring-2 ring-ring",
        element.children[0][KEYS.bold] === true && "font-bold",
        element.children[0][KEYS.italic] === true && "italic",
        element.children[0][KEYS.underline] === true && "underline",
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        "data-slate-value": element.value,
        "data-node-data-id": nodeDataId,
        onClick: handleClick,
        draggable: true,
      }}
    >
      {mounted && IS_APPLE ? (
        // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
        <>
          {props.children}
          {MentionIcon ? <MentionIcon className="size-3.5 shrink-0" /> : null}
          {props.prefix}
          {element.value}
        </>
      ) : (
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        <>
          {MentionIcon ? <MentionIcon className="size-3.5 shrink-0" /> : null}
          {props.prefix}
          {element.value}
          {props.children}
        </>
      )}
    </PlateElement>
  );
}

export function MentionInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState("");
  const nodeDatas = useNodeDataStore((state) => state.nodeDatas);

  const mentionItems = React.useMemo((): MentionItem[] => {
    const normalizedSearch = search.trim().toLowerCase();

    return Array.from(nodeDatas.entries())
      .map(([id, nodeData]) => ({
        key: id,
        text: getNodeDataTitle(nodeData),
      }))
      .filter((item) => {
        if (!normalizedSearch) return true;
        return item.text.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => a.text.localeCompare(b.text))
      .slice(0, 20);
  }, [nodeDatas, search]);

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        setValue={setSearch}
        showTrigger={false}
        trigger="@"
      >
        <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5">
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          <InlineComboboxGroup>
            {mentionItems.map((item) => (
              <InlineComboboxItem
                key={item.key}
                value={item.text}
                onClick={() => onSelectItem(editor, item, search)}
              >
                {item.text}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
