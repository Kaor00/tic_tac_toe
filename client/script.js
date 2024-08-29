const messageElem = document.querySelector('.message'); // нативные сообщения вверху игры
const cellElements = document.querySelectorAll('.cell'); // ячейки для боя
const hello = document.querySelector('.hello'); // строка приветствия в которое мы добавляем имя
const exitGame = document.getElementById('ext'); // Кнопка выхода из игры
const capitulation = document.getElementById('capitulation'); // Кнопка разрыва игрового соединения и присуждения победы оставшемуся

// стартовые переменные
let field = ['', '', '', '', '', '', '', '', '']; // состояние игровых ячеек
let symbol = null;
let turn = null;
let isGameActive = false;
hello.textContent = hello.textContent + sessionStorage.getItem("id");
const visibleFlex = 'visibleFlex';
const hidden = 'hidden';

// Создаем анимацию поска соперников
let searchAnimation1 = setInterval(() => {
    messageElem.textContent += '.';
}, 1000);

let searchAnimation2 = setInterval(() => {
    messageElem.textContent = 'поиск..';
}, 4000);

// ДОбавляем действие выхода из игры когда нет соперников
exitGame.addEventListener('click', () => {
    sessionStorage.removeItem('id');
    location.href = '/start';
});

// действие когда игрок сдается
capitulation.addEventListener('click', () => {
    ws.send(JSON.stringify({
        "method": "capitul",
        "nameID": sessionStorage.getItem('id')
    }));
    location.href = '/start';
});

// создаем подключение к серверу
let ws = new WebSocket("ws://localhost:8080");

// создаем взаимодействие с сервером
ws.onmessage = message => {
    ws.send(JSON.stringify({
        'method': "naming",
        'name': sessionStorage.getItem('id')
    }));

    // принимаем данные с сервера
    const response = JSON.parse(message.data);

    if (response.method === 'join'){
        clearInterval(searchAnimation1);
        clearInterval(searchAnimation2);
        exitGame.classList.add(hidden);
        capitulation.classList.remove(hidden);
        symbol = response.symbol;
        turn = response.turn;
        isGameActive = symbol === turn;
        updateMessage();
    };

    if (response.method === 'update') {
        field = response.field;
        turn = response.turn;
        isGameActive = symbol === turn;
        updateBoard();
        updateMessage();
    };

    if (response.method === 'result') {
        changeViewBtn(true);
        field = response.field;
        updateBoard();
        isGameActive = false;
        setTimeout(() => {
            messageElem.textContent = response.message;
        }, 100);
        setTimeout(openModal(response.message), 2000);
    };

    if (response.method === 'left') {
        changeViewBtn(true);
        isGameActive = false;
        messageElem.textContent = response.message;
        setTimeout(openModal(response.message), 2000);
    };
};

cellElements.forEach((cell, index) => cell.addEventListener('click', event => {
    makeMove(event.target, index);
}));

function makeMove(cell, index) {
    if (!isGameActive || field[index] !== '') return;

    isGameActive = false;
    cell.classList.add(symbol);
    field[index] = symbol;

    ws.send(JSON.stringify({
        'method': "move",
        'symbol': symbol,
        'field': field
    }));
};

function updateBoard() {
    cellElements.forEach((cell, index) => {
        cell.classList.remove('X', 'O');
        field[index] !== '' && cell.classList.add(field[index]);
    });
};

function updateMessage(){
    let v= `ожидание хода соперника...`;
    if (symbol === turn) v = 'ваш ход';
    messageElem.textContent = v;
};

// // Открываем модальное окно
function openModal(text) {
    const end_modal = document.querySelector('.end_modal');
    const finishTitle = document.querySelector('.finishTitle');
    const restartGame = document.getElementById('restartGame');
    end_modal.classList.add(visibleFlex);
    restartGame.classList.remove(hidden)
    finishTitle.textContent = text;

    restartGame.addEventListener('click', () => {
        createGamebyName();
    });
};

//  Отправляем данные о создании игры при нажатии на кнопку "заново"
function createGamebyName() {
    const player = sessionStorage.getItem("id");
    
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

// меняем отображение кнопок по ситуации
function changeViewBtn(arg) {
    arg ? exitGame.classList.remove(hidden) : exitGame.classList.add(hidden);
    arg ? capitulation.classList.add(hidden) : capitulation.classList.remove(hidden);
};