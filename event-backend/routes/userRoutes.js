const express=require('express')
const router=express.Router()
require('dotenv').config()
const User=require('../model/userData')
const generateToken=require('../utils/generateToken')
const {protect,adminOnly}=require('../middleware/auth')
const bcrypt=require('bcrypt')

//user signup
router.post('/signup',async(req,res)=>{
    const {name,email,password, securityQuestion, securityAnswer}=req.body;
    
    try{
        const exists=await User.findOne({email});
        if(exists) return res.status(400).json({message:'Email already registered'})
        const user=await User.create({name,email,password,role:'user',securityQuestion,securityAnswer})
        const token=generateToken(user);
        res.status(201).json({token,user:{id:user._id,name:user.name,role:user.role}})
    } catch(err){
        res.status(500).send({message:err.message})
    }
})
// Controller signup (will be pending approval)
router.post('/controller/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const controller = await User.create({ name, email, password, role: 'controller', approved: false });

    res.status(201).json({ message: 'Signup successful. Awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unified login for all roles
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Controllers must be approved by the admin
    if (user.role === 'controller' && !user.approved) {
      return res.status(403).json({ message: 'Controller not approved yet' });
    }

    const token = generateToken(user);
    res.json({
      token,
        role: user.role
      
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get security question for given email
router.post('/forgot-password/verify', async (req, res) => {
  const { email, answer, newPassword } = req.body;

  if (!email || !answer || !newPassword) {
    return res.status(400).json({ message: 'Email, answer, and new password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare hashed security answer using bcrypt
    const isMatch = await bcrypt.compare(answer, user.securityAnswer);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect security answer' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newPassword;
    await user.save();
    return res.json({ message: 'Password reset successful' });

  } catch (err) {
    console.error('Error in /forgot-password/verify:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// Get security question for given email
router.post('/forgot-password/question', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.securityQuestion) {
      return res.status(404).json({ message: 'No security question found for this user.' });
    }

    res.json({ question: user.securityQuestion });
  } catch (err) {
    console.error('Error in /forgot-password/question:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});




// Get all controllers who are not yet approved
router.get('/pending-controllers', protect, adminOnly, async (req, res) => {
  try {
    const pendingControllers = await User.find({ role: 'controller', approved: false });
    res.json(pendingControllers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// POST request to approve a controller
router.post('/approve-controller/:id', protect, adminOnly, async (req, res) => {
  try {
    const controller = await User.findById(req.params.id);

    if (!controller || controller.role !== 'controller') {
      return res.status(404).json({ message: 'Controller not found' });
    }

    controller.approved = true;
    await controller.save();

    res.json({ message: 'Controller approved successfully', controller: {
      id: controller._id,
      name: controller.name,
      email: controller.email,
      approved: controller.approved
    }});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/controllers', protect, adminOnly, async (req, res) => {
  try {
    const controllers = await User.find(
      { role: 'controller', approved: true },
      '_id name email' // return only necessary fields
    );
    res.json(controllers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Reject controller request (delete user)
router.delete('/reject-controller/:id', protect, adminOnly, async (req, res) => {
  try {
    const controller = await User.findById(req.params.id);
    if (!controller || controller.role !== 'controller' || controller.approved) {
      return res.status(404).json({ message: 'Controller not found or already approved' });
    }

    await controller.deleteOne();
    res.json({ message: 'Controller rejected and removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports=router