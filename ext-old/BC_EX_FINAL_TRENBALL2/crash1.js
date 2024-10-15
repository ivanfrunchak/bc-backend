window.addEventListener('load', mainFunc, false);

console.log('TRENBALL')

function mainFunc(event) {
    console.log('wwwwwwwwwwwwww');

    var timer = setInterval(startWork, 200);

    var bSentStatus = false;

    function startWork() {
        let vals = [];

        const rows = document.querySelectorAll('div.wpv7ucj.need-scroll > div.info-wrap > div.info > div.his > span');

        rows.forEach((row) => {
            vals.push(parseFloat(row.innerHTML.trim().replace(/[^0-9.-]/g, '')));
        });

        var moonrows = document.querySelectorAll('div.wpv7ucj.need-scroll > div.list-wrap > div.bet-list > table > tbody > tr');

        if (moonrows.length == 0)
            moonrows = document.querySelectorAll('div.wpv7ucj.need-scroll > div.ui-scrollview > div.bet-list > table > tbody > tr');

        var rAmount = vals[0];
        var gAmount = vals[1];
        var yAmount = 0;

        moonrows.forEach((moonrow) => {
            if (moonrow.outerHTML.indexOf('moon') > -1) {
                if (moonrow.outerHTML.indexOf('JB.black') > -1) {
                    return;
                }

                yAmount += parseFloat(moonrow.querySelector('.amount-str').textContent.trim().replace(/[^0-9.-]/g, ''));
            }
        });

        gAmount -= yAmount;

        if (document.querySelector('.s7ywhry.manual-control').outerHTML.indexOf('Next round') > -1) {
            if (bSentStatus == false) {
                var url = 'http://localhost:3000/trend?red=';
                url += rAmount.toFixed(2);
                url += '&green=';
                url += gAmount.toFixed(2);
                url += '&yellow=';
                url += yAmount.toFixed(2);

                console.log(rAmount, gAmount, yAmount);
                var caser = -rAmount + gAmount + yAmount;
                var caseg = rAmount - gAmount + yAmount;
                var casey = rAmount - gAmount - yAmount * 9

                if (yAmount == 0)
                    return;

                console.log('%c ' + caser, 'color: red');
                console.log('%c ' + caseg, 'color: green');
                console.log('%c ' + casey, 'color: black');

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    mode: 'no-cors',
                    body: JSON.stringify('')
                });
                // .then(response => response.text())
                // .then(result => console.log(result))
                // .catch(error => console.error(error));

                bSentStatus = true;
            }
        } else {
            bSentStatus = false;
        }
    }
}
