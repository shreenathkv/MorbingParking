const express = require('express');
const router = express.Router();
const mysql = require('mysql');


const { dbcreds } = require('../links');

//According to SOLID principle 
//S-> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility

/// api/showrecords protected(only admin/sadmin), fetches the records in the db

function validate(req, res, next) 
{
  if(req.user.roleid!=3 && req.user.roleid!=5)
  {
    return res.json({message:"admin/super-admin only access"}).status(403);
  }  
  else
    next();
}

router.get('/api/showrecords', validate ,async (req, res) => 
{

  // vehicle num, locid to which he's pulling up, the vehicle owner to which they want to pull up is sent
  // Create a MySQL connection
  const db = mysql.createConnection(dbcreds);

  try 
  {
    // Connect to the database


      await new Promise((resolve, reject) => {
        db.connect( (err) => {
        if (err) {
          console.error('Error connecting to MySQL:', err);
          reject(err);
        } else {
          console.log('Connected to DB');
          resolve();
        }
      });
    });


    // Use parameterized query to avoid SQL injection
    // get all the records from db if it's admin or superadmin


    const sql = 'SELECT * FROM parkingrecord';
    const records = await new Promise((resolve, reject) => 
    {
       db.query(sql, (err, results) => 
       {
          if(err) 
            reject(err);
          else
             console.log('Fetched records\n',results);
             resolve(results);

       });  
    });
   
   console.log(records); 
   return res.json({"message":`Successfully fetched the records`,"records":records}).status(200);


  } 
  
  catch (err) 
  {
    // If an error is caught
    console.error('Catch Error:', err);
    return res.status(500).json({ message: 'Some server error: '});
  } 
  
  finally 
  {
    // Close the database connection
    db.end((err) => 
    {
      if (err) 
      {
        console.error('Error closing database connection:', err.message);
      } 
      else 
      {
        console.log('Database connection closed');
      }
    });
  }
});

module.exports = router;