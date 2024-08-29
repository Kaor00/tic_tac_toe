const close_best = document.getElementById('close_best'); // закрыть вкладку лучших игроков

close_best.addEventListener('click', clear_champions); // Обработчик событий с перенаправлением на главное меню

// Получаем данные с сервера и вставляем в html
fetch('/data')
.then(responce => responce.json())
.then(data => {
    let count = 1;
    const wrap_best = document.querySelector('.wrap_best');
    data.body.forEach(e => {
        let p = document.createElement('p');
        p.innerHTML = `${count}. ${e[0]}  - очков: ${e[1]}`;
        wrap_best.appendChild(p);
        count++
    });
});

// Очищаем список что бы данные не дублировались при каждом открытии
function clear_champions() {
    const wrap_best = document.querySelector('.wrap_best');
    wrap_best.innerHTML = '';

    location.href = '/start';
};