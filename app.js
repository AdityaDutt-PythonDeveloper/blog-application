import express from 'express';
import mongoose from 'mongoose';
import post from './models/post.js';
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import User from './models/User.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import {verifyToken, checkAuth} from './middleware/auth.js';

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGDB_URI);
console.log('DB connection Successful');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(checkAuth);

app.get('/', async(req, res)=>{
    // res.send('<h1>HomePage</h1>')
    // let data = {
    //     name:'Aditya Dutt',
    //     description:"Blog Application",
    //     role: "developer"
    // };
    try{
        let newPost = await post.find({}, 'title content');
        res.render('index', {newPost});
    }
    catch(error){
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
    
});

app.get('/create',verifyToken, (req, res)=>{
    res.render('create');
})


app.post('/submit', verifyToken, async (req, res)=>{
    try{
        // req.body has form data this is possible due to express.urlencoded
        const { title, content } = req.body;

        // create a new user
        const newPost = new post(
            {
                title,
                content,
                user: req.userId,                
            }
        );
        await newPost.save();
        console.log('New User created..')
        res.redirect('/');
    }catch(error){
        console.log(error);
        res.status(500).send('Error saving Post')
    }

});

app.get('/edit/:id', async (req, res) => {
    try{
        const singlePost = await post.findById(req.params.id);
        res.render('edit', {post:singlePost});
    }catch(error){
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/edit/:id', async (req, res)=>{
    try{
        const {title, content} = req.body;
        await post.findByIdAndUpdate(req.params.id, {title, content});
        res.redirect('/')
    }catch(error){
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
})

app.post('/delete/:id', async (req, res)=>{
    try{
    const deletedItem = await post.findByIdAndDelete(req.params.id);

    if(!deletedItem) return res.status(404).send('<h2>Item not found</h2>')
    res.redirect('/');
    }catch(error){
        res.status(500).send('Internal Server error')
    }
});

app.get('/signup', (req, res)=>{
    res.render('signup');
});

app.post('/signup', async (req, res)=>{
    try{
        const {username, email, password} = req.body;

        //check whether email already exists
        const existingUser = await User.findOne({email});
        if(existingUser) return res.send('User Already exist');

        const hashedPassword = await bcrypt.hash(password, 10);

        //creating new user
        const newUser = new User(
            {
                username,
                email,
                password:hashedPassword
            }
        )
        await newUser.save();
        res.redirect('/')
    }catch(error){
        console.log('error');
        res.status(500).send('Error in signing up!');
    }
});


app.get('/login', (req, res)=>{
    res.render('login');
});

app.post('/login', async (req, res)=>{
    try{
        const { email, password } = req.body;

        const user = await User.findOne({email});
        if(!user) return res.send('User not found');

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.send('Invalid username or password');

        // create a session
        const token = jwt.sign(
            {userId:user._id},
            process.env.SECRET,
            {expiresIn:"1h"}
        );
        res.cookie('token',token, {
            httpOnly:true,
            secure:process.env.NODE_ENV==="production", 
        });
        res.redirect('/');
    }catch(error){
        console.log(error);
        res.status(500).send('Login Error')
    }
});

app.get('/logout', (req, res)=>{
    res.clearCookie('token');
    res.redirect('/');
});

app.listen(port, ()=>{
    console.log(`Server is running on : http://localhost:${port}`);
});
