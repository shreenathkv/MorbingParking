const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'basedhottakes@gmail.com',
    pass: 'umnw anor aeqs sqtc',
  },
});

// template function for gmailing

async function gmailer(recipientEmail, sub, txt) {
  const mailOptions = {
    from: 'basedhottakes@gmail.com',
    to: recipientEmail,
    subject: `${sub}`,
    text: `${txt}`,
  };

  try 
  {
    const info = await transporter.sendMail(mailOptions);
    console.log('email sent:', info.response);
    return true;
  } 
  catch 
  (error) 
  {
    console.error('Error sending gmail:', error);
    return false;
  }
}

module.exports = { gmailer };
