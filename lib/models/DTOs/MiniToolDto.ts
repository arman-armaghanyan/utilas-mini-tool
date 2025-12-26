
 export  type MiniToolDto = {
    _id?: string;
    id: string;
    title: string;
    summary: string;
    description: DescriptionBlock[];
    thumbnail: string;
    iframeSlug: string;
    iframeHtml?: string;
    reactAppUrl?: string;
    appType?: "html" | "react";
    iframeUrl?: string;
    iframeFullUrl?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type DescriptionBlock = {
    image: string;
    text: string;
    orientation: "left" | "right";
};