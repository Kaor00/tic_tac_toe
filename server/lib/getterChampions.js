const fs = require('fs'); // подключаем библиотеку по работе с файлами

// Преобразуем наш файл JSON в объект
let data;
data = JSON.parse(fs.readFileSync('./data/champions.json'));

// возвращаем массив, отсортированный по очкам в колличестве 10 первых элементов
exports.getChamp = function(){
    let sorted_data = Object.values(data).sort(function(a, b) {
        return b[1] - a[1];
    });
    return sorted_data.filter((elem, index) => index < 10);
};