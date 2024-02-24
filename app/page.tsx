"use client";
import { Room } from "./Room";
import Live from "@/components/Live";
import React, { useEffect, useRef } from "react";
import { ActiveElement, CustomFabricObject } from "@/types/type";
import { fabric } from "fabric";
import {
  handleCanvasMouseDown,
  handleResize,
  initializeFabric,
  handleCanvaseMouseMove,
  handleCanvasMouseUp,
  renderCanvas,
  handleCanvasObjectModified,
} from "@/lib/canvas";
import Navbar from "@/components/Navbar";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import LeftSidebar from "@/components/LeftSidebar";
import { handleImageUpload } from "@/lib/shapes";

export default function Page() {
  const undo = useUndo();
  const redo = useRedo();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fabricRef = React.useRef<fabric.Canvas | null>(null);
  const isDrawing = React.useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [activeElement, setActiveElement] = React.useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });

  // @ts-ignore
  const canvasObjects = useStorage((root) => root.canvasObjects);
  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;
    const { objectId } = object;
    const shapeData = object.toJSON();
    shapeData.objectId = objectId;
    // @ts-ignore
    const canvasObjects = storage.get("canvasObjects") || {};
    // @ts-ignore
    canvasObjects.set(objectId, shapeData);
  }, []);
  useEffect(() => {
    const canvas = initializeFabric({ canvasRef, fabricRef });
    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
      });
    });
    canvas.on("mouse:move", (options) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
      });
    });
    canvas.on("mouse:up", (options) => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
        activeObjectRef,
      });
    });
    canvas.on("object:modified", (options) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      });
    });
    window.addEventListener("resize", () => {
      // @ts-ignore
      handleResize({ fabricRef });
    });

    window.addEventListener("keydown", (e) => {
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      });
    });
    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    renderCanvas({ fabricRef, canvasObjects, activeObjectRef });
  }, [canvasObjects]);

  const deleteAllShapes = useMutation(({ storage }) => {
    // @ts-ignore
    const canvasObjects = storage.get("canvasObjects") || {};
    // @ts-ignore
    if (!canvasObjects || canvasObjects.size === 0) return true;
    // @ts-ignore
    for (const [key, value] of canvasObjects.entries()) {
      // @ts-ignore
      canvasObjects.delete(key);
    }
    // @ts-ignore
    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(
    ({ storage }, objectId: string) => {
      // @ts-ignore
      const canvasObjects = storage.get("canvasObjects") || {};
      // @ts-ignore
      canvasObjects.delete(objectId);
    },
    []
  );

  const handleActiveElement = (element: ActiveElement) => {
    setActiveElement(element);
    switch (element?.value) {
      case "reset":
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement);
        break;
      case "delete":
        handleDelete(fabricRef.current as any, deleteShapeFromStorage);
        setActiveElement(defaultNavElement);
        break;
      case "image":
        imageInputRef.current?.click();
        isDrawing.current = false;
        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
        break;
      default:
        break;
    }
    selectedShapeRef.current = element?.value as string;
  };
  return (
    <div className={"h-screen overflow-hidden"}>
      <Navbar
        imageInputRef={imageInputRef}
        handleImageUpload={(e) => {
          e.stopPropagation();
          handleImageUpload({
            // @ts-ignore
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          });
        }}
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
      />
      <section className={"flex h-full flex-row"}>
        <LeftSidebar allShapes={Array.from(canvasObjects)} />
        <Live canvasRef={canvasRef} />
      </section>
    </div>
  );
}
