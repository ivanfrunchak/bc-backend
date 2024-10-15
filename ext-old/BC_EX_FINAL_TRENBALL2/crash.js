window.addEventListener('load', mainFunc, false);
console.log('TRENBALL')

let totalBet = 0;
function mainFunc(event) {
    var timer = setInterval(startWork, 200);

    console.log('TRENBALL STARTED')
    let isEnded = false
    let socket = null;

    function initializeSocket() {
        socket = new WebSocket('ws://localhost:3000');


        socket.onopen = function (e) {
            socket && socket.send(JSON.stringify({
                command: 'id',
                id: 3
            }))
        };

        socket.onmessage = async function (event) {
            try {
                const json = JSON.parse(event.data);
                console.log('JSON', json);
                if (json.command == 'betting2x') {

                    const invest = json.invest;

                    if (invest == 0) return;

                    let currentInvestEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');

                    if (currentInvestEl == undefined || currentInvestEl == null) {
                        console.log("ERROR INVEST ELEMENT")
                        return;
                    }

                    let currentValue = parseFloat(currentInvestEl.value);

                    if (currentValue == 0) return;


                    let selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(1)'
                    const downButton = document.querySelector(selector);
                    selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(2)'
                    const upButton = document.querySelector(selector);

                    let button = downButton;
                    

                    let isUp = true;
                    if (currentValue > invest) {
                        isUp = false;
                        button = downButton;
                    } else if (currentValue < invest) {
                        isUp = true;
                        button = upButton;
                    } else {
                        button = document.querySelector('#crash-control-0 > div.game-control-panel > div > div:nth-child(3) > button');
                        button.click();
                    }


                    const handler = setInterval(() => {
                        let currentInvestEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');

                        if (currentInvestEl == undefined || currentInvestEl == null) {
                            clearInterval(handler);
                            return;
                        }
                        let currentValue = parseFloat(currentInvestEl.value);

                        console.log(currentValue, invest);
                        if (isUp) {
                            if (currentValue >= invest) {
                                clearInterval(handler);
                                button = document.querySelector('#crash-control-0 > div.game-control-panel > div > div:nth-child(3) > button');
                                button.click();
                                return;
                            }
                        } else {
                            if (currentValue <= invest) {
                                clearInterval(handler);
                                button = document.querySelector('#crash-control-0 > div.game-control-panel > div > div:nth-child(3) > button');
                                button.click();
                                return;
                            }
                        }

                        button.click();
                    })


                    
                } else if (json.command == 'up2x') {
                    let selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(2)'
                    const button = document.querySelector(selector);
                    button.click();
                } else if (json.command == 'down2x') {
                    let selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(1)'

                    let currentInvestEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');

                    if (currentInvestEl == undefined || currentInvestEl == null) {
                        return;
                    }

                    const invest = json.invest * 2;

                    let currentValue = parseFloat(currentInvestEl.value) - 0.02;
                    if (currentValue <= invest) {
                        return;
                    }
                    const button = document.querySelector(selector);
                    button.click();
                } else if (json.command == 'betting1/2x') {

                    const invest = json.invest;

                    if (invest == 0) return;

                    let currentInvestEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');

                    if (currentInvestEl == undefined || currentInvestEl == null) {
                        return;
                    }

                    let currentValue = parseFloat(currentInvestEl.value);

                    if (currentValue == 0) return;

                    let selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(1)'
                    const downButton = document.querySelector(selector);
                    selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(2)'
                    const upButton = document.querySelector(selector);

                    let button = downButton;
                    


                    let isUp = true;
                    if (currentValue > invest) {
                        isUp = false;
                        button = downButton;
                    } else if (currentValue < invest) {
                        isUp = true;
                        button = upButton;
                    } else {
                        selector = '#crash-control-0 > div.game-control-panel > div > div:nth-child(2) > button'
                        button = document.querySelector(selector);
                        button.click();
                        return;
                    }


                    const handler = setInterval(() => {
                        let currentInvestEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');

                        if (currentInvestEl == undefined || currentInvestEl == null) {
                            clearInterval(handler);
                            return;
                        }
                        let currentValue = parseFloat(currentInvestEl.value);

                        console.log(currentValue, invest);
                        if (isUp) {
                            if (currentValue >= invest) {
                                clearInterval(handler);
                                selector = '#crash-control-0 > div.game-control-panel > div > div:nth-child(2) > button'
                                button = document.querySelector(selector);
                                button.click();
                                return;
                            }
                        } else {
                            if (currentValue <= invest) {
                                clearInterval(handler);
                                selector = '#crash-control-0 > div.game-control-panel > div > div:nth-child(2) > button'
                                button = document.querySelector(selector);
                                button.click();
                                return;
                            }
                        }

                        button.click();
                    })



                }

                if (json.command == 'hidden') {
                    const body = document.querySelector('body');
                    body.style.opacity = json.opacity;
                }

                if (json.command == 'reset') {
                    // const invest = json.invest;

                    // if (invest == 0) return;
                    // let selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(1)'
                    // const downButton = document.querySelector(selector);
                    // selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(2)'
                    // const upButton = document.querySelector(selector);

                    // let button = downButton;
                    // let currentInvestEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');

                    // if (currentInvestEl == undefined || currentInvestEl == null) {
                    //     clearInterval(handler);
                    //     return;
                    // }
                    // let currentValue = parseFloat(currentInvestEl.value);

                    // let isUp = true;
                    // if (currentValue > invest) {
                    //     isUp = false;
                    //     button = downButton;
                    // } else if (currentValue < invest) {
                    //     isUp = true;
                    //     button = upButton;
                    // } else {
                    //     return;
                    // }


                    // const handler = setInterval(() => {
                    //     let currentInvestEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');

                    //     if (currentInvestEl == undefined || currentInvestEl == null) {
                    //         clearInterval(handler);
                    //         return;
                    //     }
                    //     let currentValue = parseFloat(currentInvestEl.value);

                    //     console.log(currentValue, invest);
                    //     if (isUp) {
                    //         if (currentValue >= invest) {
                    //             clearInterval(handler);
                    //             return;
                    //         }
                    //     } else {
                    //         if (currentValue <= invest) {
                    //             clearInterval(handler);
                    //             return;
                    //         }
                    //     }

                    //     button.click();
                    // })
                }



            } catch (err) {

            }

        };

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
        return;
        
    }

    initializeSocket();
}
