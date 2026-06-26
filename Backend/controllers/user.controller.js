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
      return res.status(400).json({ message: "User is already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

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
        if (!user) return res.status(401).json({message:"Invalid credentials"})
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch) return res.status(404).json({message:"Invalid credentials"})
        if(!isMatch) return res.status(401).json({message:"Invalid credentials"})
        const token = crypto.randomBytes(32).toString('hex')
        await User.updateOne({_id:user._id},{$set: {token: token}})
        return res.json({token})
    }catch(err){
        console.log({message:"error in loginn"}, err)
        return res.status(500).json({ message: "An error occurred during login." });
    }
};

export const uploadProfilePicture = async(req,res)=>{
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (token == null) return res.sendStatus(401); // Unauthorized

  try{
      const user = await User.findOne({token: token})
      if(!user){
          return res.status(404).json({message:"User not found"})
      }
      user.profilePicture = req.file.filename
      await user.save()
      return res.json({message:"Profile picture updated successfully."})
  }catch(err){
      return res.status(500).json({message:err.message})
  }
}

export const updateUserProfile = async(req,res)=>{
  try{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    const user = await User.findOne({token: token})
    if(!user){
      return res.status(404).json({message:"User not found"})
    }

    const { ...newUserData } = req.body;
    const {username,email} = newUserData;

    if (username || email) {
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if(existingUser && String(existingUser._id) !== String(user._id)){
        return res.status(400).json({message:"Username or email already exists"})
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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    const user = await User.findOne({token: token})
    if(!user){
      return res.status(404).json({message:"User not found"});
    }
    const userProfile = await Profile.findOne({userId:user._id})
    .populate("userId");

    return res.json(userProfile)
  }catch(err){
    return res.status(500).json({message:err.message})
  }
}