const html = require('./innerHTML.json'); // HTML шаблоны модальных окон
const baseUrl = 'https://helpesk.herokuapp.com/';
const helloMessage = 'Здесь пока пусто, нажмите кнопку Добавить тикет =)';

function sendTicket(method, id, type, resType, sendData, callback) {
    const xhr = new XMLHttpRequest();
    const url = baseUrl + '?method=' + type + (id !== '' ? '&id=' + id : id);
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=\"UTF-8\"'); // Тип запроса
    xhr.responseType = resType !== '' ? resType : 'json'; // Тип ответа
    xhr.addEventListener('load', () => (xhr.status === 200) ? callback(xhr.response) : console.error(xhr.response));
    xhr.send(JSON.stringify(sendData)); // Отправка данных
}

window.addEventListener('load', () => {
    let modals = document.getElementById('modals'), // Контейнер модальных окон
        tickets = document.getElementById('tickets'); // Контейнер тикетов

    tickets.innerHTML = '<img src="./src/loader.gif" alt="loader" style="height:30px;" />';

    function renderTicket(obj) {
        const date = (new Date(obj.created).toLocaleString()).split(', ');
        tickets.insertAdjacentHTML('beforeend', `
            <li class="ticket" id="${obj.id}">
                <div class="podticket">
                    <div class="complete_ticket circle mr ${obj.status ? 'completed' : ''}"></div>
                    <div class="ticket_text mr">
                        <div class="ticket_name">${obj.name}</div>
                        <div class="ticket_description">${obj.description}</div>
                    </div>
                </div>
                <div class="podticket end">
                    <div class="ticket_timestamp">${date[0]} ${date[1].substring(date[1].length-3, date[1])}</div>
                    <div class="tickets_control">
                        <div class="edit_ticket circle mr"></div><div class="remove_ticket circle"></div>
                    </div>
                </div>
            </li>
        `);
        const objEl = document.getElementById(obj.id);
        objEl.addEventListener('click', e => {
            if (!(e.target.classList.contains('edit_ticket') || e.target.classList.contains('remove_ticket'))) {
                let targ = null;
                if (!e.target.classList.contains('ticket'))
                    if (e.target.parentElement.classList.contains('ticket')) targ = e.target.parentElement;
                    else targ = e.target.parentElement.parentElement.parentElement;
                else targ = e.target;
                if (targ.classList.contains('ticket')) {
                    tickets.children.forEach(el => {
                        if (el.id !== targ.id) {
                            el.getElementsByClassName('ticket_description')[0].classList.remove('show');
                            el.classList.remove('active');
                        }
                    });
                    targ.getElementsByClassName('ticket_description')[0].classList.toggle('show');
                    targ.classList.toggle('active');
                }
            }
        });
        
        objEl.getElementsByClassName('complete_ticket')[0].addEventListener('click', e => {
            let dataObj = {
                'id': e.srcElement.parentElement.parentElement.id,
                'status': !e.srcElement.classList.contains('completed')
            };
            sendTicket('PUT', obj.id, 'ticketById', '', dataObj, () => e.srcElement.classList.toggle('completed'));
        });

        objEl.getElementsByClassName('remove_ticket')[0].addEventListener('click', e => {
            modals.insertAdjacentHTML('afterbegin', html.remove); // Показать модальное окно добавления тикета

            modals.getElementsByClassName('btn cancel')[0].addEventListener('click', evt =>
                evt.srcElement.offsetParent.offsetParent.remove()); // Закрыть модальное окно

            modals.getElementsByClassName('btn success')[0].addEventListener('click', evt => {
                sendTicket('DELETE', obj.id, 'ticketById', 'text', {}, answer =>
                    answer == 'ok' && e.srcElement.parentElement.parentElement.parentElement.remove());
                
                evt.srcElement.parentElement.parentElement.parentElement.remove();
            });
        });

        objEl.getElementsByClassName('edit_ticket')[0].addEventListener('click', e => {
            modals.insertAdjacentHTML('afterbegin', html.edit); // Показать модальное окно добавления тикета
            const name = modals.querySelector('[name="inp_small"]');
            const desk = modals.querySelector('[name="inp_big"]');

            name.value = objEl.getElementsByClassName('ticket_name')[0].innerText;
            desk.value = objEl.getElementsByClassName('ticket_description')[0].innerText;

            modals.getElementsByClassName('btn cancel')[0].addEventListener('click', evt =>
                evt.srcElement.offsetParent.offsetParent.remove()); // Закрыть модальное окно

            modals.getElementsByClassName('btn success')[0].addEventListener('click', evt => {
                let data = {}; // Массив данных для заполнения и отправки

                const check = tr => tr.value !== '' ? tr.classList.remove('err') : tr.classList.add('err'); // Валидация
                modals.getElementsByClassName('inp').forEach(el => {
                    el.addEventListener('focus', t => check(t.srcElement));
                    el.addEventListener('blur', t => check(t.srcElement));
                });

                let access = false; // Флаг разрешения отправки данных
                evt.srcElement.offsetParent.getElementsByClassName('inp').forEach(el => { // Перебор полей окна
                    if (el.value !== '') {
                        data[el.name] = el.value; // Добавление данных в массив отправки
                        access = true;
                    } else {
                        el.classList.add('err'); // Маркировать поле как ошибку
                        access = false; // Запрет отправки данных
                    }
                });

                if (access) {
                    sendTicket('PUT', '', 'ticketById', '', {
                        'id': obj.id,
                        'name': data['inp_small'],
                        'description': data['inp_big'],
                        'status': objEl.getElementsByClassName('complete_ticket')[0].classList.contains('completed')
                    }, () => sendTicket('GET', '', 'allTickets', '', {}, renderTickets));
                    
                    evt.srcElement.parentElement.parentElement.parentElement.remove();
                }
            });
        })
    }

    const renderTickets = data => {
        if (data.length !== 0) {
            tickets.innerHTML = '';
            data.forEach(el => renderTicket(el));
        } else tickets.innerText = helloMessage;
    };

    sendTicket('GET', '', 'allTickets', '', {}, renderTickets); // Запрос тикетов      

    document.getElementsByClassName('button_addTicket')[0].addEventListener('click', () => {
        let data = {}; // Массив данных для заполнения и отправки
        if (tickets.innerText === helloMessage) tickets.innerText = ''; // Очистить текст из списка тикетов
        modals.insertAdjacentHTML('afterbegin', html.addTicket); // Показать модальное окно добавления тикета

        const check = tr => tr.value !== '' ? tr.classList.remove('err') : tr.classList.add('err'); // Валидация
        modals.getElementsByClassName('inp').forEach(el => {
            el.addEventListener('focus', t => check(t.srcElement));
            el.addEventListener('blur', t => check(t.srcElement));
        });

        modals.getElementsByClassName('btn cancel')[0].addEventListener('click', evt =>
            evt.srcElement.offsetParent.offsetParent.remove()); // Закрыть модальное окно

        modals.getElementsByClassName('btn success')[0].addEventListener('click', evt => {
            let access = false; // Флаг разрешения отправки данных
            evt.srcElement.offsetParent.getElementsByClassName('inp').forEach(el => { // Перебор полей окна
                if (el.value !== '') {
                    data[el.name] = el.value; // Добавление данных в массив отправки
                    access = true;
                } else {
                    el.classList.add('err'); // Маркировать поле как ошибку
                    access = false; // Запрет отправки данных
                }
            });
            if (access) {
                sendTicket('POST', '', 'createTicket', '', {
                    'name': data.inp_small,
                    'description': data.inp_big,
                    'status': false,
                    'created': new Date().getTime()
                }, console.log);
                evt.srcElement.parentElement.parentElement.parentElement.remove();
                sendTicket('GET', '', 'allTickets', '', {}, renderTickets); // Запрос тикетов
            }
        });
   });
});