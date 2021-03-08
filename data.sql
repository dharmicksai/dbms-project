create database Platform;
use Platform;

create table User (
    userID int primary key auto_increment,
    username varchar(25) unique not null,
    password varchar(25) not null
);

create table Stocks (
    stockID int primary key auto_increment,
    stockname varchar(25) unique not null,
    unitprice float
);

create table Transactions (
    transactionID int primary key auto_increment,
    userID int,
    stockname varchar(25),
    units int not null,
    total_value float,
    foreign key (userID) references User (userID),
    foreign key (stockname) references Stocks (stockname)
);

create table Market(
    stockname varchar(25) ,
    userID int,
    numShares int not null , 
    constraint market_prim primary key (stockname,userID), 
    foreign key (stockname) references Stocks(stockname),
    foreign key (userID)  references User(userID));


