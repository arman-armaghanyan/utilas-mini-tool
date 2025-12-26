import {MiniToolPrevDto} from "@/lib/models/DTOs/MiniToolPrevDto";
import {MiniToolRequestController} from "@/lib/Controlers/miniToolRequestController";
import {MiniToolPreviewRequestController} from "@/lib/Controlers/miniToolPreviewRequestController";
import {MiniToolDto} from "@/lib/models/DTOs/MiniToolDto";

export type MiniToolPayloadDto = Omit<
    MiniToolDto,
    "_id" | "createdAt" | "updatedAt" | "iframeUrl" | "reactAppUrl"
>;

// Backwards-compatible public types (used across pages/components)
export type MiniTool = MiniToolDto;
export type MiniToolPrev = MiniToolPrevDto;

export type MiniToolPrevPayload = MiniToolPrevDto;
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const MiniToolPreviewController = new MiniToolPreviewRequestController();
export const MiniToolController = new MiniToolRequestController();

// Backwards-compatible public functions (old code imports these from "@/lib/api")
export function getTools(): Promise<MiniToolPrevDto[]> {
  return MiniToolController.getTools();
}

export function searchTools(query: string): Promise<MiniToolPrevDto[]> {
  return MiniToolController.searchTools(query);
}

export function getTool(id: string): Promise<MiniToolDto> {
  return MiniToolController.getTool(id);
}

export function createTool(payload: MiniToolPayloadDto): Promise<MiniToolDto> {
  return MiniToolController.createTool(payload);
}

export function updateTool(
  id: string,
  payload: Partial<MiniToolPayloadDto>
): Promise<MiniToolDto> {
  return MiniToolController.updateTool(id, payload);
}

export function deleteTool(id: string): Promise<void> {
  return MiniToolController.deleteTool(id);
}

export function uploadReactApp(id: string, file: File): Promise<MiniToolDto> {
  return MiniToolController.uploadReactApp(id, file);
}

export function createToolPreview(payload: MiniToolPrevPayload): Promise<MiniToolPrevDto> {
  return MiniToolPreviewController.createToolPreview(payload);
}

export function updateToolPreview(
  id: string,
  payload: Partial<MiniToolPrevPayload>
): Promise<MiniToolPrevDto> {
  return MiniToolPreviewController.updateToolPreview(id, payload);
}

export function deleteToolPreview(id: string): Promise<void> {
  return MiniToolPreviewController.deleteToolPreview(id);
}



