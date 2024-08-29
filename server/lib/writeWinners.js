const fs = require('fs'); // подключаем библиотеку по работе с файлами
const path = require('path'); // подключаем библиотеку по работе с путями 
// Преобразуем наш файл JSON в объект
let data;
data = JSON.parse(fs.readFileSync('./data/champions.json'));

// формируем путь до нужного файла
const fuelname = path.join(__dirname, '../', 'data/champions.json'); 

exports.writerPlayer = function(winner, looser) {
    // проверка наличия имени победителя в файле, иначе запись нового
    if (data[winner]) {
        data[winner][1] = data[winner][1] + 5;
    }else {
        data[winner] = [winner, 5];
    };
    // проверка наличия имени проигравшего в файле, иначе запись нового
    if (data[looser]) {
        data[looser][1] = data[looser][1] + 1
    } else {
        data[looser] = [looser, 1];
    };
    // Записываем данные во внешний файл
    fs.writeFile(fuelname, JSON.stringify(data), (err) => {
        if (err) return console.error(err);
    });
};

exports.writeDrawPlayers = function(player1, player2) {
    // проверка наличия имени сыгравших в ничью в файле, иначе запись нового
    [player1, player2].forEach(player => {
        if (data[player]) {
            data[player][1] = data[player][1] + 3
        } else {
            data[player] = [player, 3];
        };
    });
    // Записываем данные во внешний файл
    fs.writeFile(fuelname, JSON.stringify(data), (err) => {
        if (err) return console.error(err);
    });
};