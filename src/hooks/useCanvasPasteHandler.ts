import { useEffect, useCallback } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useFileUpload } from "./useFilesUpload";
import { useCreateNode } from "./useCreateNode";
import toast from "react-hot-toast";
import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import { useAction, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCanvasStore } from "@/stores/canvasStore";

/**
 * Hook to handle paste events on the canvas
 * - Detects images and uploads them to R2, then creates an ImageNode
 * - Detects URLs and creates ImageNode (if image URL) or LinkNode (if web URL)
 */
export function useCanvasPasteHandler() {
  const { setNodes } = useReactFlow();
  const { x: canvasX, y: canvasY, zoom: canvasZoom } = useViewport();
  const { uploadFile } = useFileUpload();
  const { createNode } = useCreateNode();
  const fetchLinkMetadata = useAction(api.links.fetchLinkMetadata);
  const updateNodeDataValues = useMutation(api.nodeDatas.updateValues);
  const focus = useCanvasStore((s) => s.focus);
  /**
   * Calculate the center position of the current viewport
   */
  const getViewportCenter = useCallback(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    return {
      x: (screenWidth / 2 - canvasX) / canvasZoom,
      y: (screenHeight / 2 - canvasY) / canvasZoom,
    };
  }, [canvasX, canvasY, canvasZoom]);

  /**
   * Check if a URL points to an image based on file extension
   */
  const isImageUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
        ".ico",
      ];
      return imageExtensions.some((ext) => pathname.endsWith(ext));
    } catch {
      return false;
    }
  }, []);

  /**
   * Create an ImageNode with optional initial URL
   * Returns nodeId and nodeDataId for later updates
   */
  const createImageNode = useCallback(
    async (
      url: string = "",
    ): Promise<{ nodeId: string; nodeDataId: Id<"nodeDatas"> } | null> => {
      const position = getViewportCenter();

      // Get ImageNode config from prebuilt nodes
      const imageNodeConfig = prebuiltNodesConfig.find(
        (config) => config.node.type === "image",
      );
      if (!imageNodeConfig) {
        toast.error("Error: ImageNode configuration not found");
        return null;
      }

      // Use createNode hook - it handles nodeData creation and node selection
      const { nodeId, nodeDataId } = await createNode({
        node: imageNodeConfig.node,
        position,
        initialValues: { images: url ? [{ url }] : [] },
      });

      return { nodeId, nodeDataId: nodeDataId! };
    },
    [getViewportCenter, createNode],
  );

  /**
   * Create a LinkNode with a URL and fetch metadata
   */
  const createLinkNode = useCallback(
    async (url: string) => {
      const position = getViewportCenter();

      // Get LinkNode config from prebuilt nodes
      const linkNodeConfig = prebuiltNodesConfig.find(
        (config) => config.node.type === "link",
      );
      if (!linkNodeConfig) {
        toast.error("Error: LinkNode configuration not found");
        return null;
      }

      // Use createNode hook - it handles nodeData creation and node selection
      const { nodeId, nodeDataId } = await createNode({
        node: linkNodeConfig.node,
        position,
        initialValues: {
          link: {
            href: url,
            pageTitle: url, // Temporary title
          },
        },
      });

      // Fetch metadata in background and update the nodeData
      if (nodeDataId) {
        try {
          const metadata = await fetchLinkMetadata({ url });
          await updateNodeDataValues({
            _id: nodeDataId,
            values: {
              link: {
                href: url,
                pageTitle: metadata.title || url,
                pageImage: metadata.image || "",
                pageDescription: metadata.description || "",
              },
            },
          });
        } catch (error) {
          console.error("Failed to fetch link metadata:", error);
          // Keep the nodeData with URL as title
        }
      }

      return nodeId;
    },
    [getViewportCenter, createNode, fetchLinkMetadata, updateNodeDataValues],
  );

  /**
   * Handle image file paste
   */
  const handleImageFilePaste = useCallback(
    async (file: File) => {
      // Create the node first (with empty URL)
      const result = await createImageNode("");
      if (!result) return;

      const { nodeId, nodeDataId } = result;

      try {
        // Upload to R2
        const fileData = await uploadFile(file);

        // Update the nodeData with the uploaded URL
        await updateNodeDataValues({
          _id: nodeDataId,
          values: { images: [{ url: fileData.url }] },
        });
        toast.success("Image added to canvas");
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Error uploading image");

        // Remove the node since upload failed
        setNodes((nodes) => nodes.filter((n) => n.id !== nodeId));
      }
    },
    [createImageNode, uploadFile, updateNodeDataValues, setNodes],
  );

  /**
   * Handle URL paste (image URL or web URL)
   */
  const handleUrlPaste = useCallback(
    async (url: string) => {
      // Check if it's a valid URL
      try {
        new URL(url);
      } catch {
        // Not a valid URL, ignore
        return;
      }

      if (isImageUrl(url)) {
        // Create ImageNode with the URL
        await createImageNode(url);
        toast.success("Image added to canvas");
      } else {
        // Create LinkNode (async - fetches metadata in background)
        await createLinkNode(url);
        toast.success("Link added to canvas");
      }
    },
    [isImageUrl, createImageNode, createLinkNode],
  );

  /**
   * Main paste event handler
   */
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      // blocked when focus is on platejs
      if (focus === "platejs") {
        return;
      }
      // Ignore paste events in input/textarea/contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for image files first
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          handleImageFilePaste(file);
          return;
        }
      }

      // Check for text (URL)
      const text = e.clipboardData?.getData("text");
      if (text && text.trim()) {
        const trimmedText = text.trim();
        // Only handle if it looks like a URL (starts with http:// or https://)
        if (
          trimmedText.startsWith("http://") ||
          trimmedText.startsWith("https://")
        ) {
          e.preventDefault();
          handleUrlPaste(trimmedText);
        }
      }
    },
    [handleImageFilePaste, handleUrlPaste],
  );

  // Register paste event listener
  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);
}
