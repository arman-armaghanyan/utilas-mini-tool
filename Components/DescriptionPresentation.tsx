import Image from "next/image";
import { DescriptionBlock } from "@/lib/api";

type DescriptionPresentationProps = {
  description: DescriptionBlock[];
  toolTitle: string;
};

export default function DescriptionPresentation({
  description,
  toolTitle,
}: DescriptionPresentationProps) {
  if (!Array.isArray(description) || description.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      {description.map((block, index) => (
        <div
          key={index}
          className={`flex flex-col gap-4 ${
            block.orientation === "right" ? "sm:flex-row-reverse" : "sm:flex-row"
          } sm:items-center`}
        >
          <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-md bg-zinc-100 sm:h-40 sm:w-48">
            <Image
              src={block.image}
              alt={`${toolTitle} - Description image ${index + 1}`}
              fill
              sizes="(min-width: 640px) 192px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm leading-6 text-zinc-600 whitespace-pre-line">
              {block.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

