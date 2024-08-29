const goBack = document.getElementById('go_back');
const battle = document.getElementById('battle');

const choiceGame = 'choices';

goBack.addEventListener('click', backToMenu);


fetch('/getGames')
.then(responce => responce.json())
.then(data => {
    let count = 1;
    const wrap_gm = document.querySelector('.wrap_games');
    data.body.forEach(e => {
        let p = document.createElement('p');
        p.innerHTML = `${count}. В ожидании соперника ${e}`;
        p.onclick = goToGame;
        wrap_gm.appendChild(p);
        count++;
    });
});

function backToMenu() {
    const wrap_gm = document.querySelector('.wrap_games');
    wrap_gm.innerHTML = "";
    location.href = '/start';
};

function goToGame(event) {
    event.target.classList.add(choiceGame);
    let ggg = event.target.textContent.split(" ").slice(-1)[0];
    console.log(ggg, sessionStorage.getItem("id"));

    let data = {
        firstPlayer: ggg,
        secondPlayer: sessionStorage.getItem("id")
    };

    battle.addEventListener('click', () => {
        fetch('/sendPair', {
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
        });
        location.href = 'game';
    });
};