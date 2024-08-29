// Кнопки
const bestPlayer = document.getElementById('bestPlayer'); //  открыть вкладку лучших игроков
const createGame = document.getElementById('start'); // Создать игру
const joinGame = document.getElementById('joinGame'); // выбрать соперника
const exitGame = document.getElementById('ext'); // выход из игры

// Обработчики событий для кнопок модального окна
createGame.addEventListener('click', createGamebyName);
bestPlayer.addEventListener('click', getBestPlayers);
joinGame.addEventListener('click', choiceEmpty);
exitGame.addEventListener('click', exitFromGame);

let player = 'игрок';

// Переходим к просмотру лучших игроков на сервере
function getBestPlayers() {
    location.href = '/bests';
};

// присваиваем имя игроку, отправляем имя на сервер и закрываем модальное окно
function createGamebyName() {
    const named = document.getElementById('name').value;
    if (named) player = named;
    sessionStorage.setItem("id", player);
    
    const data = {nameGame: player};
    fetch('/sendNameGame', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            console.log('Сервер успешно получил данные.');
        } else {
            console.log('Ошибка отправки данных:', response.status);
        }
    })
    .then(data => {
        console.log('Ответ сервера:', data);
    })
    location.href = '/game';
};

// Выбрать соперника
function choiceEmpty() {
    const named = document.getElementById('name').value;
    if (named) player = named;
    sessionStorage.setItem("id", player)
    location.href = '/games';
};

// Выход с сайта игры
function exitFromGame() {
    const named = document.getElementById('name');
    named.value = '';
    sessionStorage.clear();
};
 