import { Router } from "express";
import { activeCheck , commentPost, createPost, delete_comment_of_user, deletePost, get_comments_by_post, increament_likes } from "../controllers/posts.controller.js";
import multer from "multer";
import { getAlPost } from "../controllers/posts.controller.js";

const router = Router() //calling router
router.route("/").get(activeCheck)

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'uploads/')
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname)
    }
})

const upload = multer({storage:storage})
router.route("/post").post(upload.single('media'),createPost)
router.route("/posts").get(getAlPost)
router.route("/delete_post").post(deletePost)
router.route("/comment").post(commentPost)
router.route("/get_comments").get(get_comments_by_post)
router.route("/delete_comment").delete(delete_comment_of_user)
router.route("/increment_post_like").post(increament_likes)


export default router;
