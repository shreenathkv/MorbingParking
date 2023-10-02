const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// middlewares
const auth = require('../middleware/auth');
const gatekeeper = require('../middleware/gatekeeperonly');
// authpack
const login = require('./authpack/login');
const register = require('./authpack/register'); 
const forgotpw = require('./authpack/forgotpw');
const updatepw = require('./authpack/updatepw');
// routes
const checkvn = require('./routes/checkvn');
const recordpark = require('./routes/recordpark');
const showrecords = require('./routes/showrecords');
const completerecord = require('./routes/completerecord');
const updatespots = require('./routes/updatespots');
const showparkingstatus = require('./routes/showparkingstatus');

/*
const admincontrol = require('./routes/admincontrol');
*/

app.use(register); // unprotected endpoint

app.use(login); // unprotected end point

app.use(forgotpw); // unprotected end point

app.use(auth);  // common auth middleware

app.use(updatepw); // any authenticated user can update his password 

app.use(showparkingstatus); // to see the status of the parking lot from top view

app.use(checkvn); // let this be accessible to any user 1,2,3,4, or 5.

app.use(showrecords); // only accessible to admin/superadmin

app.use(gatekeeper); // allows only 1

app.use(recordpark); // let this be accessible to only 1

app.use(completerecord); // let this be accessible to only 1

app.use(updatespots); // let this be accessible to only 1

// this is an important function binds port to the http listener, and then callback is executed
// until then other parts of the code are exected

app.listen(port,() => {
    console.log(`Server is running on http://localhost:${port}`);
})

console.log("Hello there");