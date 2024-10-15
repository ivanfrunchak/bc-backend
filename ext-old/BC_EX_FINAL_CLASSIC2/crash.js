window.addEventListener('load', mainFunc, false);
console.log('CLASSIC2')
const wait = (t) => {
    return new Promise((res, rej) => {
        setTimeout(res, t);
    });
};
let totalBet = 0;
async function mainFunc(event) {

    var timer = setInterval(startWork, 200);


    window.RealWebSocket = window.WebSocket;

    window.WebSocket = function () {
        var socket = new window.RealWebSocket(...arguments);

        socket.addEventListener("message", (e) => {
            console.log("The message is: ", e);
        });

        return socket;
    }

    console.log('CLASSIC STARTED')
    let isEnded = false
    let socket = null;

    function initializeSocket() {
        socket = new WebSocket('ws://localhost:3000');


        socket.onopen = function (e) {
            socket && socket.send(JSON.stringify({
                command: 'id',
                id: 2
            }))
        };

        socket.onmessage = async function (event) {
            try {
                const json = JSON.parse(event.data);
                console.log('JSON', json);
                if (json.command == 'sell') {
                    const subTextEl = document.querySelector('.game-control-panel .ui-button .button-inner .sub-text');
                    if (subTextEl && subTextEl.textContent == 'Cash Out') {
                        console.log('SELLLLLLLLLLLLLLLLLL');
                        document.querySelector('.game-control-panel .ui-button').click();
                        console.log('CASH OUT');
                    }
                }

                if (json.command == 'cancel') {
                    const subTextEl = document.querySelector('.game-control-panel .ui-button .button-inner .sub-text');
                    if (subTextEl && subTextEl.textContent == '(Cancel)') {
                        document.querySelector('.game-control-panel .ui-button').click();
                    }

                    if (subTextEl == undefined) {
                        document.querySelector('.game-control-panel .ui-button').click();
                    }
                }

                if (json.command == 'betting') {
                    const subTextEl = document.querySelector('.game-control-panel .ui-button .button-inner .sub-text');
                    if (subTextEl && subTextEl.textContent == '(Next round)') {
                        console.log('BETTING');
                        if (json.cost == 1) { // 2X
                            let buttons = document.querySelectorAll('.game-area-group-buttons button');
                            buttons[1].click();
                            return;
                        }

                        if (json.cost == 2) { // 1/2X
                            let buttons = document.querySelectorAll('.game-area-group-buttons button');
                            buttons[0].click();
                            return;
                        }

                        document.querySelector('.game-control-panel .ui-button').click();
                    }

                    if (subTextEl == undefined) {
                        if (json.cost == 1) { // 2X
                            let buttons = document.querySelectorAll('.game-area-group-buttons button');
                            buttons[1].click();
                            return;
                        }

                        if (json.cost == 2) { // 1/2X
                            let buttons = document.querySelectorAll('.game-area-group-buttons button');
                            buttons[0].click();
                            return;
                        }
                        document.querySelector('.game-control-panel .ui-button').click();
                    }
                }

            } catch (err) {

            }

        }
        socket.onclose = function (event) {
            if (event.wasClean) {
                setTimeout(() => {
                    initializeSocket();
                }, 3000)

            } else {
                setTimeout(() => {
                    initializeSocket();
                }, 3000)
            }
        };


    }



    function startWork() {
        
    }

    initializeSocket();
}
