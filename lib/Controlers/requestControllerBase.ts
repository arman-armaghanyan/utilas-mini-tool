import {ApiError} from "@/lib/api";


export abstract class RequestControllerBase {
    protected async request<T>(
        path: string,
        init: RequestInit = {}
    ): Promise<T> {
        const API_BASE_URL = this.getApiBaseUrl();
        const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

        const response = await fetch(url, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...(init.headers || {}),
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const message = await this.extractError(response);
            throw new ApiError(message, response.status);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return response.json();
    }

    protected getApiBaseUrl(): string {
        const baseUrl =
            process.env.API_BASE_URL;

        return baseUrl ? baseUrl.replace(/\/$/, "") : "";
    }

    protected async extractError(response: Response): Promise<string> {
        try {
            const data = await response.json();
            if (data?.message) {
                return data.message;
            }
        } catch {
        }
        return response.statusText || "Request failed";
    }
}