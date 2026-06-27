import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto"

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
    
    Object.assign(profile_to_update, newProfileData);
    await profile_to_update.save();

    return res.json({message:"Profile Updated successfully."})
  }catch(err){
     return res.status(500).json({message:err.message})
  }
}

  