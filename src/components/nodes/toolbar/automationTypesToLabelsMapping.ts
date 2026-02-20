import type { AutomationStepType } from "@/types";

export const automationMapping: Record<AutomationStepType, string> = {
  "tool_launched=web_search": "Web search...",
  "tool_completed=web_search": "Analyzing web search results...",
  "tool_launched=web_extract": "Extracting web content...",
  "tool_completed=web_extract": "Analyzing web extraction results...",
  "tool_completed=update_node_data_values":
    "Updating node data...",
  automation_launched: "Automation launched...",
  automation_completed: "Automation completed",
  automation_error: "Automation error",
  "tool_launched=view_image": "Reading image...",
  "tool_completed=view_image": "Image read",
  "tool_launched=read_pdf": "Reading PDF...",
  "tool_completed=read_pdf": "PDF read",
  "tool_error=read_pdf": "Error reading PDF",
  "tool_launched=update_node_data_values":
    "Updating node data...",
};
