"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";

export const viewImageTool = createTool({
  description: "View an image from a URL by fetching and encoding it",
  args: z.object({
    url: z.string().describe("The URL of the image to view"),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{
    type: "image";
    data: string;
    mimeType: string;
  }> => {
    console.log(`🖼️ Fetching image from URL: ${args.url}`);

    try {
      // Fetch l'image depuis l'URL
      const response = await fetch(args.url);

      if (!response.ok) {
        console.error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // Récupère le Content-Type
      const contentType = response.headers.get("content-type");
      console.log(`Image content type: ${contentType}`);

      if (!contentType?.startsWith("image/")) {
        console.error(`URL does not point to an image: ${contentType}`);
        throw new Error(`URL does not point to an image: ${contentType}`);
      }

      // Convertit en ArrayBuffer puis en base64
      const arrayBuffer = await response.arrayBuffer();
      const imageSizeKB = Math.round(arrayBuffer.byteLength / 1024);
      console.log(`Image size: ${imageSizeKB} KB`);

      // Convertir ArrayBuffer en base64 sans Buffer (pas disponible dans Convex)
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(uint8Array)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const base64 = btoa(binaryString);
      console.log(`✅ Image successfully fetched and encoded`);

      // Retourne dans un format structuré
      return {
        type: "image",
        data: base64,
        mimeType: contentType,
      };
    } catch (error) {
      console.error("View image error:", error);
      throw new Error(
        `Failed to view image: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the URL and try again.`
      );
    }
  },
});
