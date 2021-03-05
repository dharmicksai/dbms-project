var mysql = require('mysql2');

var dbms = mysql.createConnection({
    host: "localhost",
    user: "admin",
    password: "admin",
    database: "portfolio"
});

dbms.connect((err) => {
    dbms.query("select * from user", (result) => {
        if(err) throw err;
        console.log(">> Successfully connected to Portfolio Database");
    });
});

//Till here was just connecting to database portfolio

var express = require('express');
var bp = require('body-parser');
var getJSON = require('get-json');
var path = require('path');
var app = express();
var activeUsers = {};

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('index')
});

app.get('/login', (req, res) => {
    res.render('login', {message: "", username: ""})
});

app.post('/login', (req, res) => {
    var query = "select userID, password from user where username = \"" + req.body.username + "\";";
    dbms.query(query, (err, result, fields) => {
        if(err) throw err;

        if(result.length == 0) {
            res.render('login', {message: "Invalid Username", username: req.body.username})
        }
        else if(req.body.password != result[0].password) {
            res.render('login', {message: "Wrong Password", username: req.body.username});
        }
        else {
            activeUsers[req.socket.remoteAddress] = result[0].username;
            res.redirect('/profile');
        }
    });
})

app.get('/register', (req, res) => {
    res.render('register', {message: "", username: ""});
});

app.post('/register', (req, res) => {
    var query = "select username from user where username = \"" + req.body.username + "\";";
    dbms.query(query, (err, result, fields) => {
        if(err) throw err;

        if(result.length == 1) {
            res.render('register', {message: "Username Exists", username: req.body.username});
        }
        else if(req.body.username == "") {
            res.render('register', {message: "Username Empty", username: req.body.username});
        }
        else if(req.body.password != req.body.confirm_password) {
            res.render('register', {message: "Passwords are different", username: req.body.username});
        }
        else {
            var new_record = "INSERT INTO user(username, password)" + 
                " VALUES(\"" + req.body.username + "\", \"" + req.body.password + "\");";

            dbms.query(new_record, (err, result, fields) => {
                if(err) throw err;

                var findID = "SELECT * from user WHERE username=\"" + req.body.username + "\";";
                dbms.query(findID, (err, result, fields) => {
                    if(err) throw err;

                    activeUsers[req.socket.remoteAddress] = result[0].userID;
                    res.redirect('/profile');
                });
            });
        }
    });
});

app.get('/profile', (req, res) => {
    res.render('profile')
});

app.get('/buy', (req, res) => {
    res.render('buy')
});

app.get('/sell', (req, res) => {
    res.render('sell')
});

app.listen(4007, () => {
    console.log('server started on port 4007')
});