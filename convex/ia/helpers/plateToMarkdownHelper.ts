export function plateJsonToMarkdown(nodes: any[]): string {
  return nodes.map((node) => serializeNode(node, 0, "ul")).join("");
}

function serializeNode(
  node: any,
  listDepth: number = 0,
  listType: "ul" | "ol" = "ul"
): string {
  // Text node
  if (node.text !== undefined) {
    let text = node.text;
    if (text === "") return text;

    // Gérer les styles imbriqués
    const hasBold = node.bold;
    const hasItalic = node.italic;
    const hasStrikethrough = node.strikethrough;
    const hasCode = node.code;

    if (hasCode) {
      text = `\`${text}\``;
    } else {
      if (hasStrikethrough) text = `~~${text}~~`;
      if (hasBold && hasItalic) {
        text = `***${text}***`;
      } else {
        if (hasBold) text = `**${text}**`;
        if (hasItalic) text = `*${text}*`;
      }
    }
    return text;
  }

  const type = node.type;

  // Pour les listes, on passe le type aux enfants
  if (type === "ul" || type === "ol") {
    const children = (node.children || [])
      .map((c: any) => serializeNode(c, listDepth, type))
      .join("");
    return children;
  }

  // Pour les items de liste
  if (type === "li") {
    const indent = "  ".repeat(listDepth);
    const marker = listType === "ol" ? "1. " : "- ";

    // Séparer le contenu (lic) des sous-listes
    const licContent = (node.children || [])
      .filter((c: any) => c.type === "lic")
      .map((c: any) => serializeNode(c, listDepth, listType))
      .join("");

    const subLists = (node.children || [])
      .filter((c: any) => c.type === "ul" || c.type === "ol")
      .map((c: any) => serializeNode(c, listDepth + 1, c.type))
      .join("");

    return `${indent}${marker}${licContent}\n${subLists}`;
  }

  // Pour le contenu de liste
  if (type === "lic") {
    return (node.children || [])
      .map((c: any) => serializeNode(c, listDepth, listType))
      .join("");
  }

  // Autres types de noeuds
  const children = (node.children || [])
    .map((c: any) => serializeNode(c, listDepth, listType))
    .join("");

  switch (type) {
    case "p":
      return children + "\n\n";
    case "h1":
      return `# ${children}\n\n`;
    case "h2":
      return `## ${children}\n\n`;
    case "h3":
      return `### ${children}\n\n`;
    case "h4":
      return `#### ${children}\n\n`;
    case "h5":
      return `##### ${children}\n\n`;
    case "h6":
      return `###### ${children}\n\n`;

    case "blockquote":
      return (
        children
          .trim()
          .split("\n")
          .map((line: string) => `> ${line}`)
          .join("\n") + "\n\n"
      );

    case "code_block": {
      const lang = node.lang || "";
      const code = (node.children || [])
        .map((line: any) =>
          (line.children || []).map((c: any) => c.text || "").join("")
        )
        .join("\n");
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }

    case "a":
      return `[${children}](${node.url})`;

    case "img": {
      const alt = node.caption?.[0]?.text || "";
      return `![${alt}](${node.url})`;
    }

    case "hr":
      return "---\n\n";

    case "date": {
      if (!node.date) return "[Date non définie]";
      const date = new Date(node.date);
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();

      if (isToday) return "Aujourd'hui";
      if (isYesterday) return "Hier";
      if (isTomorrow) return "Demain";

      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    case "table":
      return serializeTable(node);

    default:
      return children;
  }
}

function serializeTable(tableNode: any): string {
  const rows = tableNode.children || [];
  if (rows.length === 0) return "";

  let md = "";

  rows.forEach((row: any, idx: number) => {
    const cells = row.children || [];
    md +=
      "| " +
      cells
        .map((cell: any) => {
          return cell.children
            .map((c: any) => serializeNode(c))
            .join("")
            .trim();
        })
        .join(" | ") +
      " |\n";

    // Separator après la première ligne (header)
    if (idx === 0) {
      md += "| " + cells.map(() => "---").join(" | ") + " |\n";
    }
  });

  return md + "\n";
}
