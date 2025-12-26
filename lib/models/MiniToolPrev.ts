import mongoose, {Schema, Document, Model} from "mongoose";
export interface IMiniToolPrev extends Document {
    id: string;
    title: string;
    summary:  string;
    thumbnail:string;
    toolId:string;
}

const miniToolPrevSchema = new Schema<IMiniToolPrev>(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        summary: {
            type: String,
            required: true,
            trim: true,
        },
        thumbnail: {
            type: String,
            required: true,
            trim: true,
        },
        toolId:{
            type: String,
            required: true,
            trim: true,
        }
    }
)

const MiniToolPrev: Model<IMiniToolPrev> =
    mongoose.models.MiniToolPrev || mongoose.model<IMiniToolPrev>("MiniToolPrev", miniToolPrevSchema);

export default MiniToolPrev;