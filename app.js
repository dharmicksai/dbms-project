var mysql = require('mysql2');

var dbms = mysql.createConnection({
    host: "localhost",
    user: "admin",
    password: "!23Admin", // Change password for you!!!
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
const { writer } = require('repl');
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
    var key = req.params.id;
    var findID = "SELECT * from User WHERE userID = " + key + ";";
    var link1 = '/profile/' + key;
    var link2 = '/buy/' + key;
    var link3 = '/sell/' + key;
    var link4 = '/quote/' + key;
    var link5 = '/history/' + key;
    var userID = key;
    var stocks, username, userID;
    dbms.query(findID, (err, result, fields) => { // showing profile page
        if(err) throw err;
        username = result[0].username;
    });

    var stocksQuery = 'SELECT * FROM Stocks;';
    dbms.query(stocksQuery, (err, result, fields) => { // showing drop down menu
        if(err) throw err;
        stocks = result;
        res.render('buy', {userID: userID, username: username, link1: link1, link2: link2, 
            link3: link3, link4: link4, link5: link5, stocks: stocks, statusMessage: ""});
    });
});
app.post('/buy/:id', (req, res) =>{
    // req.body object has your form values
    var key = req.params.id;

    if(isNaN(parseInt(req.body.sharesBought))){ // no option was selected
        res.redirect('/buy/' + key);
        return;
    }

    var sharesBought = parseInt(req.body.sharesBought);
    var chosenStockID = parseInt(req.body.chosenStockID);
    
    var userID = parseInt(req.params.id);
    var stockName, totalPrice;
    var statusMessage = "";
    var username = req.body.username;
    var link1 = '/profile/' + key;
    var link2 = '/buy/' + key;
    var link3 = '/sell/' + key;
    var link4 = '/quote/' + key;
    var link5 = '/history/' + key;

    var stockQuery = 
        `SELECT * FROM Stocks
            WHERE stockID = ${chosenStockID};`;

    dbms.query(stockQuery, (err, result, fields) =>{
        if(err) throw err;

        totalPrice = sharesBought*result[0].unitPrice;
        stockName = result[0].stockName;
        var insertQuery = 
            `INSERT INTO Transactions(userID,stockName,units,totalValue) VALUES
                (${userID}, '${stockName}',${sharesBought}, ${totalPrice});`;
        
        dbms.query(insertQuery, (err2, result2, fields2)=>{ // inserting tuple into transactions
            if(err2) throw err2;
        });

        var allStocksQuery = 'SELECT * FROM Stocks;';
        dbms.query(allStocksQuery, (err2, result2, fields) =>{
            if(err2) throw err2;
            statusMessage = `${sharesBought} Shares of ${stockName} worth ${totalPrice} USD Successfully Bought!`;
            res.render('buy', {userID: userID, username: username, link1: link1, link2: link2, 
                link3: link3, link4: link4, link5: link5, stocks: result2, statusMessage: statusMessage});
        });
    });
 });
 

 app.get('/sell/:id', (req, res) => {
    //console.log(req.params.id);
    var key = req.params.id;
    var findID = "SELECT * from User WHERE userID = " + key + ";";
    var link1 = '/profile/' + key;
    var link2 = '/buy/' + key;
    var link3 = '/sell/' + key;
    var link4 = '/quote/' + key;
    var link5 = '/history/' + key;
    var userID = key;
    var stocks, username, userID;
    dbms.query(findID, (err, result, fields) => { // showing profile page
        if(err) throw err;
        username = result[0].username;
    });

    var stocksQuery = 'SELECT * FROM Stocks;';
    dbms.query(stocksQuery, (err, result, fields) => { // showing drop down menu
        if(err) throw err;
        stocks = result;
        res.render('sell', {userID: userID, username: username, link1: link1, link2: link2, 
            link3: link3, link4: link4, link5: link5, stocks: stocks, statusMessage: ""});
    });
});
app.post('/sell/:id', (req, res) =>{
    // req.body object has your form values
    var key = req.params.id;

    if(isNaN(parseInt(req.body.sharesSold))){ // no option was selected
        res.redirect('/sell/' + key);
        return;
    }

    var sharesSold = parseInt(req.body.sharesSold);
    var chosenStockID = parseInt(req.body.chosenStockID);
    
    var userID = parseInt(req.params.id);
    var stockName, totalPrice;
    var statusMessage = "";
    var username = req.body.username;
    var link1 = '/profile/' + key;
    var link2 = '/buy/' + key;
    var link3 = '/sell/' + key;
    var link4 = '/quote/' + key;
    var link5 = '/history/' + key;

    var stockQuery = 
        `SELECT * FROM Stocks
            WHERE stockID = ${chosenStockID};`;
    

    dbms.query(stockQuery, (err, result, fields) =>{
        if(err) throw err;

        totalPrice = sharesSold*result[0].unitPrice;
        stockName = result[0].stockName;

        var sumOfSharesQuery = 
        `SELECT SUM(units) as sum FROM Transactions 
            WHERE userID = ${userID} AND stockName = '${stockName}';`;

        dbms.query(sumOfSharesQuery, (err2, result2, fields2) =>{
            console.log(sumOfShares);
            console.log(result2);
            console.log(sumOfSharesQuery);
            if(err2) throw err2;
            var sumOfShares = parseInt(result2[0].sum);

            
            if(isNaN(sumOfShares)  || sumOfShares < sharesSold){ // 0 stocks or less than required
                statusMessage = `You do not have so many stocks to sell. Try again`;
                res.render('sell', {userID: userID, username: username, link1: link1, link2: link2, 
                    link3: link3, link4: link4, link5: link5, stocks: result, statusMessage: statusMessage});
                return;
            }

            var insertQuery = 
                `INSERT INTO Transactions(userID,stockName,units,totalValue) VALUES
                    (${userID}, '${stockName}', -${sharesSold}, -${totalPrice});`; // 2 '-' to indicate minus
            
            dbms.query(insertQuery, (err3, result3, fields3)=>{ // inserthing tuple into transactions
                if(err3) throw err3;
            });

            var allStocksQuery = `SELECT * FROM Stocks;`;
            dbms.query(allStocksQuery, (err3, result3, fields3) => { // showing drop down menu
                if(err3) throw err3;
                
                statusMessage = `${sharesSold} Shares of ${stockName} worth ${totalPrice} USD Successfully Sold!`;
                res.render('sell', {userID: userID, username: username, link1: link1, link2: link2, 
                    link3: link3, link4: link4, link5: link5, stocks: result3, statusMessage: statusMessage});
            });
    });
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
        res.render('quote', {username: result[0].username, link1: link1, link2: link2, 
            link3: link3, link4: link4, link5: link5});
    });
});

app.get('/history/:id', (req, res) => {
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
        res.render('history', {username: result[0].username, link1: link1, link2: link2, 
            link3: link3, link4: link4, link5: link5});
    });
});

app.get('/logout', (req, res) => {
    res.redirect('/')
})

app.listen(4007, () => {
    console.log('server started on port 4007')
});