var express = require('express');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
var mysql = require('mysql');
var bodyparser = require('body-parser');
var app = express();

//connect to database
var db = mysql.createConnection({
    host: 'localhost',
    user:  'root',
    password: 'root',
    database: 'calory_tracker'
});

app.use(bodyparser.urlencoded({
    extended: true
  }));
//connect to database
db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('mysql connected...')
});

//register a new user
app.post('/register', function (req,res){

    var pad = function(num) { return ('00'+num).slice(-2) };
    date = new Date();
    username = req.body.username;
    email = req.body.email;
    password = req.body.password;
    birthday = date.getUTCFullYear()+ '-' +pad(date.getUTCMonth() + 1) + '-' +pad(date.getUTCDate());
    height = req.body.height;
    weight = req.body.weight;
    frequence_activity = req.body.frequence_activity;

    let user = {username:username,email:email,password:password,birthday:birthday,height:height,weight:weight,frequence_activity:frequence_activity};
    let sql = 'INSERT INTO user SET ?'

    let researchSql = `SELECT COUNT(*) AS idCount FROM user WHERE username = "${username}"`;
        db.query(researchSql,(error,results) => {
            if(error) throw error;
            if(results[0].idCount == 0){
                db.query(sql, user, (err,result) => {
                    if(err) throw err;
                    
                        console.log(result);
                        res.send('User added');

                  })
            } else {
                res.send('username already exist')
            }
        });

    
});
//login
app.get('/login', function(req,res){
    username = req.body.username;
    password = req.body.password;

    let researchSql = `SELECT COUNT(*) as idCount FROM user WHERE username = "${username}"`;
    db.query(researchSql,(error,results) => {
        if(error) throw error;
        if(results[0].idCount == 0){
            res.send('wrong username');
        } else {
            let selctSql = `SELECT password FROM user WHERE username = "${username}"`;
            db.query(selctSql,(error,results) => {
                if(results[0].password == password){
                    res.send("to home")
                } else {
                    res.send("wrong password");
                }
            
            })
        }
    });

});

app.listen(3000, function() {
    console.log('app listening on port 3000');
});





//encrypt and decrypt function for password
function encrypt(text) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
   }
   
   function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
   }