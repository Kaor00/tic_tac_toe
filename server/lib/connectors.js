const fs = require('fs'); // подключаем библиотеку по работе с файлами
const path = require('path');

// Преобразуем наш файл JSON в объект
let data;
data = JSON.parse(fs.readFileSync('./data/waiting.json'));

// формируем путь до нужного файла
const fuelname = path.join(__dirname, '../', 'data/waiting.json'); 

// ДОбавляем игрока в список ожидающих игру
exports.addPlayers = function(player) {
    if(Object.keys(data).includes(player)) {
        player = player + 1
    };
    data[player] = player;

    // Записываем данные во внешний файл
    fs.writeFile(fuelname, JSON.stringify(data), (err) => {
        if (err) return console.error(err);
    });
};

exports.getPlayers = function(){
    return Object.keys(data);
};

exports.deletePlayers = function(player) {
    delete data[player];

     // Записываем данные во внешний файл
     fs.writeFile(fuelname, JSON.stringify(data), (err) => {
        if (err) return console.error(err);
    });
};