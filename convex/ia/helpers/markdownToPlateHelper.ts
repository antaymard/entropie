/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Convertit du markdown en format Plate.js JSON (Slate nodes).
 * Cette fonction est conçue pour fonctionner côté serveur (Convex) sans dépendances
 * qui nécessitent le DOM.
 *
 * Supporte: paragraphes, titres (h1-h6), listes, gras, italique, code inline,
 * liens, images, code blocks, blockquotes, horizontal rules, tables.
 */
export function markdownToPlateJson(markdown: string): any[] {
  const lines = markdown.split("\n");
  const result: any[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Ligne vide - on skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Code block (```)
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      result.push({
        type: "code_block",
        lang,
        children: codeLines.map((codeLine) => ({
          type: "code_line",
          children: [{ text: codeLine }],
        })),
      });
      continue;
    }

    // Heading (# ## ### etc.)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      result.push({
        type: `h${level}`,
        children: parseInlineContent(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Horizontal rule (---, ***, ___)
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      result.push({
        type: "hr",
        children: [{ text: "" }],
      });
      i++;
      continue;
    }

    // Blockquote (>)
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      result.push({
        type: "blockquote",
        children: parseInlineContent(quoteLines.join(" ")),
      });
      continue;
    }

    // Unordered list (- ou *)
    if (/^[\s]*[-*+]\s+/.test(line)) {
      const listItems = parseListItems(lines, i, "unordered");
      result.push(...listItems.items);
      i = listItems.nextIndex;
      continue;
    }

    // Ordered list (1. 2. etc.)
    if (/^[\s]*\d+\.\s+/.test(line)) {
      const listItems = parseListItems(lines, i, "ordered");
      result.push(...listItems.items);
      i = listItems.nextIndex;
      continue;
    }

    // Table (|...|)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableResult = parseTable(lines, i);
      if (tableResult.table) {
        result.push(tableResult.table);
      }
      i = tableResult.nextIndex;
      continue;
    }

    // Paragraph (default)
    result.push({
      type: "p",
      children: parseInlineContent(line),
    });
    i++;
  }

  // S'assurer qu'on retourne au moins un paragraphe vide
  if (result.length === 0) {
    result.push({
      type: "p",
      children: [{ text: "" }],
    });
  }

  return result;
}

/**
 * Parse le contenu inline (gras, italique, code, liens, images)
 * Supporte les styles imbriqués (***bold+italic***)
 */
function parseInlineContent(text: string): any[] {
  const result: any[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Image ![alt](url)
    const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      result.push({
        type: "img",
        url: imageMatch[2],
        caption: imageMatch[1] ? [{ text: imageMatch[1] }] : [{ text: "" }],
        children: [{ text: "" }],
      });
      remaining = remaining.slice(imageMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      result.push({
        type: "a",
        url: linkMatch[2],
        children: [{ text: linkMatch[1] }],
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Bold + Italic ***text*** ou ___text___
    const boldItalicMatch = remaining.match(/^(\*\*\*|___)(.+?)\1/);
    if (boldItalicMatch) {
      result.push({ text: boldItalicMatch[2], bold: true, italic: true });
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Bold + Strikethrough **~~text~~**
    const boldStrikeMatch = remaining.match(/^\*\*~~(.+?)~~\*\*/);
    if (boldStrikeMatch) {
      result.push({
        text: boldStrikeMatch[1],
        bold: true,
        strikethrough: true,
      });
      remaining = remaining.slice(boldStrikeMatch[0].length);
      continue;
    }

    // Italic + Strikethrough *~~text~~*
    const italicStrikeMatch = remaining.match(/^\*~~(.+?)~~\*/);
    if (italicStrikeMatch) {
      result.push({
        text: italicStrikeMatch[1],
        italic: true,
        strikethrough: true,
      });
      remaining = remaining.slice(italicStrikeMatch[0].length);
      continue;
    }

    // Bold **text** ou __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      result.push({ text: boldMatch[2], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic *text* ou _text_
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch) {
      result.push({ text: italicMatch[2], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      result.push({ text: strikeMatch[1], strikethrough: true });
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Inline code `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      result.push({ text: codeMatch[1], code: true });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Texte normal jusqu'au prochain caractère spécial
    const nextSpecial = remaining.search(/[*_`\[!~]/);
    if (nextSpecial === -1) {
      result.push({ text: remaining });
      break;
    } else if (nextSpecial === 0) {
      // Caractère spécial isolé, on le traite comme du texte
      result.push({ text: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      result.push({ text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  // S'assurer qu'il y a au moins un noeud texte
  if (result.length === 0) {
    result.push({ text: "" });
  }

  return result;
}

/**
 * Parse les éléments d'une liste (ordonnée ou non) avec structure imbriquée
 * Génère une structure ul/ol > li > lic compatible Plate.js
 */
function parseListItems(
  lines: string[],
  startIndex: number,
  type: "ordered" | "unordered"
): { items: any[]; nextIndex: number } {
  const items: any[] = [];
  let i = startIndex;

  const listType = type === "ordered" ? "ol" : "ul";

  // Collecter les items avec leur indentation
  const rawItems: { indent: number; content: string }[] = [];

  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);

    if (!match) {
      if (line.trim() === "") {
        i++;
        continue;
      }
      break;
    }

    rawItems.push({
      indent: match[1].length,
      content: match[3],
    });
    i++;
  }

  // Construire la structure imbriquée
  const buildNestedList = (
    listItems: typeof rawItems,
    baseIndent: number = 0
  ): any[] => {
    const result: any[] = [];
    let j = 0;

    while (j < listItems.length) {
      const item = listItems[j];

      if (item.indent === baseIndent) {
        // Item au niveau actuel
        const liChildren: any[] = [
          {
            type: "lic",
            children: parseInlineContent(item.content),
          },
        ];

        // Chercher les sous-items
        let k = j + 1;
        const subItems: typeof rawItems = [];
        while (k < listItems.length && listItems[k].indent > baseIndent) {
          subItems.push(listItems[k]);
          k++;
        }

        if (subItems.length > 0) {
          // Ajouter la sous-liste
          liChildren.push({
            type: listType,
            children: buildNestedList(subItems, subItems[0].indent),
          });
          j = k;
        } else {
          j++;
        }

        result.push({
          type: "li",
          children: liChildren,
        });
      } else {
        break;
      }
    }

    return result;
  };

  const nestedItems = buildNestedList(rawItems);

  items.push({
    type: listType,
    children: nestedItems,
  });

  return { items, nextIndex: i };
}

/**
 * Parse une table markdown
 */
function parseTable(
  lines: string[],
  startIndex: number
): { table: any | null; nextIndex: number } {
  const tableLines: string[] = [];
  let i = startIndex;

  // Collecter toutes les lignes de la table
  while (
    i < lines.length &&
    lines[i].trim().startsWith("|") &&
    lines[i].trim().endsWith("|")
  ) {
    tableLines.push(lines[i]);
    i++;
  }

  if (tableLines.length < 2) {
    return { table: null, nextIndex: i };
  }

  // Parser la table
  const rows: any[] = [];
  let headerParsed = false;

  for (const tableLine of tableLines) {
    // Skip separator line (|---|---|)
    if (/^\|[\s\-:|]+\|$/.test(tableLine.trim())) {
      headerParsed = true;
      continue;
    }

    const cells = tableLine
      .trim()
      .slice(1, -1) // Remove leading and trailing |
      .split("|")
      .map((cell) => cell.trim());

    const isHeader = !headerParsed;

    rows.push({
      type: "tr",
      children: cells.map((cellContent) => ({
        type: isHeader ? "th" : "td",
        children: [
          {
            type: "p",
            children: parseInlineContent(cellContent),
          },
        ],
      })),
    });

    if (isHeader) {
      headerParsed = true;
    }
  }

  if (rows.length === 0) {
    return { table: null, nextIndex: i };
  }

  return {
    table: {
      type: "table",
      children: rows,
    },
    nextIndex: i,
  };
}
