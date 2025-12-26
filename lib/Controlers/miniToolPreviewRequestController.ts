import {RequestControllerBase} from "@/lib/Controlers/requestControllerBase";
import {MiniToolPrevDto} from "@/lib/models/DTOs/MiniToolPrevDto";
import {MiniToolPrevPayload} from "@/lib/api";

export class MiniToolPreviewRequestController extends RequestControllerBase {
    public createToolPreview(payload: MiniToolPrevPayload): Promise<MiniToolPrevDto> {
        return super.request<MiniToolPrevDto>("/api/tool-previews", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }

    public updateToolPreview(
        id: string,
        payload: Partial<MiniToolPrevPayload>
    ): Promise<MiniToolPrevDto> {
        return super.request<MiniToolPrevDto>(`/api/tool-previews/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    }

    public deleteToolPreview(id: string): Promise<void> {
        return super.request<void>(`/api/tool-previews/${id}`, {method: "DELETE"});
    }
}