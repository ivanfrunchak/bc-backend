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

                if (json.command == 'hidden') {
                    const body = document.querySelector('body');
                    body.style.opacity = json.opacity;
                }

                if (json.command == 'betting') {
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
                    let buttons = document.querySelectorAll('.game-area-group-buttons button');
                    buttons[1].click();
                }

                if (json.command == 'down2x') {
                    let buttons = document.querySelectorAll('.game-area-group-buttons button');
                    buttons[0].click();
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
        let loseAmount = 0;
        let totalBetAmount = 0;

        let betScore = 0;
        let betHighCount = 0;
        let betHighSum = 0;

        const rows = document.querySelectorAll('div.w1mk6de3 > div.scroll-wrap > table > tbody > tr');
        let dogeCoinCount = 0;
        rows.forEach((row) => {
            if (row.outerHTML.indexOf('JB.black') > -1)
                return;

            const betEl = row.querySelector('.bet .amount-str');
            const betCoinEl = row.querySelector('.bet img.coin-icon');
            const coinImage = betCoinEl.getAttribute('src');
            //console.log('BET EL', betEl);
            const betAmount = parseFloat(betEl.textContent.trim().replace(/[^0-9.-]/g, ''));

            if (betAmount >= 1000 && betAmount < 1500) {
                betScore += 1;
                betHighSum += betAmount;
                betHighCount++;
                // if (coinImage == '/coin/DOGE.black.png') {
                //     dogeCoinCount += 1;
                // }
            } else if (betAmount >= 1500 && betAmount < 2000) {
                betScore += 1.5;
                betHighSum += betAmount;
                betHighCount++;
                if (coinImage == '/coin/DOGE.black.png') {
                    dogeCoinCount += 1;
                }
            } else if (betAmount >= 2000 && betAmount < 2500) {
                betScore += 2;
                betHighSum += betAmount;
                betHighCount++;
                if (coinImage == '/coin/DOGE.black.png') {
                    dogeCoinCount += 1;
                }
            } else if (betAmount >= 2500 && betAmount < 3000) {
                betScore += 2.5;
                betHighSum += betAmount;
                betHighCount++;
                if (coinImage == '/coin/DOGE.black.png') {
                    dogeCoinCount += 1;
                }
            } else if (betAmount >= 3000 && betAmount < 4000) {
                betScore += 3;
                betHighSum += betAmount;
                betHighCount++;
                if (coinImage == '/coin/DOGE.black.png') {
                    dogeCoinCount += 1;
                }
            } else if (betAmount >= 4000) {
                betScore += 4;
                betHighSum += betAmount;
                betHighCount++;
                if (coinImage == '/coin/DOGE.black.png') {
                    dogeCoinCount += 1;
                }
            }

            const winEl = row.querySelector('.profit .is-win .amount-str');
            const winAmount = winEl ? parseFloat(winEl.textContent.trim().replace(/[^0-9.-]/g, '')) : 0;

            if (winAmount != 0) {
                loseAmount += betAmount + winAmount;
            }

            totalBetAmount += betAmount;
        });


        if (isFinal) {
            // console.log('Final', totalBet, betAmount, loseAmount, betAmount - loseAmount);

            // const totalBet1 = totalBet;
            // const totalBetAmount1 = totalBetAmount;
            // const loseAmount1 = loseAmount;
            // setTimeout(() => {
            //     const link = document.querySelector('.h4j5hip table tbody > tr:first-child > td:nth-child(2)');
            //     const score = link ? parseFloat(link.textContent) : -100;
            //     const hashlink = document.querySelector('.h4j5hip table tbody > tr:first-child > td:nth-child(3) > div > input');
            //     const hash = hashlink ? hashlink.getAttribute('value') : null;
            //     socket && socket.send(JSON.stringify({
            //         command: 'classic-final'
            //         , totalBet: totalBet1
            //         , betAmount: totalBetAmount1
            //         , loseAmount: loseAmount1
            //         , score
            //         , hash
            //         , betScore
            //         , betHighCount
            //         , betHighSum
            //         , dogeCoinCount
            //     }));
            // }, 1000)

            // setTimeout(() => {
            //     const link = document.querySelector('.h4j5hip table tbody > tr:first-child > td:nth-child(2)');
            //     const score = link ? parseFloat(link.textContent) : -100;
            //     socket && socket.send(JSON.stringify({ command: 'classic-final', totalBet: totalBet1, betAmount: totalBetAmount1, loseAmount: loseAmount1, score }));
            // }, 5000)

        } else {
            // console.log('Current', totalBet, betAmount, loseAmount, betAmount - loseAmount);
            // const remain = totalBet - loseAmount;
            // if (remain < -40) {
            //     const subTextEl = document.querySelector('.game-control-panel .ui-button .button-inner .sub-text');
            //     if (subTextEl && subTextEl.textContent == 'Cash Out') {
            //         document.querySelector('.game-control-panel .ui-button').click();
            //         console.log('CASH OUT');
            //     }
            // }
            const link = document.querySelector('.h4j5hip table tbody > tr:first-child > td:nth-child(2)');
            const score = link ? parseFloat(link.textContent) : -100;
            const hashlink = document.querySelector('.h4j5hip table tbody > tr:first-child > td:nth-child(3) > div > input');
            const hash = hashlink ? hashlink.getAttribute('value') : null;

            // const balanceEl = document.querySelector('div.p171ql5d.right.width-level-1 > div.w1tjnt4n.wallet-enter > div > div > div > div > div > span')
            // const balance = parseFloat(balance.textContent.trim());
            socket && socket.send(JSON.stringify({
                command: 'classic-current'
                , totalBet, betAmount: totalBetAmount, loseAmount
                , betScore
                , betHighCount
                , betHighSum
                , dogeCoinCount
                , score
                , hash
                // , balance
            }))
        }

        if (isFinal) isEnded = true;
        // calc trenball
    }



    function startWork() {

        if (document.querySelector('div.w1mk6de3.need-scroll > div.state.is-win') !== null) {
            isFinal = true;
            setTimeout(() => {
                // let's calc profit!
                calcProfit(true);
                isEnded = true;
            });
        }

        if (document.querySelector('div.w1mk6de3.need-scroll > div.state.is-progress') !== null) {
            isEnded = false;
            isFinal = false;
            const totalBetEl = document.querySelector('div.w1mk6de3.need-scroll > div.state.is-progress > div.amount');
            totalBet = parseFloat(totalBetEl.textContent.trim().replace(/[^0-9.-]/g, ''))

            calcProfit(false);
        }
    }

    initializeSocket();
}
