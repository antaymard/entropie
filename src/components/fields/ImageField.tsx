import type { BaseFieldProps } from "@/types/field.types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNodeSidePanel } from "../nodes/side-panels/NodeSidePanelContext";
import SidePanelFrame from "../nodes/side-panels/SidePanelFrame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../shadcn/tabs";
import { UploadFile } from "./UploadFile";
import { TbPencil } from "react-icons/tb";
import { debounce } from "lodash";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

type ImageValueType = {
  url: string;
  inImageNavigation?: {
    scale: number;
    positionX: number;
    positionY: number;
  };
};

const sidePanelId = "imageEdition";

export default function ImageField({
  field,
  value,
  onChange,
  visualSettings,
}: BaseFieldProps<ImageValueType[]>) {
  const { closeSidePanel, openSidePanel } = useNodeSidePanel();
  const imageUrl = value && value.length > 0 ? value[0].url : "";

  const handleSave = useCallback((newValue: ImageValueType) => {
    onChange?.([newValue]);
    closeSidePanel(sidePanelId);
  }, []);

  function openSidePanelForImageEdition() {
    openSidePanel(
      sidePanelId,
      <ImageUploader
        initialValue={imageUrl}
        onSave={handleSave}
        onClose={() => closeSidePanel(sidePanelId)}
      />
    );
  }

  if (!value || value.length === 0) {
    return (
      <div
        className="aspect-video border-2 border-dashed flex items-center justify-center rounded-md cursor-pointer"
        onClick={openSidePanelForImageEdition}
      >
        <p className="text-gray-500">Ajouter une image</p>
      </div>
    );
  }

  return (
    <div className="relative group/imagefield">
      <button
        type="button"
        className="absolute top-2 right-2 bg-white rounded items-center justify-center h-8 w-8 group-hover/imagefield:flex hidden"
        onClick={openSidePanelForImageEdition}
      >
        <TbPencil />
      </button>
      {visualSettings?.enableInImageNavigation ? (
        <NavigatingImage
          imageUrl={imageUrl}
          onMouve={(newTransform: {
            scale: number;
            positionX: number;
            positionY: number;
          }) => {
            onChange?.([
              {
                url: imageUrl || "",
                inImageNavigation: newTransform,
              },
            ]);
          }}
          inImageNavigation={value?.[0]?.inImageNavigation}
        />
      ) : (
        <img
          src={imageUrl}
          alt="Selected"
          className="w-full h-auto rounded-md"
        />
      )}
    </div>
  );
}

function NavigatingImage({
  imageUrl,
  onMouve,
  inImageNavigation,
}: {
  imageUrl: string;
  onMouve: (newTransform: {
    scale: number;
    positionX: number;
    positionY: number;
  }) => void;
  inImageNavigation?: { scale: number; positionX: number; positionY: number };
}) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const hasInitialized = useRef(false);

  // Debounced update function - créé une seule fois et réutilisé
  const debouncedUpdate = useMemo(
    () =>
      debounce((scale: number, positionX: number, positionY: number) => {
        onMouve({
          scale,
          positionX,
          positionY,
        });
      }, 300),
    []
  );

  // Nettoyage du debounce au démontage
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, []);

  // Handler pour les transformations
  const handleTransform = useCallback(
    (_e: unknown, { scale, positionX, positionY }: any) => {
      debouncedUpdate(scale, positionX, positionY);
    },
    []
  );

  // Restaurer la position après le montage du TransformWrapper
  useEffect(() => {
    if (!transformRef.current || hasInitialized.current || !imageUrl) {
      return;
    }

    const savedTransform = inImageNavigation as
      | { scale: number; positionX: number; positionY: number }
      | undefined;

    if (savedTransform) {
      setTimeout(() => {
        transformRef.current?.setTransform(
          savedTransform.positionX,
          savedTransform.positionY,
          savedTransform.scale,
          0
        );
        hasInitialized.current = true;
      }, 0);
    }
  }, [imageUrl, inImageNavigation]);

  return (
    <TransformWrapper
      ref={transformRef}
      panning={{ velocityDisabled: true }}
      doubleClick={{ disabled: true }}
      onTransformed={handleTransform}
    >
      <TransformComponent wrapperClass="flex-1 nodrag" contentClass="flex-1">
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      </TransformComponent>
    </TransformWrapper>
  );
}

function ImageUploader({ initialValue, onSave, onClose }) {
  const [urlInput, setUrlInput] = useState("");

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onSave({ url: urlInput.trim() });
      setUrlInput("");
    }
  };

  const handleUploadComplete = (fileData: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt: number;
    key: string;
  }) => {
    onSave({ url: fileData.url });
  };

  return (
    <SidePanelFrame id={sidePanelId} title="Modifier l'image" className="w-64">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="upload">Image</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-2">
          <UploadFile
            onUploadComplete={handleUploadComplete}
            accept="image/*"
          />
        </TabsContent>
        <TabsContent value="url" className="mt-4">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
          />
          <p className="text-xs italic mt-2 float-end mr-1">
            Entrée pour valider
          </p>
        </TabsContent>
      </Tabs>
    </SidePanelFrame>
  );
}
