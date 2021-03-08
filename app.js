var mysql = require('mysql2');

var dbms = mysql.createConnection({
    host: "localhost",
    user: "admin",
    password: "admin",
    database: "Platform"
});

dbms.connect((err) => {
    //trial query to check connection
    dbms.query("select * from User", (result) => {
        if(err) throw err;
        console.log(">> Successfully connected to Platform Database");
    });
});

//Till here was just connecting to database portfolio

var express = require('express');
var bp = require('body-parser');
var getJSON = require('get-json');
var path = require('path');
var app = express();

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
    var query = "select userID, password from User where username = \"" + req.body.username + "\";";
    dbms.query(query, (err, result, fields) => {
        if(err) throw err;

        if(result.length == 0) {
            res.render('login', {message: "Invalid Username", username: req.body.username})
        }
        else if(req.body.password != result[0].password) {
            res.render('login', {message: "Wrong Password", username: req.body.username});
        }
        else {
            var travel = '/profile/' + result[0].userID;
            res.redirect(travel);
        }
    });
})

app.get('/register', (req, res) => {
    res.render('register', {message: "", username: ""});
});

app.post('/register', (req, res) => {
    var query = "select username from User where username = \"" + req.body.username + "\";";
    dbms.query(query, (err, result, fields) => {
        if(err) throw err;

        if(result.length == 1) {
            res.render('register', {message: "Username Exists", username: req.body.username});
        }
        else if(req.body.username == "") {
            res.render('register', {message: "Username Empty", username: req.body.username});
        }
        else if(req.body.password == "") {
            res.render('register', {message: "Password Empty", username: req.body.username});
        }
        else if(req.body.password != req.body.confirm_password) {
            res.render('register', {message: "Passwords are different", username: req.body.username});
        }
        else {
            var new_record = "INSERT INTO User(username, password)" + 
                " VALUES(\"" + req.body.username + "\", \"" + req.body.password + "\");";

            dbms.query(new_record, (err, result, fields) => {
                if(err) throw err;

                var findID = "SELECT * from User WHERE username=\"" + req.body.username + "\";";
                dbms.query(findID, (err, result, fields) => {
                    if(err) throw err;

                    var travel = '/profile/' + result[0].userID;
                    res.redirect(travel);
                });
            });
        }
    });
});

app.get('/profile/:id', (req, res) => {
    //console.log(req.params.id);
    var key = parseInt(req.params.id);
    var findID = "SELECT * from User WHERE userID = " + key + ";";

    dbms.query(findID, (err, result, fields) => {
        if(err) throw err;

        var link1 = '/profile/' + key;
        var link2 = '/buy/' + key;
        var link3 = '/sell/' + key;
        var link4 = '/quote/' + key;
        var link5 = '/history/' + key;
        res.render('profile', {username: result[0].username, link1: link1, link2: link2, 
            link3: link3, link4: link4, link5: link5});
    });

});

app.get('/buy/:id', (req, res) => {
    //console.log(req.params.id);
    var key = parseInt(req.params.id);
    var findID = "SELECT * from User WHERE userID = " + key + ";";

    dbms.query(findID, (err, result, fields) => {
        if(err) throw err;

        var link1 = '/profile/' + key;
        var link2 = '/buy/' + key;
        var link3 = '/sell/' + key;
        var link4 = '/quote/' + key;
        var link5 = '/history/' + key;
        res.render('buy', {username: result[0].username, link1: link1, link2: link2, 
            link3: link3, link4: link4, link5: link5});
    });
});

app.get('/sell/:id', (req, res) => {
    //console.log(req.params.id);
    var key = parseInt(req.params.id);
    var findID = "SELECT * from User WHERE userID = " + key + ";";

    dbms.query(findID, (err, result, fields) => {
        if(err) throw err;

        var link1 = '/profile/' + key;
        var link2 = '/buy/' + key;
        var link3 = '/sell/' + key;
        var link4 = '/quote/' + key;
        var link5 = '/history/' + key;
        res.render('sell', {username: result[0].username, link1: link1, link2: link2, 
            link3: link3, link4: link4, link5: link5});
    });
});

app.get('/quote/:id', (req, res) => {
    //console.log(req.params.id);
    var key = parseInt(req.params.id);
    var findID = "SELECT * from User WHERE userID = " + key + ";";

    dbms.query(findID, (err, result, fields) => {
        if(err) throw err;

        var link1 = '/profile/' + key;
        var link2 = '/buy/' + key;
        var link3 = '/sell/' + key;
        var link4 = '/quote/' + key;
        var link5 = '/history/' + key;
        res.render('quote', {inc: "",unitprice: "", link1: link1, link2: link2, 
            link3: link3, link4: link4, link5: link5});
    });
});

app.post('/quote/:id', (req, res) => {
    var query = "SELECT unitprice from Stocks where stockname = \"" + req.body.stockname + "\";";
    var key = parseInt(req.params.id);

    dbms.query(query, (err, result, fields) => {
        if(err) throw err;
        //console.log(result);
        var link1 = '/profile/' + key;
        var link2 = '/buy/' + key;
        var link3 = '/sell/' + key;
        var link4 = '/quote/' + key;
        var link5 = '/history/' + key;
        res.render('quote', {link1: link1, link2: link2, link3: link3, 
            link4: link4, link5: link5, price: result[0].unitprice, inc: req.body.stockname});
    });
})

app.get('/history/:id', (req, res) => {
    //console.log(req.params.id);
    var key = parseInt(req.params.id);
    var findID = "SELECT * from User WHERE userID = " + key + ";";

    dbms.query(findID, (err, result, fields) => {
        if(err) throw err;

        var username = result[0].username;
        var link1 = '/profile/' + key;
        var link2 = '/buy/' + key;
        var link3 = '/sell/' + key;
        var link4 = '/quote/' + key;
        var link5 = '/history/' + key;

        var userhistory = "SELECT * from Transactions where userID = " + key + ";";

        dbms.query(userhistory, (err, result, fields) => {
            if(err) throw err;
            console.log(result);
            res.render('history', {data: result, username: username, link1: link1, link2: link2, 
                link3: link3, link4: link4, link5: link5});
        });
    });
});

app.get('/logout', (req, res) => {
    res.redirect('/')
})

app.listen(4007, () => {
    console.log('server started on port 4007')
});