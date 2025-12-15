import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

export const readNodeTemplatesTool = createTool({
  description:
    "Some nodes are of type 'custom'. These nodes are based on templates that define their layout and properties. This tool allows you to list and retrieve information about these node templates, including their structure and attributes.",
  args: z.object({
    templateIds: z
      .array(z.string())
      .optional()
      .describe(
        "An array of template IDs to filter the results. If not provided, all templates for the user will be returned."
      ),
    includeTemplateLayout: z
      .boolean()
      .optional()
      .describe(
        "If true, includes the visual layout of each template in the response. Default to false. This is token heavy, so use only if necessary."
      ),
  }),
  handler: async (ctx, { includeTemplateLayout }): Promise<string> => {
    console.log(
      `🔍 List node templates | Include layout: ${includeTemplateLayout}`
    );

    try {
      // Get the canvas from the db
      const result = await ctx.runQuery(api.templates.getUserTemplates, {});

      if (!result || !result.success || !result.templates) {
        return `Templates not found or access denied.`;
      }

      const templates = result.templates;

      if (templates.length === 0) {
        return `No node templates found for the user.`;
      }

      // Format response for better LLM understanding
      let response = `📋 NODE TEMPLATES SUMMARY\n`;
      response += `Total templates found: ${templates.length}\n\n`;

      templates.forEach((template, index) => {
        response += `━━━ TEMPLATE ${index + 1}/${templates.length} ━━━\n`;
        response += `ID: ${template._id}\n`;
        response += `Name: ${template.name}\n`;
        response += `Description: ${template.description}\n`;
        response += `Icon: ${template.icon}\n`;
        response += `Is System Template: ${template.isSystem}\n`;
        response += `Created: ${new Date(template._creationTime).toISOString()}\n`;
        response += `Updated: ${new Date(template.updatedAt).toISOString()}\n`;
        
        if (template.fields && template.fields.length > 0) {
          response += `\nFields (${template.fields.length}):\n`;
          template.fields.forEach((field: any, fieldIndex: number) => {
            response += `  ${fieldIndex + 1}. "${field.name}" (${field.type})`;
            if (field.description) {
              response += ` - ${field.description}`;
            }
            if (field.options) {
              response += ` [options: ${JSON.stringify(field.options)}]`;
            }
            response += `\n`;
          });
        } else {
          response += `\nFields: None\n`;
        }

        if (includeTemplateLayout) {
          response += `\n📐 Layout Information:\n`;
          response += `  Default Visuals:\n`;
          response += `    - Node: ${template.defaultVisuals.node}\n`;
          response += `    - Window: ${template.defaultVisuals.window}\n`;
          response += `  Visual Variants:\n`;
          response += `    ${JSON.stringify(template.visuals, null, 2)}\n`;
        }

        response += `\n`;
      });

      return response;
    } catch (error) {
      console.error("Read canvas error:", error);
      return `Read canvas failed: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the canvas ID and try again.`;
    }
  },
});
