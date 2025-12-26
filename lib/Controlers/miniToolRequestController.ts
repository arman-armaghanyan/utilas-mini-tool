import {RequestControllerBase} from "@/lib/Controlers/requestControllerBase";
import {MiniToolPrevDto} from "@/lib/models/DTOs/MiniToolPrevDto";
import {MiniToolDto} from "@/lib/models/DTOs/MiniToolDto";
import {ApiError, MiniToolPayloadDto} from "@/lib/api";

export class MiniToolRequestController extends RequestControllerBase {
    public getTools(): Promise<MiniToolPrevDto[]> {
        return super.request<MiniToolPrevDto[]>("/api/tools");
    }

    public updateTool(id: string, payload: Partial<MiniToolPayloadDto>): Promise<MiniToolDto> {
        return super.request<MiniToolDto>(`/api/tools/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    }

    public searchTools(query: string): Promise<MiniToolPrevDto[]> {
        return super.request<MiniToolPrevDto[]>(`/api/tools/search-tools?q=${encodeURIComponent(query)}`);
    }

    public getTool(id: string): Promise<MiniToolDto> {
        return super.request<MiniToolDto>(`/api/tools/${id}`);
    }

    public deleteTool(id: string): Promise<void> {
        return super.request<void>(`/api/tools/${id}`, {method: "DELETE"});
    }

    public createTool(payload: MiniToolPayloadDto): Promise<MiniToolDto> {
        return super.request<MiniToolDto>("/api/tools", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }

    public async uploadReactApp(
        id: string,
        file: File
    ): Promise<MiniToolDto> {
        const formData = new FormData();
        formData.append("reactApp", file);

        const API_BASE_URL = super.getApiBaseUrl();
        const url = API_BASE_URL ? `${API_BASE_URL}/api/tools/${id}/upload-react-app` : `/api/tools/${id}/upload-react-app`;

        return fetch(url, {
            method: "POST",
            body: formData,
            cache: "no-store",
        }).then(async (response) => {
            if (!response.ok) {
                const message = await super.extractError(response);
                throw new ApiError(message, response.status);
            }
            return response.json();
        });
    }
}