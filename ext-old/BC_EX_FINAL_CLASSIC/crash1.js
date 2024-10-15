window.addEventListener('load', mainFunc, false);
console.log('CLASIC')
function mainFunc(event) {
    var timer = setInterval(startWork, 200);

    console.log('CLASIC STARTED')
    var mainArray = [];
    var idMainArray = [];
    var tempArray = [];

    var betAmount = 100;
    var curAmount = 100;
    var lastX = 1;
    var lastB = 0;
    var numOfRed = 0;
    var bRunningState = false;
    var btnBet = document.querySelector('div.wpn4k9r');

    var bcgameAmount = 0;

    var curRoundBetAmount = 0;
    var curRoundProfit = 0;
    var curRemainBetAmount = 0;

    var bSentFinalResult = false;

    var tempA;
    var tempB;
    var tempC;

    function startWork() {
        if (document.querySelector('div.w1mk6de3.need-scroll > div.state.is-win') !== null) {
            if (bSentFinalResult)
                return;

            tempA = curRoundProfit;
            tempB = curRemainBetAmount;
            tempC = 0;

            const rows = document.querySelectorAll('div.w1mk6de3 > div.scroll-wrap > table > tbody > tr');
            rows.forEach((row) => {
                if (row.outerHTML.indexOf('JB.black') > -1)
                    return;

                let bp = [];
                var betAndProfit = row.querySelectorAll('.amount-str');
                betAndProfit.forEach((value) => {
                    bp.push(parseFloat((value.textContent.trim()).replace(/[^0-9.-]/g, '')));
                });
                var floatbetamount = bp[0]; // current betting amount
                var floatprofitamount = bp[1]; // current profit amount

                curRoundBetAmount += floatbetamount;
                if (!isNaN(floatprofitamount)) // it means player made profit. so will add the current round profit
                    curRoundProfit += floatprofitamount;
                else // it means player has lost
                    curRemainBetAmount += floatbetamount;

                if (row.outerHTML.indexOf('is-lose') > -1) {
                    var betAndProfit = row.querySelectorAll('.amount-str');
                    betAndProfit.forEach((value) => {
                        bp.push(parseFloat((value.textContent.trim()).replace(/[^0-9.-]/g, '')));
                    });

                    tempC += bp[1]; // lost amount
                }
            });

            bSentFinalResult = true;
        }

        if (document.querySelector('div.state.is-progress > div.amount') == null) {
            return; // it means the website has not loaded peroperly
        }

        curRoundBetAmount = 0;
        curRoundProfit = 0;
        curRemainBetAmount = 0;

        const rows = document.querySelectorAll('div.w1mk6de3 > div.scroll-wrap > table > tbody > tr');
        rows.forEach((row) => {
            if (row.outerHTML.indexOf('JB.black') > -1)
                return;

            let bp = [];
            var betAndProfit = row.querySelectorAll('.amount-str');
            betAndProfit.forEach((value) => {
                bp.push(parseFloat((value.textContent.trim()).replace(/[^0-9.-]/g, '')));
            })
            var floatbetamount = bp[0];
            var floatprofitamount = bp[1];

            curRoundBetAmount += floatbetamount;
            if (!isNaN(floatprofitamount))
                curRoundProfit += floatprofitamount;
            else
                curRemainBetAmount += floatbetamount;
        });

        console.log(curRemainBetAmount - curRoundProfit, curRemainBetAmount, tempC);

        const fullTextDiv = document.querySelector("div.recent-list");

        if (fullTextDiv != null) {
            const fullText = fullTextDiv.innerText;
            const elements = fullText.split("\n");
            const idTextArray = elements.filter((element) => !element.includes("x"));
            const floatArray = fullText.match(/\d+(\.\d+)?(?=x)/g).map(num => parseFloat(num));
            const idArray = idTextArray.map((element) => parseInt(element, 10));

            if (idArray.length !== 0 && tempArray.length === 0) {
                floatArray.every(value => mainArray.push(value));
                idArray.every(value => idMainArray.push(value));
                idArray.every(value => tempArray.push(value));
            }

            if (tempArray.length !== 0 && idArray.length !== 0) {
                idArray.map((value, index) => {
                    if (!tempArray.includes(value)) {
                        mainArray.push(floatArray[index]);
                        idMainArray.push(idArray[index]);

                        lastB = mainArray[mainArray.length - 1];
                        console.log(mainArray[mainArray.length - 1]);

                        var url = 'http://localhost:3000/classic?bcminus=';
                        url += tempA.toFixed(2);
                        url += '&bcwillget=';
                        url += tempB.toFixed(2);
                        url += '&bang=';
                        url += lastB;

                        // console.log(url);

                        fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            mode: 'no-cors',
                            body: JSON.stringify('')
                        });
                        // .then(response => response.text())
                        // .then(result => {console.log(result);})
                        // .catch(error => {console.error(error);});

                        bSentFinalResult = false;
                    }
                });

                tempArray = [];
                idArray.every(value => tempArray.push(value));
            }
        }
    }
}
