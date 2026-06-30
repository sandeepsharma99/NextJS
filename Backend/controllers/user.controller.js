import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto"
import PDFDocument from 'pdfkit'
import fs from 'fs';
import ConnectionRequest from "../models/connections.model.js";


// const convertUserDataToPDF = async (userData)=>{
//     const doc = new PDFDocument();

//     const outputPath = crypto.randomBytes(32).toString('hex')+".pdf"
//     const stream = fs.createWriteStream("uploads/"+outputPath);
//     doc.pipe(stream);

//     doc.image(`uploads/${userData.userId.profile_Picture}`,{align:'center',width:100})
//     doc.fontSize(14).text(`Name:${userData.userId.name}`)
//     doc.fontSize(14).text(`Username:${userData.userId.username}`)
//     doc.fontSize(14).text(`Email:${userData.userId.email}`)
//     doc.fontSize(14).text(`Bio:${userData.bio}`)
//     doc.fontSize(14).text(`Current Position:${userData.currentPost}`)
    
//     doc.fontSize(14).text(`Past Work: `)
//     userData.position.forEach((work,index)=>{
//         doc.fontSize(14).text(`Company Name : ${work.company}`)
//         doc.fontSize(14).text(` Position : ${work.position}`)
//         doc.fontSize(14).text(` Years : ${work.year}`)
//     })

//     doc.end()
//     return outputPath
// }


export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({
      email,
    });
    if (user)
      return res.status(400).json({ message: "User is already exists with this email" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // This creates a User object in memory.
    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save();
    const profile = new Profile({ userId: newUser._id });
    await profile.save();
    return res.status(201).json({ message: "User created successfully..." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const login = async(req,res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password)return res.status(400).json({message:"All fields are required"})
        
        const user = await User.findOne({email});
        if (!user) return res.status(404).json({message:"user doesnot exist"})
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch) return res.status(404).json({message:"Invalid credentials"})
        const token = crypto.randomBytes(32).toString('hex')  // Generate a secure random token for the authenticated user 
        await User.updateOne({_id:user._id},{$set: {token: token}})
        return res.json({token})
    }catch(err){
        console.log({message:"error in loginn"}, err)
        return res.status(500).json({ message: "An error occurred during login." });
    }
};

export const uploadProfilePicture = async(req,res)=>{
  const {token} = req.body
  console.log(token)
  try{
      const user = await User.findOne({token: token})
      if(!user){
          return res.status(404).json({message:"User not found"})
      }
      user.profile_Picture = req.file.filename
      await user.save()
      return res.json({message:"Profile picture updated successfully."})
  }catch(err){
      return res.status(500).json({message:err.message})
  }
}

export const updateUserProfile = async(req,res)=>{
  try{  
    const {token,...newUserData} = req.body

    const user = await User.findOne({token: token})
    if(!user){
      return res.status(404).json({message:"User not found"})
    }


    const {username,email} = newUserData;
    const existingUser = await User.findOne({$or: [{username},{email}]});
    if(existingUser){
      if(existingUser || String(existingUser._id) !== String(user._id)){
        return res.status(400).json({message:"User already Exists"})
      }
    }
    
    Object.assign(user, newUserData);
    await user.save();
    return res.status(200).json({message: "User profile updated successfully."})
  }catch(err){
    return res.status(500).json({message:err.message})
  }
}

export const getUserAndProfile = async(req,res) =>{
  try{
    const {token} = req.body

    const user = await User.findOne({token: token})

    if(!user){
      return res.status(404).json({message:"User not found"});
    }
    const userProfile = await Profile.findOne({userId:user._id})
    .populate("userId",'name email username profile_Picture');

    return res.json(userProfile)
  }catch(err){
    return res.status(500).json({message:err.message})
  }
}

export const updateProfileData = async (req,res)=>{
  try{
    const {token,...newProfileData} = req.body
    const userProfile = await User.findOne({token:token})
    if(!userProfile){
      return res.status(404).json({message:"User Not found"})
    }
    const profile_to_update = await Profile.findOne({userId:userProfile._id})
    if(!profile_to_update){
      return res.status(404).json({message:"Profile not found for this user"})
    }
    
    Object.assign(profile_to_update, newProfileData); // ??
    await profile_to_update.save();

    return res.json({message:"Profile Updated successfully."})
  }catch(err){
     return res.status(500).json({message:err.message})
  }
}


export const getAllUserProfile = async (req,res)=>{
  try{
    const profiles = await Profile.find().populate('userId','name email username profile_Picture')
    return res.json({profiles})
  }catch(err){
      return res.status(500).json({message:err.message})
  }
}

// export const downloadProfile = async (req,res) =>{
//     const user_id = req.query.id

//     const userProfile = await Profile.findOne({userId:user_id})
//     .populate('userId','name username email profile_Picture')

//     let outputPath = await convertUserDataToPDF(userProfile);
//     return res.json({"message": outputPath})
// }

export const sendConnectionRequest = async (req,res)=>{
  const {token,connectionId} = req.body;

  try{
      const user = await User.findOne({token})
      if(!user){
        return res.status(404).json({message:"Usernot found"})
      }
      const connectionUser = await User.findById(connectionId);
      const existingRequest = await ConnectionRequest.findOne(
        {
          userId:user._id,
          connectionId:connectionUser._id
        }
      )
      if(existingRequest){
        return res.status(400).json({message:"Request already sent"})
      }
      const request = new ConnectionRequest({
        userId:user._id,
        connectionId:connectionUser._id
      })
      await request.save()
      return res.json({message:"Request sent"})
  }catch(err){
      return res.status(500).json({message:err.message})
  }
}

export const getMyConnectionsRequests = async (req,res)=>{
  const {token} = req.body;

  try{
    const user = await User.findOne({token})

    if(!user){
      return res.status(404).json({message:"User not found"})
    }
    const connections = await ConnectionRequest.find({userId:user._id})
      .populate('connectionId','name username email profile_Picture')

    return res.json({connections})

  }catch(err){
    return res.status(500).json({message:err.message})
  }
}

export const whatAreMyConnections = async (req,res) =>{
  const {token} = req.body

  try{
      const user = await User.findOne({token})

      if (!user){
        return res.status(400).json({message:"userNot found"})
      }

      const connections = await ConnectionRequest.find({connectionId:user._id})
      .populate('userId','name email username profile_Picture')

      return res.json(connections)
  }catch(err){
      return res.status(500).json({message:err.message})
  }
}


export const acceptConnectionRequest = async (req,res)=>{
  const {token,requestId,action_type} = req.body;
  try{
    const user = await User.findOne({token});
    if(!user){
      return res.status(404).json({message:"user not found"})
    }

    const connection = await ConnectionRequest.findById(requestId);
    // Add logic to handle accept/reject and send a response
    if (!connection){
      return res.status(404).json({message:"Connection not found"})
    }
    if (action_type === 'accept'){
      connection.status_accepted = true;
    }
  }catch(err){
    return res.status(500).json({message:err.message})
  }
}

