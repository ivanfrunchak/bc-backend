window.addEventListener('load', mainFunc, false);
console.log('CLASSIC')

let totalBet = 0;
function mainFunc(event) {


    var timer = setInterval(startWork, 200);

    console.log('CLASSIC STARTED')
    let isEnded = false
    let socket = null;

    function setNativeValue(el, value) {
        const previousValue = el.value;

        if (el.type === 'checkbox' || el.type === 'radio') {
            if ((!!value && !el.checked) || (!!!value && el.checked)) {
                el.click();
            }
        } else el.value = value;

        const tracker = el._valueTracker;
        if (tracker) {
            tracker.setValue(previousValue);
        }

        // 'change' instead of 'input', see https://github.com/facebook/react/issues/11488#issuecomment-381590324
        el.dispatchEvent(new Event('change', { bubbles: false }));

    }

    let getReactEventHandlers = (element) => {
        // the name of the attribute changes, so we find it using a match.
        // It's something like `element.__reactEventHandlers$...`
        let reactEventHandlersName = Object.keys(element)
            .filter(key => key.match('reactEventHandler'));
        return element[reactEventHandlersName];
    }

    let triggerReactOnChangeEvent = (element) => {
        let ev = new Event('change');
        // workaround to set the event target, because `ev.target = element` doesn't work
        Object.defineProperty(ev, 'target', { writable: false, value: element });
        getReactEventHandlers(element).onChange(ev);
    }



    function initializeSocket() {
        socket = new WebSocket('ws://localhost:3000');


        socket.onopen = function (e) {
            socket && socket.send(JSON.stringify({
                command: 'id',
                id: 1
            }))
        };

        socket.onmessage = async function (event) {
            try {
                const json = JSON.parse(event.data);
                console.log('JSON', json);
                if (json.command == 'sell') {
                    const subTextEl = document.querySelector('.game-control-panel .ui-button .button-inner .sub-text');
                    if (subTextEl && subTextEl.textContent == 'Cash Out') {
                        document.querySelector('.game-control-panel .ui-button').click();
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

                if (json.command == 'hidden') {
                    const body = document.querySelector('body');
                    body.style.opacity = json.opacity;
                }

                if (json.command == 'betting') {
                    return;
                    const amountEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');
                    const amount = parseFloat(amountEl.value);
                    if (amount == 0) return;
                    const subTextEl = document.querySelector('.game-control-panel .ui-button .button-inner .sub-text');
                    if (subTextEl && subTextEl.textContent == '(Next round)') {
                        console.log('BETTING');
                        if (json.cost == 2) { // 1/2X
                            let buttons = document.querySelectorAll('.game-area-group-buttons button');
                            buttons[0].click();
                            return;
                        }

                        document.querySelector('.game-control-panel .ui-button').click();
                    }

                    if (subTextEl == undefined) {

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
                }

                if (json.command == 'up2x') {
                    return;
                    let buttons = document.querySelectorAll('.game-area-group-buttons button');
                    buttons[1].click();
                }

                if (json.command == 'setpayout') {
                    return;
                    const { payout } = json;

                    const downButton = document.querySelector('#crash-control-0 > div.game-control-panel > div > div > div.ui-input.saokfa6.cashout-input.payout-input.is-bold > div.input-control > div.payout-buttons > button.sub-btn');
                    const upButton = document.querySelector('#crash-control-0 > div.game-control-panel > div > div > div.ui-input.saokfa6.cashout-input.payout-input.is-bold > div.input-control > div.payout-buttons > button.add-btn');

                    const handler = setInterval(() => {

                        const payoutEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div > div.ui-input.saokfa6.cashout-input.payout-input.is-bold > div.input-control > input[type=text]');
                        if (payoutEl == undefined || payoutEl == null) {
                            clearInterval(handler);
                            return;
                        }
                        let currentValue = parseFloat(payoutEl.value);
                        console.log(currentValue, payout);

                        if (currentValue >= payout && currentValue < payout + 1) {
                            clearInterval(handler);
                            return;
                        }

                        if (currentValue > payout) {
                            downButton.click();
                            return;
                        }

                        if (currentValue < payout) {
                            upButton.click();
                            return;
                        }

                    }
                    )




                }

                if (json.command == 'down2x') {

                    return;
                    let currentInvestEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');

                    if (currentInvestEl == undefined || currentInvestEl == null) {
                        return;
                    }

                    const invest = json.invest;

                    let currentValue = parseFloat(currentInvestEl.value) - 0.02;
                    if (currentValue <= invest) {
                        return;
                    }

                    let buttons = document.querySelectorAll('.game-area-group-buttons button');
                    buttons[0].click();
                }

                if (json.command == 'reset') {

                    return;
                    const invest = json.invest;

                    let buttons = document.querySelectorAll('.game-area-group-buttons button');

                    const handler = setInterval(() => {

                        let currentInvestEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');

                        if (currentInvestEl == undefined || currentInvestEl == null) {
                            clearInterval(handler);
                            return;
                        }

                        let currentValue = parseFloat(currentInvestEl.value) - 0.02;
                        console.log(currentValue, invest);

                        if (currentValue <= invest) {
                            clearInterval(handler);
                            return;
                        }
                        buttons[0].click();
                    }
                    )
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
    function calcProfit(isFinal) {
        if (isFinal && isEnded) return;
        // calc classic
        if (isFinal) {

        } else {


            const link = document.querySelector('.h1cw04l8 table tbody > tr:first-child > td:nth-child(2)');
            const score = link ? parseFloat(link.textContent) : -100;
            const hashlink = document.querySelector('.h1cw04l8 table tbody > tr:first-child > td:nth-child(3) > div > input');
            const hash = hashlink ? hashlink.getAttribute('value') : null;

            const amountEl = document.querySelector('#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]');
            const amount = parseFloat(amountEl.value);

            const balanceEl = document.querySelector('#header > div > div div.w1r99ly1.wallet-enter > div > div > div > div > div');
            const balance = balanceEl.textContent;

            // const balanceEl = document.querySelector('div.p171ql5d.right.width-level-1 > div.w1tjnt4n.wallet-enter > div > div > div > div > div > span')
            // const balance = parseFloat(balance.textContent.trim());
            socket && socket.send(JSON.stringify({
                command: 'classic-current'
                , score
                , hash
                , amount
                , balance
            }))
        }

        if (isFinal) isEnded = true;
        // calc trenball
    }



    function startWork() {

        if (document.querySelector('div.wvp088o.need-scroll > div.state.is-win') !== null) {
            isFinal = true;
            setTimeout(() => {
                // let's calc profit!
                calcProfit(true);
                isEnded = true;
            });
        }

        if (document.querySelector('div.wvp088o.need-scroll > div.state.is-progress') !== null) {
            isEnded = false;
            isFinal = false;
            const totalBetEl = document.querySelector('div.wvp088o.need-scroll > div.state.is-progress > div.amount');
            totalBet = parseFloat(totalBetEl.textContent.trim().replace(/[^0-9.-]/g, ''))

            calcProfit(false);
        }
    }

    initializeSocket();
}
