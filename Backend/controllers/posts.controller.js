import Post from "../models/posts.model.js"
import User from "../models/user.model.js"


export const activeCheck = async (req,res)=>{
    return res.status(200).json({message:"Running"})
}

export const createPost = async(req,res)=>{
    const {token} = req.body

    try{
        const user = await User.findOne({token:token});

        if(!user){
            return res.status(404).json({message:"user not found"})
        }

        const post = new Post({
            userId:user._id,
            body:req.body.body,
            media:req.file != undefined ? req.file.filename :"",
            fileType:req.file != undefined ? req.file.mimetype.split("/")[1] : ""
            
        })
        await post.save();

        return res.status(200).json({message:"post created.."})
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

// ****************************** Post section *****************************************

export const getAlPost = async (req,res)=>{
    console.log("GET /posts called");
    try{
      const posts = await Post.find().populate('userId','name email username profile_Picture')
      console.log(posts)
      return res.json(posts)
    }catch(err){
      return res.status(500).json({message:err.message})
    }
}

export const deletePost = async (req,res) => {
    const {token,post_id} = req.body;
    try{
        const user = await User.findOne({token}).select("_id");

        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        const post = await Post.findOne({_id:post_id});
        if(!post){return res.status(404).json({message:"Post not found"})}

        if(post.userId.toString() !== user._id.toString()){
            return res.status(401).json({message:"Unauthorized"})
        }

        await Post.deletePost({_id:post_id});
        return res.json({message: "Post Deleted"})
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

// *********************** comment section  **************************************

export const commentPost = async (req,res)=>{

    const {token,post_id,commentBody}
    try{

        const user = await User.findOne({token:token}).select("_id")
        if(!user){
            return res.status(404).json({message:"Post not found"})
        }

        const pist = await Post.findOne({
            _id:post_id
        });
        if(!post){return res.status(404).json({message:"Post not found"})}

        const comment = new Comment({
            userId:User._id,
            postId:post_id,
            comment:commentBody
        })

        await comment.save();
        return res.status(200).json({message:"comment added"})
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}


export const get_comments_by_post = async (req,res) => {
        const {post_id} = req.body;
        try{
            const post = await Post.findOne({_id:post_id});
            if(!post){return res.status(404).json({message:"Post not found"})}
            return res.json({comments:post.comments})
        }catch(err){
            return res.status(500).json({message:err.message})
        }
}

export const delete_comment_of_user = async (req,res)=>{
    const {token,comment_id} = req.body;

    try{
        const user = await User.findOne({token:token}).select("_id");
        if(!user){return res.status(404).json({message:"user not found"})}
        const comment = await Comment.findOne({"_id" : comment_id})
        if(!comment){return res.status(404).json({message:"comment not found"})}
        if(comment.userId.toString()!==user._id.toString()){
            return  res.status(401).json({message:"Unauthorized"})
        }
        await Comment.deleteOne({"_id":comment_id});
        return res.json({message:"comment deleted successfully ..."})
    }catch(err){
        return res.status(500).json({message: err.message})
    }
}

export const increament_likes = async(req,res)=>{

    const {post_id} = req.body;
    try{
        const post = await post.findOne({_id:post_id});
        if (!post){return res.status(404).json({message:"Post not found"})}
        post.likes = post.likes+1;
        post.save();
        return res.json({message:"you liked the post"})
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}