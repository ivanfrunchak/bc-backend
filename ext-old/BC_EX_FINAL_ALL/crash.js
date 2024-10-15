window.addEventListener('load', mainFunc, false);
console.log('ALL')

let totalClassicBet = 0;
function mainFunc(event) {
    var timer = setInterval(startWork, 200);

    console.log('ALL STARTED')
    
    function calcProfit() {
        // calc classic
        let classicLoseAmount = 0;
        if (document.querySelector('div.w1mk6de3.need-scroll > div.state.is-win') !== null) { // it's a classic
            const rows = document.querySelectorAll('div.w1mk6de3 > div.scroll-wrap > table > tbody > tr');
            rows.forEach((row) => {
                if (row.outerHTML.indexOf('JB.black') > -1)
                    return;

                var betEl = row.querySelector('.bet .amount-str');
                //console.log('BET EL', betEl);
                const betAmount = parseFloat(betEl.textContent.trim().replace(/[^0-9.-]/g, ''));

                var winEl = row.querySelector('.profit .is-win .amount-str');
                const winAmount = winEl ? parseFloat(winEl.textContent.trim().replace(/[^0-9.-]/g, '')) : 0;
                classicLoseAmount += winAmount;
            });
        }

        console.log('classicLoseAmount', totalClassicBet, classicLoseAmount, totalClassicBet - classicLoseAmount);
        // 
        // betLists[0] is <= 2x, betList[1] is >= 10x
        
        const betLists = document.querySelector('div.wpv7ucj.need-scroll .bet-list');

        console.log(betLists);

        
        // calc trenball
    }

    function startWork() {
        if (document.querySelector('div.w1mk6de3.need-scroll > div.state.is-win') !== null) {
            setTimeout(() => {
                // let's calc profit!
                calcProfit();
            }, 100);
        }

        if (document.querySelector('div.w1mk6de3.need-scroll > div.state.is-progress') !== null) {
            const totalBetEl = document.querySelector('div.w1mk6de3.need-scroll > div.state.is-progress > div.amount');
            totalClassicBet = parseFloat(totalBetEl.textContent.trim().replace(/[^0-9.-]/g, ''))
        }
    }
}
