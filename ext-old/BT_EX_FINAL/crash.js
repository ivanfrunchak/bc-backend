window.addEventListener('load', mainFunc, false);
console.log('CLASSIC')

let totalBet = 0;
function mainFunc(event) {

    // const networkFilters = {
    //     urls: [
    //         "wss://gs.bustabit.com/ws"
    //     ]
    // };

    // console.log('chrome', chrome);
    // chrome.webRequest.onBeforeRequest.addListener((details) => {
    //     const { tabId, requestId } = details;
    //     // do stuff here
    // }, networkFilters);

   var timer = setInterval(startWork, 200);

    console.log('BUSTABIT STARTED')
    let isEnded = false
    let socket = null;
    let loseAmount = 0;
    let totalBetAmount = 0;
    let totalProfitAmount = 0;

    let isInitialize = false;

    function initializeSocket() {
        socket = new WebSocket('ws://localhost:3000');
        socket.onopen = function (e) {
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

        // if (isFinal && isEnded) return;
        // calc classic


        const rows = document.querySelectorAll('div._container_8x5sg_19 table > tbody > tr');

        if (isInitialize == false && rows.length < 30) {
            isInitialize = true;

            
            // setTimeout(() => {
                
            // }, 100)

            const payoutEl = document.querySelector('div._bottomPanelContainer_fd8dx_19 > div > table > tbody > tr:nth-child(1) > td:nth-child(1) > a');
            console.log("END: ", totalBetAmount, totalProfitAmount, totalBetAmount - totalProfitAmount, payoutEl.textContent);
            
            
        } else if (rows.length == 30) {
            // started
            isInitialize = false;
            // console.log(totalBetAmount, totalProfitAmount, totalBetAmount - totalProfitAmount);
        }
        loseAmount = 0;
        totalBetAmount = 0;
        totalProfitAmount = 0;

        rows.forEach((row) => {
            // if (row.outerHTML.indexOf('JB.black') > -1)
            //     return;
            

            const betEl = row.querySelector('td:nth-child(3)');
            const profitEl = row.querySelector('td:nth-child(4)');

            //console.log(betEl.textContent);

            const betAmount = parseFloat(betEl.textContent.trim().replace(/[^0-9.-]/g, ''));
            const profitAmount = profitEl.textContent == '-' ? 0 : parseFloat(profitEl.textContent.trim().replace(/[^0-9.-]/g, ''));

            totalBetAmount += betAmount;
            totalProfitAmount += profitAmount;

            // const betEl = row.querySelector('.bet .amount-str');
            // //console.log('BET EL', betEl);
            // const betAmount = parseFloat(betEl.textContent.trim().replace(/[^0-9.-]/g, ''));

            // const winEl = row.querySelector('.profit .is-win .amount-str');
            // const winAmount = winEl ? parseFloat(winEl.textContent.trim().replace(/[^0-9.-]/g, '')) : 0;

            // if (winAmount != 0) {
            //     loseAmount += betAmount + winAmount;
            // }

            // totalBetAmount += betAmount;
        });

        // console.log(rows.length, totalBetAmount, totalProfitAmount, totalBetAmount - totalProfitAmount);


        // if (isFinal) {
        //     // console.log('Final', totalBet, betAmount, loseAmount, betAmount - loseAmount);

        //     const totalBet1 = totalBet;
        //     const totalBetAmount1 = totalBetAmount;
        //     const loseAmount1 = loseAmount;
        //     setTimeout(() => {
        //         const link = document.querySelector('.h4j5hip table tbody > tr:first-child > td:nth-child(2)');
        //         const score = link ? parseFloat(link.textContent) : -100;
        //         socket && socket.send(JSON.stringify({ command: 'classic-final', totalBet: totalBet1, betAmount: totalBetAmount1, loseAmount: loseAmount1, score }));
        //     }, 5000)

        //     setTimeout(() => {
        //         const link = document.querySelector('.h4j5hip table tbody > tr:first-child > td:nth-child(2)');
        //         const score = link ? parseFloat(link.textContent) : -100;
        //         socket && socket.send(JSON.stringify({ command: 'classic-final', totalBet: totalBet1, betAmount: totalBetAmount1, loseAmount: loseAmount1, score }));
        //     }, 5000)

        // } else {
        //     socket && socket.send(JSON.stringify({ command: 'classic-current', totalBet, betAmount: totalBetAmount, loseAmount }))
        // }

        // if (isFinal) isEnded = true;
        // calc trenball
    }



    function startWork() {

        // if (document.querySelector('div.w1mk6de3.need-scroll > div.state.is-win') !== null) {
        //     isFinal = true;
        //     setTimeout(() => {
        //         // let's calc profit!
        //         calcProfit(true);
        //         isEnded = true;
        //     });
        // }

        // if (document.querySelector('div.w1mk6de3.need-scroll > div.state.is-progress') !== null) {
        //     isEnded = false;
        //     isFinal = false;
        //     const totalBetEl = document.querySelector('div.w1mk6de3.need-scroll > div.state.is-progress > div.amount');
        //     totalBet = parseFloat(totalBetEl.textContent.trim().replace(/[^0-9.-]/g, ''))

        //     calcProfit(false);
        // }

        calcProfit(false);
    }

    //initializeSocket();
}
