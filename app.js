var mysql = require('mysql2');

var dbms = mysql.createConnection({
    host: "localhost",
    user: "admin",
    password: "admin", // Change password for you!!!
    database: "Platform",
    dateStrings: 'date'
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
var logger = require('morgan');
var bp = require('body-parser');
var getJSON = require('get-json');
var path = require('path');
const { writer } = require('repl');
const { query } = require('express');
var app = express();
var activeUsers = {};

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(logger('dev'));


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
            activeUsers[result[0].userID] = req.socket.remoteAddress;
            var travel;
            if(result[0].userID == 1) {
                travel = '/control';
            }
            else {
                travel = '/profile/' + result[0].userID;
            }
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
                    
                    activeUsers[result[0].userID] = req.socket.remoteAddress;
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
    if(activeUsers[key] == undefined) {
        return res.redirect('/login');
    }

    //  VERY VERY IMPORTANT QUERY
    var findID = "with UserStocks(userID,units,stockname) as ( SELECT userID, units,stockname from Transactions natural join User having userID = "+key+") select sum(units)as num_stocks , sum(units)*unitprice as stocksworth,stockname from UserStocks natural join Stocks  group by stockname ;";
    var username ;
    var find_user = "SELECT username from User WHERE userID = " + key + ";"
    dbms.query(find_user , (err,result,feilds)=>{
        if(err) throw err;
        username = result[0].username;
    });
    
    dbms.query(findID, (err, result, fields) => {
        if(err) throw err;
        // console.log(result[0].stockname);

        res.render('profile', {username: username,shares:result, key: key});
    });

});


app.get('/buy/:id', (req, res) => {
    //console.log(req.params.id);
    var key = req.params.id;
    if(activeUsers[key] == undefined) {
        return res.redirect('/login');
    }

    var findID = "SELECT * from User WHERE userID = " + key + ";";

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

        res.render('buy', {userID: userID, username: username, stocks: stocks, statusMessage: ""});
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

    var stockQuery = 
        `SELECT * FROM Stocks
            WHERE stockID = ${chosenStockID};`;

    dbms.query(stockQuery, (err, result, fields) =>{
        if(err) throw err;

        totalPrice = sharesBought*result[0].unitPrice;
        stockName = result[0].stockName;
        var insertQuery = 
            `INSERT INTO Transactions(userID,stockName,units,totalValue,transacted) VALUES
                (${userID}, '${stockName}', ${sharesBought}, ${totalPrice}, NOW());`;
        
        dbms.query(insertQuery, (err2, result2, fields2)=>{ // inserting tuple into transactions
            if(err2) throw err2;
        });

        var allStocksQuery = 'SELECT * FROM Stocks;';
        dbms.query(allStocksQuery, (err2, result2, fields) =>{
            if(err2) throw err2;
            statusMessage = `${sharesBought} Shares of ${stockName} worth ${totalPrice} USD Successfully Bought!`;
            res.render('buy', {userID: userID, username: username, stocks: result2, statusMessage: statusMessage});
        });
    });
 });
 

 app.get('/sell/:id', (req, res) => {
    //console.log(req.params.id);
    var key = req.params.id;
    if(activeUsers[key] == undefined) {
        return res.redirect('/login');
    }

    var findID = "SELECT * from User WHERE userID = " + key + ";";

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
        res.render('sell', {userID: userID, username: username, stocks: stocks, statusMessage: ""});
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

    var allStocksQuery = `SELECT * FROM Stocks;`;
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
            //console.log(sumOfShares);
            //console.log(result2);
            //console.log(sumOfSharesQuery);
            if(err2) throw err2;
            var sumOfShares = parseInt(result2[0].sum);

            
            if(isNaN(sumOfShares)  || sumOfShares < sharesSold){ // 0 stocks or less than required
                statusMessage = `You do not have so many stocks to sell. Try again`;
                
                dbms.query(allStocksQuery, (err3, result3, fields3) => { // showing drop down menu
                    if(err3) throw err3;
                    
                    res.render('sell', {userID: userID, username: username, stocks: result3, statusMessage: statusMessage});
                });
                return;
            }

            var insertQuery = 
                `INSERT INTO Transactions(userID,stockName,units,totalValue,transacted) VALUES
                    (${userID}, '${stockName}', -${sharesSold}, -${totalPrice}, NOW());`; // 2 '-' to indicate minus
            
            dbms.query(insertQuery, (err3, result3, fields3)=>{ // inserting tuple into transactions
                if(err3) throw err3;
            });

           
            dbms.query(allStocksQuery, (err3, result3, fields3) => { // showing drop down menu
                if(err3) throw err3;
                
                statusMessage = `${sharesSold} Shares of ${stockName} worth ${totalPrice} USD Successfully Sold!`;
                res.render('sell', {userID: userID, username: username, stocks: result3, statusMessage: statusMessage});
            });
        });
    });
 });
 

app.get('/quote/:id', (req, res) => {
    //console.log(req.params.id);
    var key = parseInt(req.params.id);
    if(activeUsers[key] == undefined) {
        return res.redirect('/login');
    }

    var findID = "SELECT * from Stocks;";

    dbms.query(findID, (err, result, fields) => {
        if(err) throw err;

        res.render('quote', {key: key, inc: "",unitprice: "", shares: result});
    });
});


