import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const seceretkey = process.env.SECRET;

export function verifyToken(req, res, next){
    try{
        const token = req.cookies.token;
        if(!token) return res.redirect('/login');
        
        const decoded = jwt.verify(token, seceretkey);
        req.userId = decoded.userId;
        res.locals.userId = decoded.userId;
        next();
    }catch(error){
        console.log("Token verification failed : ", error.messgae);
        return res.redirect('/login');
    }
}
export function checkAuth(req, res, next){
    try{
        const token = req.cookies.token;
        if(!token){
            res.locals.userId = null;
            return next();            
        }
        const decoded = jwt.verify(token, seceretkey);
        res.locals.userId = decoded.userId;
        next(); 
    }catch(error){
        res.locals.userId = null;
        next();
    }
}

