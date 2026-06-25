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
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch) return res.status(404).json({message:"Invalid credentials"})
        const token = crypto.randomBytes(32).toString('hex')
        await User.updateOne({_id:user._id},{token})
        return res.json({token})
    }catch(err){
        console.log({message:"error in loginn"}, err)
        return res.status(500).json({ message: "An error occurred during login." });
    }
};