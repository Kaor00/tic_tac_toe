const express = require('express'); // добавляем библотеку для создания сервера
const path = require('path'); // добавляем библиотеку для работы с дирректориями
const http = require('http'); // добавляем библиотеку для создания сервера
const WebSocket = require('ws'); // добавляем библиотеку для создания взаимодействий
const favicon = require('serve-favicon'); // добавляем библиотеку фавикона
const bodyParser = require('body-parser'); // добавляем библиотеку для чтения json файлов

// ----------------------------подключаем вынесенные функции
const writeWinners = require('./lib/writeWinners') // записываем победителей во внешний файл
const getterChampions = require('./lib/getterChampions.js') // Отдаем список лучших игроков клиенту
const connectors = require('./lib/connectors.js') // Работаем с состояниями созданных игр

// --------------------------------создаем приложение
const app = express();

app.set('port', process.env.PORT || 3500); // устанавливаем номер порта для подключения к сайту
app.set('views', '../client/views'); // устанавливаем папку для отрисовки сайта
app.set('view engine', 'pug'); // устанавливаем движок шабонизатора
app.use(favicon('../client/img/fav.png')); // устанавливаем для всех файлов фавикон
app.use(bodyParser.json()); // для json 
// app.use(bodyParser.urlencoded({extended: true}));

let games_serv = [];
let nm = ''
let gamePair = {};

// -------------------------------подлючаем статичные файлы
app.use(express.static(path.join(__dirname, '..', 'client')));

// Получаем данные от клиента при создании игры
app.post('/sendNameGame', (req, res) => {
    if (req.body.nameGame !== 'игрок') games_serv.push(req.body.nameGame);
    nm = req.body.nameGame;
    gamePair[nm] = [nm];
    // connectors.addPlayers(nm);
    res.send({message: 'game is create'});
});

// Составляем пару игроков
app.post('/sendPair', (req, res) => {
    gamePair[req.body.firstPlayer].push(req.body.secondPlayer);
    games_serv = games_serv.filter(e => e != req.body.firstPlayer);
    nm = req.body.secondPlayer;
    res.send({message: 'pair created'});
    createClients();
});

// Отправляем на клиента данные о лучших игроках
app.get('/data', (req, res) => {
    const data = {body: getterChampions.getChamp()};
    res.json(data);
});

//  Отправляем данные о созданных играх
app.get('/getGames', (req, res) => {
    const data = {body: games_serv};
    // const data = {body: connectors.getPlayers()};
    res.json(data);
});

// HTML
app.get('/start', (req, res) => {
    res.render('start');
});

app.get('/games', (req, res) => {
    res.render('games');
});

app.get('/bests', (req, res) => {
    res.render('bests');
});

app.get('/', (req, res) => {
    res.redirect('/start');
});

// Загрузка страницы с игрой
app.get('/game', (req, res) => {
    res.render('index');
});

// 404 - рендерим страницу в случае ошибки клиента
app.use(function(req, res) {res.status(404).render('404')});

// 500 - рендерим страницу в случае ошибки сервера
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('500');
});

// -----------------------запускаем сервер на локальном хосте
app.listen(app.get('port'), function() {
    console.log('Express запущен на http://localhost:' + app.get('port') + '; нажмите Ctrl+C для завершения.');
});

//------------------------------создаем серверы
const httpServer = http.createServer();
const wss = new WebSocket.Server({server: httpServer});

// запускаем сервер
httpServer.listen(8080);

const clientConnections = {};
const opponents = {};
const nameClients = {};
let clientIdsWaitingMatch = [];
let watchMatch = [];
let is_capitul = false;

// -----------------------------создаем подключение
wss.on('connection', connection => {
    const clientId = nm;
    clientConnections[clientId] = connection;
    matchClients(clientId);

    // принимаем сообщения на сервер
    connection.on('message', message => {
        const result = JSON.parse(message);

        if (result.method === 'move') {
            moveHandler(result, clientId);
        };

        if (result.method === 'naming') {
            nameClients[clientId] = result.name;
        };

        if (result.method === 'capitul') {
            is_capitul = true;
        };
    });
    
    connection.on('close', () => {
        // connectors.deletePlayers(clientId);
        // games_serv = games_serv.filter(e => e != clientId)
        closeClient(connection, clientId);
    });
});

function matchClients(clientId){
    if(watchMatch.length < 2) return;

    const firstClientId = watchMatch.shift();
    const secondClientId = watchMatch.shift();

    opponents[firstClientId] = secondClientId;
    opponents[secondClientId] = firstClientId;

    clientConnections[firstClientId].send(JSON.stringify({
        method: "join",
        symbol: "X",
        turn: "X",
    }));

    clientConnections[secondClientId].send(JSON.stringify({
        method: 'join',
        symbol: "O",
        turn: "X",
    }));
};

function moveHandler(result, clientId){
    const opponentClientId = opponents[clientId];

    if (checkWin(result.field)) {
        [clientId, opponentClientId].forEach(cId => {
            clientConnections[cId].send(JSON.stringify({
                method: 'result',
                message: `${nameClients[clientId]} выиграл`,
                field: result.field
            }));
        });
        writeWinners.writerPlayer(nameClients[clientId], nameClients[opponentClientId]);
        return;
    };

    if (checkDraw(result.field)) {
        [clientId, opponentClientId].forEach(cId => {
            clientConnections[cId].send(JSON.stringify({
                method: 'result',
                message: 'ничья',
                field: result.field
            }));
        });
        writeWinners.writeDrawPlayers(nameClients[clientId], nameClients[opponentClientId]);
        return;
    };

    [clientId, opponentClientId].forEach(cId => {
        clientConnections[cId].send(JSON.stringify({
            method: 'update',
            turn: result.symbol === "X" ? "O" : "X",
            field: result.field
        }));
    });
};

function closeClient(connection, clientId) {
    connection.close();
    const isLeftUnmatchedClient = clientIdsWaitingMatch.some(unmathedClientId => unmathedClientId === clientId);

    if (isLeftUnmatchedClient) {
        clientIdsWaitingMatch = clientIdsWaitingMatch.filter(unmathedClientId => unmathedClientId !== clientId);
    }
    else if (is_capitul) {
        const opponentClientId = opponents[clientId];
        clientConnections[opponentClientId].send(JSON.stringify({
            method: 'left',
            message: `${opponentClientId} выиграл. ${clientId} сдался`
        }));
        is_capitul = false;
        writeWinners.writerPlayer(nameClients[opponentClientId], nameClients[clientId]);
    } else {
        const opponentClientId = opponents[clientId];
        clientConnections[opponentClientId].send(JSON.stringify({
            method: 'left',
            message: 'противник покинул игру'
        }));
    };
};

const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function checkWin(field) {
    return winningCombos.some(combo => {
        const [first, second, third] = combo;
        return field[first] !== "" && field[first] === field[second] && field[first] === field[third];
    });
};

function checkDraw(field) {
    return field.every(symbol => symbol === "X" || symbol === "O");
};

function createClients() {
    let arrPair = Object.values(gamePair);

    arrPair.forEach(elem => {
        if (elem.length == 2){
            const firstClientId = elem.shift();
            delete gamePair[firstClientId];
            const secondClientId = elem.shift();
            watchMatch.push(firstClientId, secondClientId);
        };
    });
    arrPair = arrPair.filter(e => e.length > 0);
};
