DROP DATABASE IF EXISTS Platform;
create database Platform;
use Platform;

create table User (
    userID int primary key auto_increment,
    username varchar(25) unique not null,
    password varchar(25) not null
);

create table Stocks (
    stockID int primary key auto_increment,
    stockName varchar(25) unique not null,
    unitPrice float
);

create table Transactions (
    transactionID int primary key auto_increment,
    userID int,
    stockName varchar(25),
    units int not null,
    totalValue float,
    foreign key (userID) references User (userID),
    foreign key (stockName) references Stocks (stockName)
);

INSERT INTO Stocks(stockName, unitprice) VALUES
    ('Google', 20),
    ('Uber', 10),
    ('Amazon', 5),
    ('Microsoft', 15);