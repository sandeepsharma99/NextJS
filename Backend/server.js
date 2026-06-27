import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import mongoose from "mongoose"
import postRoutes from "./routes/post.routes.js"
import userRoutes from './routes/user.routes.js'

const PORT = 3000
dotenv.config()
const app = express()
app.use(express.json())
app.use(cors())
app.use(postRoutes)
app.use(userRoutes)


console.log(PORT)
mongoose.connect(process.env.mongo_url)
.then(()=>{
    console.log(`database connected..`)
}).catch((err)=>{
    console.log("err in dataase connection :", err)
})




app.listen(PORT,()=>{
    console.log(`backend is running on PORT : ${PORT}`)
})