var express = require('express');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
var mysql = require('mysql');
var bodyparser = require('body-parser');
var morgan = require('morgan');
var cors = require("cors");
var app = express();
app.use(cors());
app.use('*', cors());
app.use(morgan('dev'));
var PORT =3000;
var connection;

calc_BMR(85, 183, 'female', 26, 1.2);
//connect to database
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'calory_tracker'
});

app.use(bodyparser.urlencoded({
    extended: true
}));

//connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('mysql connected...')
});
//register a new user
app.post('/register', function (req, res) {

    var pad = function (num) { return ('00' + num).slice(-2) };
    date = new Date();
    username = req.body.username;
    email = req.body.email;
    password = req.body.password;
    birthday = date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate());
    height = req.body.height;
    weight = req.body.weight;
    frequence_activity = req.body.frequence_activity;

    let user = { username: username, email: email, password: password, birthday: birthday, height: height, weight: weight, frequence_activity: frequence_activity };
    let sql = 'INSERT INTO user SET ?'

    let researchSql = `SELECT COUNT(*) AS idCount FROM user WHERE username = "${username}"`;
    db.query(researchSql, (error, results) => {
        if (error) throw error;
        if (results[0].idCount == 0) {
            db.query(sql, user, (err, result) => {
                if (err) throw err;
                let selctSql = `SELECT * FROM user WHERE id = "${result.insertId}"`;
                db.query(selctSql, (error, results) => {
                    if (results[0]) {
                        var user = results[0];
                        res.status(200).send(results[0]);
                    } else {
                        res.status(400).send("Oops :( ");
                    }

                })
                console.log(result);
            })
        } else {
            res.send('username already exist')
        }
    });


});

//Calculate BMR
app.get('/calculate_bmr', function (req, res) { 
    var weight = req.body.weight;
    var height = req.body.height;
    var age = req.body.age;
    var gender = req.body.gender;
    var frequence_activity = req.body.frequence_activity;
    
    res.status(200).send({'bmr': calc_BMR(weight, height, gender,age, frequence_activity)});

});
//Calculate BMI
app.get('/calculate_bmi', function (req, res) { 
    var weight = req.body.weight;
    var height = req.body.height;
    
    res.status(200).send(calc_BMI(weight, height));

});

//login
app.post('/login', function (req, res) {
    username = req.body.username;
    password = req.body.password;

    let researchSql = `SELECT COUNT(*) as idCount FROM user WHERE username = "${username}"`;
    db.query(researchSql, (error, results) => {
        if (error) throw error;
        if (results[0].idCount == 0) {
            res.send('wrong username');
        } else {
            let selctSql = `SELECT * FROM user WHERE username = "${username}"`;
            db.query(selctSql, (error, results) => {
                if (results[0].password == password) {
                    var user = results[0];
                    res.status(200).send(results[0]);
                } else {
                    res.status(400).send("wrong password");
                }

            })
        }
    });

});

app.get('*', function (req, res) {
    res.send({ 'message': 'Hello there !' });

});

app.listen(PORT, function () {
    console.log('app listening on port ' + PORT);
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


function handleDisconnect() {
    connection = mysql.createConnection(db); // Recreate the connection, since
    // the old one cannot be reused.

    connection.connect(function (err) {              // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

function calc_BMR (weight, height, gender, age, frequence_activity){    
    var gender_value = 5;
    if(gender == "female"){
        gender_value = 116;
    }
    var bmr = (weight * 10) + (6.25 * 185) - (age *5) +gender_value;
    var final_bmr = bmr * frequence_activity
    console.log(final_bmr);
    return final_bmr;
}
// this is a test
function calc_BMI(w, h) {

    var s;

    hm = h/100;
    t  = w/(hm*hm);
    console.log(t);

    if(t>40){
        s =  'Very severely obese';
    }
    if(t<40 && t>35){
        s =  'Severely obese';
    }
    if(t<35 && t>30){
        s = 'Moderately obese';
    }
    if(t<30 && t>25){
        s = 'Overweight';
    }
    if(t<25 && t>18.5){
        s = 'Normal (healthy weight)';
    }
    if(t<18.5 && t>16){
        s = 'Underweight';
    }
    if(t<16 && t>15){
        s = 'Severely Underweight';
    }
    if(t<15){
        s = 'Very Severely Underweight';
    }
    var output = 'Your BMI is ' + t.toFixed(2) + ' ' + s;
    var final_bmi = {'bmi': t.toFixed(2), 'message': output}

    return final_bmi;
  
}