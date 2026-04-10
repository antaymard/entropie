import ToolCardFrame from "./ToolCardFrame";
import { TbClipboardSearch } from "react-icons/tb";
import { useTranslation } from "react-i18next";

export default function ReadNodeConfigsToolCard({ state, input, output }: any) {
  const { t } = useTranslation();
  function renderTooName() {
    switch (input?.operation) {
      case "listAllNodeTypes":
        return t("toolCards.readingAllNodeTypes");
      case "readOneNodeType":
        return `Reading a node type (${input.itemType})`;
      case "listAllNodeFields":
        return t("toolCards.readingAllNodeFields");
      case "readOneNodeField":
        return `Reading a node field (${input.itemType})`;
      default:
        return t("toolCards.readingNodeConfigs");
    }
  }

  return (
    <ToolCardFrame
      name={renderTooName()}
      state={state}
      icon={TbClipboardSearch}
    >
      <div className="flex flex-col divide-y divide-white/20 -mx-2 text-white">
        <p>Input</p>
        <pre className="bg-white/5 rounded p-2 my-2 overflow-x-auto text-sm">
          {JSON.stringify(input, null, 2)}
        </pre>
        <p>Output</p>
        <pre className="bg-white/5 rounded p-2 my-2 overflow-x-auto text-sm">
          {JSON.stringify(output, null, 2)}
        </pre>
      </div>{" "}
    </ToolCardFrame>
  );
}
