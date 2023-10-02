const jwt = require('jsonwebtoken');
const {secretkey} =  require('../backend/links');

const authenticateToken = (req, res, next) => {
const token = req.headers.authorization;


  if (!token) 
  { console.log("Missing token");
    return res.status(401).json({ error: 'Access denied. Token missing.' });
  }

  jwt.verify(token, secretkey, (err, user) => {
    if (err) 
    {
      console.log("Token ver failed");
      console.log(err)
      return res.status(403).json({ error: 'Token verification failed.' });
    }
    req.user = user; // Decoded payload of JWT(as of now payload consists of userid)
    console.log("auth success",user);
    next(); // Call next to pass control to the next middleware or route handler
  });
  
};

module.exports = authenticateToken;