app.post('/quote/:id', (req, res) => {
    var query = "SELECT unitprice from Stocks where stockname = \"" + req.body.chosenStockName + "\";";
    var key = parseInt(req.params.id);
    var quantity = parseInt(req.body.stockUnits);
    var inc = req.body.chosenStockName;

    dbms.query(query, (err, result, fields) => {
        if(err) throw err;
        //console.log(result);

        var stockPrice = "select * from StockPrice where stockName = \"" + req.body.chosenStockName +"\" order by time DESC;";

        dbms.query(stockPrice , (err , stockPrices , feilds)=>{

            var findID = "SELECT * from Stocks;";
            console.log(stockPrices);
            dbms.query(findID, (err, answer, fields) => {
                if(err) throw err;

                res.render('quote', {key: key, quantity: quantity, price: result[0].unitprice, inc: inc, shares: answer , sharePrize:stockPrices});
            });
        })
        
    });
})


app.get('/history/:id', (req, res) => {
    //console.log(req.params.id);
    var key = parseInt(req.params.id);
    if(activeUsers[key] == undefined) {
        return res.redirect('/login');
    }

    var findID = "SELECT * from User WHERE userID = " + key + ";";

    dbms.query(findID, (err, result, fields) => {
        if(err) throw err;

        var username = result[0].username;
        var userHistory = "SELECT * from Transactions where userID = " + key + " ORDER BY transactionID DESC LIMIT 5;";

        dbms.query(userHistory, (err, result, fields) => {
            if(err) throw err;
           
            res.render('history', {data: result, username: username, key: key});
        });
    });
});


app.get('/watchlist/:id', (req, res) => {
    var key = parseInt(req.params.id);
    if(activeUsers[key] == undefined) {
        return res.redirect('/login');
    }

    var query = "SELECT stockname, unitPrice from WatchList inner join Stocks using (stockName) where userID = " + key + ";";
    var findID = "SELECT * from Stocks;";

    dbms.query(query, (err, result, field) => {
        if (err) throw err;

        dbms.query(findID, (err, answer, field) => {
            if (err) throw err;
            
            res.render('watchlist', {key: key, shares: answer, data: result});
        });
    });
})


app.post('/watchlist/:id', (req, res) => {
    var op = req.body.operation;
    var inc = req.body.chosenStockName;
    var key = parseInt(req.params.id);

    var change;
    if(op == "ADD"){
        change = `INSERT into WatchList (userID, stockName) values (${key}, '${inc}');`;
    } else if(op == "REMOVE"){
        change = `DELETE from WatchList where userID = ${key} and stockName = '${inc}';`;
    }

    if(op == "ADD" || op == "REMOVE"){
        dbms.query(change, (err, answer, field) => {
            if (err) throw err;
        });
    }

    var query = "SELECT stockname, unitPrice from WatchList inner join Stocks using (stockName) where userID = " + key + ";";
    var findID = "SELECT * from Stocks;";

    dbms.query(query, (err, result, field) => {
        if (err) throw err;

        dbms.query(findID, (err, answer, field) => {
            if (err) throw err;
            
            res.render('watchlist', {key: key, shares: answer, data: result});
        });
    });
})


app.get('/logout/:id', (req, res) => {
    var key = parseInt(req.params.id);
    activeUsers[key] = undefined;
    res.redirect('/')
})


app.get('/control', (req, res) => {
    find = "SELECT * from Stocks;";

    dbms.query(find, (err, result, fields) => {
        if(err) throw err;

        res.render('control', {data: result});
    });
})


app.get('/update', (req, res) => {
    find = "SELECT * from Stocks;";

    dbms.query(find, (err, result, fields) => {
        if(err) throw err;

        res.render('update', {data: result});
    });
})


app.post('/update', (req, res) => {
    var inc = req.body.chosenStockName;
    var value = parseInt(req.body.sharePrice);

    

    q2 = `UPDATE Stocks set unitPrice = ${value} where stockName = '${inc}';`;
    console.log(q2);
    dbms.query(q2, (err, result, fields) => {
        if (err) throw err;

        q1 = `Insert into StockPrice (stockName, time, Price) values ('${inc}',NOW(), ${value})`;

        dbms.query(q1, (err, result, fields) => {
            if (err) throw err;
        });

        find = "SELECT * from Stocks;";

        dbms.query(find, (err, answer, field) => {
            if(err) throw err;

            res.render('update', {data: answer});
        });
    });
})


app.get('/add', (req, res) => {
    res.render('add');
})


app.post('/add', (req, res) => {
    var inc = req.body.symbol;
    var val = parseInt(req.body.shares);
    q2 = `INSERT into Stocks (stockName, unitPrice) values ('${inc}', ${val});`;

    dbms.query(q2, (err, result, fields) => {
        if (err) throw err;
        q1 = `Insert into StockPrice (stockName, time, Price) values ('${inc}',NOW(), ${val})`;

        dbms.query(q1, (err, result, fields) => {
            if (err) throw err;
        });
        res.render('add');
    });
})


app.listen(4007, () => {
    console.log('server started on port 4007')
});