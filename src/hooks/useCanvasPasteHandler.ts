import { useEffect, useCallback } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useFileUpload } from "./useFilesUpload";
import toast from "react-hot-toast";
import { toXyNode } from "@/components/utils/nodeUtils";
import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";

/**
 * Hook to handle paste events on the canvas
 * - Detects images and uploads them to R2, then creates an ImageNode
 * - Detects URLs and creates ImageNode (if image URL) or LinkNode (if web URL)
 */
export function useCanvasPasteHandler() {
  const { addNodes, setNodes, updateNodeData } = useReactFlow();
  const { x: canvasX, y: canvasY, zoom: canvasZoom } = useViewport();
  const { uploadFile } = useFileUpload();
  const fetchLinkMetadata = useAction(api.links.fetchLinkMetadata);

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
   */
  const createImageNode = useCallback(
    (url: string = "") => {
      const nodeId = `node-${crypto.randomUUID()}`;
      const position = getViewportCenter();

      // Get ImageNode config from prebuilt nodes
      const imageNodeConfig = prebuiltNodesConfig.find(
        (config) => config.type === "image"
      );
      if (!imageNodeConfig) {
        toast.error("Erreur: Configuration ImageNode introuvable");
        return null;
      }

      // Create the node
      const baseNode = toXyNode(imageNodeConfig.initialNodeValues);
      const newNode = {
        ...baseNode,
        id: nodeId,
        type: "image",
        position,
        data: {
          ...baseNode.data,
          url,
        },
      };

      addNodes(newNode);

      // Select only this node
      setTimeout(() => {
        setNodes((nodes) =>
          nodes.map((n) => ({
            ...n,
            selected: n.id === nodeId,
          }))
        );
      }, 0);

      return nodeId;
    },
    [addNodes, setNodes, getViewportCenter]
  );

  /**
   * Create a LinkNode with a URL and fetch metadata
   */
  const createLinkNode = useCallback(
    async (url: string) => {
      const nodeId = `node-${crypto.randomUUID()}`;
      const position = getViewportCenter();

      // Get LinkNode config from prebuilt nodes
      const linkNodeConfig = prebuiltNodesConfig.find(
        (config) => config.type === "link"
      );
      if (!linkNodeConfig) {
        toast.error("Erreur: Configuration LinkNode introuvable");
        return null;
      }

      // Create the node with temporary data (URL as title)
      const baseNode = toXyNode(linkNodeConfig.initialNodeValues);
      const newNode = {
        ...baseNode,
        id: nodeId,
        type: "link",
        position,
        data: {
          ...baseNode.data,
          href: url,
          pageTitle: url, // Temporary title
        },
      };

      addNodes(newNode);

      // Select only this node
      setTimeout(() => {
        setNodes((nodes) =>
          nodes.map((n) => ({
            ...n,
            selected: n.id === nodeId,
          }))
        );
      }, 0);

      // Fetch metadata in background and update the node
      try {
        const metadata = await fetchLinkMetadata({ url });
        updateNodeData(nodeId, {
          href: url,
          pageTitle: metadata.title || url,
          pageImage: metadata.image || "",
          pageDescription: metadata.description || "",
          siteName: metadata.site_name || "",
        });
      } catch (error) {
        console.error("Failed to fetch link metadata:", error);
        // Keep the node with URL as title
      }

      return nodeId;
    },
    [addNodes, setNodes, getViewportCenter, fetchLinkMetadata, updateNodeData]
  );

  /**
   * Handle image file paste
   */
  const handleImageFilePaste = useCallback(
    async (file: File) => {
      // Create the node first (with empty URL)
      const nodeId = createImageNode("");
      if (!nodeId) return;

      try {
        // Upload to R2
        const fileData = await uploadFile(file);

        // Update the node with the uploaded URL
        updateNodeData(nodeId, { url: fileData.url });
        toast.success("Image ajoutée au canvas");
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Erreur lors de l'upload de l'image");

        // Remove the node since upload failed
        setNodes((nodes) => nodes.filter((n) => n.id !== nodeId));
      }
    },
    [createImageNode, uploadFile, updateNodeData, setNodes]
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
        createImageNode(url);
        toast.success("Image ajoutée au canvas");
      } else {
        // Create LinkNode (async - fetches metadata in background)
        await createLinkNode(url);
        toast.success("Lien ajouté au canvas");
      }
    },
    [isImageUrl, createImageNode, createLinkNode]
  );

  /**
   * Main paste event handler
   */
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
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
    [handleImageFilePaste, handleUrlPaste]
  );

  // Register paste event listener
  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);
}
