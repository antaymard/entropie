"use client";

import * as React from "react";

import type { TComboboxInputElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import type { TFootnoteElement } from "@platejs/footnote";

import { PlateElement, useFocused, useSelected } from "platejs/react";

import { cn } from "@/lib/utils";

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from "./inline-combobox";

export function FootnoteReferenceElement(
  props: PlateElementProps<TFootnoteElement>
) {
  const { editor, element } = props;
  const { identifier } = element;
  const selected = useSelected();
  const focused = useFocused();

  return (
    <PlateElement
      {...props}
      as="sup"
      className={cn(
        "cursor-pointer rounded px-0.5 text-xs font-medium text-primary hover:underline",
        selected && focused && "ring-2 ring-ring"
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        onClick: () => {
          if (identifier) editor.tf.footnote.focusDefinition({ identifier });
        },
      }}
    >
      {props.children}[{identifier ?? "?"}]
    </PlateElement>
  );
}

export function FootnoteDefinitionElement(
  props: PlateElementProps<TFootnoteElement>
) {
  const { editor, element, children } = props;
  const { identifier } = element;

  return (
    <PlateElement
      {...props}
      className="relative my-0.5 flex items-start gap-2 border-t border-border pt-1.5 text-sm"
    >
      <span
        className="mt-0.5 shrink-0 cursor-pointer font-medium text-primary hover:underline"
        contentEditable={false}
        onClick={() => {
          if (identifier) editor.tf.footnote.focusReference({ identifier });
        }}
      >
        [{identifier ?? "?"}]
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </PlateElement>
  );
}

export function FootnoteInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState("");

  const identifiers = React.useMemo(
    () => editor.api.footnote.identifiers(),
    // Re-run when search changes so newly-created footnotes appear
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, search]
  );

  const filteredIds = React.useMemo(
    () =>
      identifiers.filter(
        (id) => !search || id.toLowerCase().includes(search.toLowerCase())
      ),
    [identifiers, search]
  );

  const nextId = editor.api.footnote.nextId();
  const newId = search.trim() || nextId;
  const showCreateItem = !identifiers.includes(newId);

  const handleSelect = React.useCallback(
    (identifier: string) => {
      // withTriggerCombobox removes the trigger char ('^') but keeps the
      // preceding '[' in the text — delete it before inserting the reference.
      editor.tf.delete({ reverse: true, unit: "character" });
      editor.tf.insert.footnote({ identifier, focusDefinition: true });
    },
    [editor]
  );

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        setValue={setSearch}
        showTrigger={false}
        trigger="^"
        filter={false}
      >
        <span className="inline-block rounded bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent>
          {showCreateItem && (
            <InlineComboboxGroup>
              <InlineComboboxItem
                value={newId}
                onClick={() => handleSelect(newId)}
              >
                New footnote [{newId}]
              </InlineComboboxItem>
            </InlineComboboxGroup>
          )}

          {filteredIds.length > 0 && (
            <InlineComboboxGroup>
              <InlineComboboxGroupLabel>Existing</InlineComboboxGroupLabel>
              {filteredIds.map((id) => (
                <InlineComboboxItem
                  key={id}
                  value={id}
                  onClick={() => handleSelect(id)}
                >
                  [{id}]{" "}
                  {editor.api.footnote.definitionText({ identifier: id }) ??
                    "…"}
                </InlineComboboxItem>
              ))}
            </InlineComboboxGroup>
          )}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
