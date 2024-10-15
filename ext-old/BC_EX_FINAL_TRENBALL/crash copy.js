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
                id: 2
            }))
        };

        socket.onmessage = async function (event) {
            try {
                const json = JSON.parse(event.data);
                console.log('JSON', json);
                if (json.command == 'betting2x') {
                    const button = document.querySelector('#crash-control-0 > div.game-control-panel > div > div:nth-child(3) > button');
                    button.click();
                } else if (json.command == 'up2x') {
                    let selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cu6byd0.c1qqjbcw.game-coininput > div.input-control > div > button:nth-child(2)'
                    const button = document.querySelector(selector);
                    button.click();
                } else if (json.command == 'down2x') {
                    let selector = '#crash-control-0 > div.game-control-panel > div > div.ampunt-input-wrap > div > div.ui-input.cu6byd0.c1qqjbcw.game-coininput > div.input-control > div > button:nth-child(1)'
                    const button = document.querySelector(selector);
                    button.click();
                } else if (json.command == 'betting1/2x') {
                    let selector = '#crash-control-0 > div.game-control-panel > div > div:nth-child(2) > button'
                    const button = document.querySelector(selector);
                    button.click();
                }

                if (json.command == 'hidden') {
                    const body = document.querySelector('body');
                    body.style.opacity = json.opacity;
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
    function calcProfit(isFinal) {
        if (isFinal && isEnded) return;
        // calc classic
        let loseAmount = 0;
        let totalBetAmount = 0;
        let lowBetAmount = 0;

        let betScore = 0;
        let betHighCount = 0;
        let betHighSum = 0;

        const betLists = document.querySelectorAll('.bet-list > table');
        
        if (betLists == null || betLists.length == 0) return;
        const lowBetRows = betLists[0].querySelectorAll('tbody > tr');

        //const lowBetRows = betListEls[0].querySelectorAll('table > tbody > tr');

        lowBetRows.forEach((row) => {
            if (row.outerHTML.indexOf('JB.black') > -1)
                return;
            const betEl = row.querySelector('.amount.amount-str');
            
            const betAmount = parseFloat(betEl.textContent.trim().replace(/[^0-9.-]/g, ''));

            if (betAmount >= 1000 && betAmount < 1500) {
                betScore += 1;
                betHighSum += betAmount;
                betHighCount++;
            } else if (betAmount >= 1500 && betAmount < 2000) {
                betScore += 1.5;
                betHighSum += betAmount;
                betHighCount++;
            } else if (betAmount >= 2000 && betAmount < 2500) {
                betScore += 2;
                betHighSum += betAmount;
                betHighCount++;
            } else if (betAmount >= 2500 && betAmount < 3000) {
                betScore += 2.5;
                betHighSum += betAmount;
                betHighCount++;
            } else if (betAmount >= 3000 && betAmount < 4000) {
                betScore += 3;
                betHighSum += betAmount;
                betHighCount++;
            } else if (betAmount >= 4000) {
                betScore += 4;
                betHighSum += betAmount;
                betHighCount++;
            }

            const winEl = row.querySelector('.status-1 .amount-str');
            const winAmount = winEl ? parseFloat(winEl.textContent.trim().replace(/[^0-9.-]/g, '')) : 0;

            if (winAmount != 0) {
                loseAmount += betAmount + winAmount;
            }
            lowBetAmount += betAmount;
            totalBetAmount += betAmount;
        });


        // console.log('BET SCORE', betScore, betHighCount);

        const highBetRows = betLists[1].querySelectorAll('tbody > tr');

        //const lowBetRows = betListEls[0].querySelectorAll('table > tbody > tr');
        let moonBets = 0;

        highBetRows.forEach((row) => {
            if (row.outerHTML.indexOf('JB.black') > -1)
                return;
            const betEl = row.querySelector('.amount.amount-str');
            //console.log('BET EL', betEl);
            const betAmount = parseFloat(betEl.textContent.trim().replace(/[^0-9.-]/g, ''));



            const winEl = row.querySelector('.status-1 .amount-str');
            const winAmount = winEl ? parseFloat(winEl.textContent.trim().replace(/[^0-9.-]/g, '')) : 0;

            const moonEl = row.querySelector('.moon');

            if (moonEl) {
                moonBets += betAmount;
            }

            if (winAmount != 0) {
                loseAmount += betAmount + winAmount;
            }
            totalBetAmount += betAmount;
        });
        if (isFinal) {
            socket && socket.send(JSON.stringify({
                command: 'trenball-final'
                , betAmount: totalBetAmount
                , loseAmount, lowBetAmount
                , moonBetAmount: moonBets
                , betScore
                , betHighCount
                , betHighSum
            }))
        } else {
            // console.log('trenball-current', {betAmount: totalBetAmount, loseAmount, lowBetAmount, moonBetAmount: moonBets})
            socket && socket.send(JSON.stringify({
                command: 'trenball-current'
                , betAmount: totalBetAmount
                , loseAmount, lowBetAmount
                , moonBetAmount: moonBets
                , betScore
                , betHighCount
                , betHighSum
            }))
        }

        if (isFinal) isEnded = true;
        // calc trenball
    }

    function startWork() {
        // const betEl = document.querySelector('.game-control-panel .manual-control input');
        // betEl && betEl.focus();
        if (document.querySelector('.game-control-panel .manual-control .ui-button .sub-txt') !== null) {
            isEnded = false;
            calcProfit(false);
        } else {
            setTimeout(() => {
                // let's calc profit!
                calcProfit(true);
                isEnded = true;
            }, 500);
        }
    }

    initializeSocket();
}
