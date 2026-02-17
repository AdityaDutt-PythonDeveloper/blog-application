import mongoose from "mongoose";

const Schema = mongoose.Schema;

const postSchema = new Schema(
    {
        title: {type:String, required: true},
        content : {type:String, required: true} ,
        user: {type:mongoose.Schema.Types.ObjectId, ref: "User", required:true},
    },
    {timestamps: true}
);

const post = mongoose.model('post', postSchema);

export default post;