const express = require('express');

const gatekeeper = (req,res,next) => 
{
   if(req.user.roleid===1)
   {
     console.log('gatekeeperonly success');
     next();
   } 
   else
     return res.json({"message":"Gatekeeper only access"}).status(403);
 
}

module.exports = gatekeeper;