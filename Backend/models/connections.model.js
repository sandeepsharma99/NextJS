import mongoose from "mongoose"
const connectionRequest = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    connectionId:{
        type:mongoose.Schema.ObjectId,
        ref:'User'
    },
    status_accepted:{
        type:Boolean,
        default:null
    }
})

connectionRequest = mongoose.model('connectionRequest',connectionRequest)
export default connectionRequest