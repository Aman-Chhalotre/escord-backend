const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const RefreshToken = require("../models/RefreshToken");

// Create User 
exports.signup = async (req, res) => {
  try {
    const { fullname, email, password, mobile ,role} = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: "Failed",
        message: "User already exists",
        error: {
          message: "User already exists",
        }
      });
    } 
    // Save user
    const newUser = new User({ fullname, email,password,mobile ,role});
    await newUser.save();
    res.status(201).json({ 
      status: "Success",
      message: "User registered successfully.",
       data: {
        user_id: newUser._id,
        full_name: newUser.fullname,
        email: newUser.email,
        role:newUser.role,
        mobile:newUser.mobile,
    }});
} catch (error) {
    res.status(500).json({
      status: "Failed",
      message: error.message,
      error: {
        message: "User registration failed",
      },
    });
  }
};

//login

exports.login = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    // Find user by email or mobile
    const user = await User.findOne({ $or: [{ email }, { mobile }] });

    if (!user) {
      return res.status(400).json({status:"failed", message: "User not found" , error: { message: "Invalid credentials" },
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({status: "Failed", message: "Invalid credentials", 
        error: { message: "Invalid credentials" }
      });
    }

    // Generate  accessToken & refreshToken
    const {accessToken,refreshToken} = user.generateAuthToken();
    const refreshTokenSave = new RefreshToken({
      token: refreshToken,
      userId: user._id,
      expiresAt: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    await refreshTokenSave.save();
    // Set token in HTTP-only cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
     // Set token in HTTP-only cookie
     res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV,
      sameSite: "strict",
      maxAge: 7 * 60 * 60 * 1000, // 7 day
    });
   
    res.status(201).json({ 
      status: "Success",
      message: "User logged in successfully.",
       data: {
        user_id: user._id,
        full_name: user.fullname,
        email: user.email,
        role:user.role,
        accessToken:accessToken,
        refreshToken:refreshToken,
        isVerified: user.isVerified
    }});  

  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: error.message,
      error: { message: "User Login failed" }
    });
  }
};





