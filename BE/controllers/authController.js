import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password, age, gender, address } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    
    const user = new User({ username, email, password, age, gender, address });
    await user.save();
    
    // Create JWT token
    const token = generateToken(user);
    
    // Set cookies
    res.cookie('jwt', token, {
      httpOnly: false,
      secure: false, // Set to true in production with HTTPS
      path: '/',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.cookie('userId', user._id.toString(), {
      httpOnly: false,
      secure: false,
      path: '/',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.cookie('username', user.username, {
      httpOnly: false,
      secure: false,
      path: '/',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: { id: user._id, username, email }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Create JWT token
    const token = generateToken(user);
    
    // Set cookies
    res.cookie('jwt', token, {
      httpOnly: false,
      secure: false, // Set to true in production with HTTPS
      path: '/',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.cookie('userId', user._id.toString(), {
      httpOnly: false,
      secure: false,
      path: '/',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.cookie('username', user.username, {
      httpOnly: false,
      secure: false,
      path: '/',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({ 
      message: 'Login successful',
      user: { id: user._id, username, email: user.email }
    });
  } catch (err) {
    next(err);
  }
}; 