

let authorizedKey = null
let socket = null
let scanSocket = null
let lastHash = null
const wss_endpoint = 'ws://localhost:33333'

window.addEventListener('load', mainFunc, false);


const inputElSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[1]/div/div[1]/div[2]/div[2]/input'
const buttonUpSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[1]/div/div[1]/div[2]/div[3]/button[2]'
const buttonDownSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[1]/div/div[1]/div[2]/div[3]/button[1]'
const buttonBetSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div/div[1]/div/button'

const getElement = (selector) => {
    return document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
}

const betting3x = (json) => {

    console.log('BETTING 3X Called', json)
    const invest = json.invest;

    if (invest == 0) return;

    // bcgame.im
    // const inputElSelector = '#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]'
    // const buttonUpSelector = '#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(2)'
    // const buttonDownSelector = '#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(1)'
    // const buttonBetSelector = '#crash-control-0 > div.game-control-panel > div > button'

    // const inputElSelector = '#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > input[type=text]'
    // const buttonUpSelector = '#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(2)'
    // const buttonDownSelector = '#crash-control-0 > div.game-control-panel > div > div > div.form-item > div > div.ui-input.cgn8hop.c159p90x.game-coininput > div.input-control > div > button:nth-child(1)'
    // const buttonBetSelector = '#crash-control-0 > div.game-control-panel > div > button'





    let currentInvestEl = getElement(inputElSelector);

    if (currentInvestEl == undefined || currentInvestEl == null) {
        console.log("ERROR INVEST ELEMENT")
        return;
    }


    let currentValue = parseFloat(currentInvestEl.value);

    if (currentValue == 0) return;

    const downButton = getElement(buttonDownSelector);
    const upButton = getElement(buttonUpSelector);

    let button = downButton;


    let isUp = true;
    if (currentValue > invest) {
        isUp = false;
        button = downButton;
    } else if (currentValue < invest) {
        isUp = true;
        button = upButton;
    } else {
        const betButton = getElement(buttonBetSelector)
        console.log('BET BUTTON', betButton)
        betButton.click();
        return
    }


    const handler = setInterval(() => {
        let currentInvestEl = getElement(inputElSelector);

        if (currentInvestEl == undefined || currentInvestEl == null) {
            clearInterval(handler);
            return;
        }
        let currentValue = parseFloat(currentInvestEl.value);

        console.log(currentValue, invest);
        if (isUp) {
            if (currentValue >= invest) {
                clearInterval(handler);
                const betButton = getElement(buttonBetSelector);
                console.log('BET BUTTON1', betButton)
                betButton.click();
                return;
            }
        } else {
            if (currentValue <= invest) {
                clearInterval(handler);
                const betButton = getElement(buttonBetSelector);
                betButton.click();
                return;
            }
        }

        button.click();
    })
}


const up2x = () => {
    const button = getElement(buttonUpSelector);
    button && button.click();
}

const down2x = () => {
    const button = getElement(buttonDownSelector);
    button && button.click();
}

const hidden = () => {
    const body = document.querySelector('body');
    body.style.opacity = json.opacity;
}


const checkHash = () => {

    
    //*[@id="root"]/div[1]/div/div[5]/div/div[1]/table/tbody/tr[2]/td[3]
    // const hashlink = document.querySelector('.h1cw04l8 table tbody > tr:first-child > td:nth-child(3) > div > input');
    //const hashlink = document.querySelector('#tabs-crash > div > div.tabs-view > div > div.h1cw04l8 > table > tbody > tr:nth-child(1) > td:nth-child(3) > div > input[type=text]');

    // const hashlink = document.querySelector('#root > div.w-full.px-4.mx-auto.max-w-\[1248px\].pb-18.pt-18.sm\:px-6.sm\:pb-6.sm\:pt-\[84px\] > div > div.tabs-content > div > div.relative.w-full.overflow-auto > table > tbody > tr:nth-child(1) > td.p-2.align-middle.\[\&\:has\(\[role\=checkbox\]\)\]\:pr-0.dark\:text-zinc-50.text-center.text-secondary.max-w-\[10rem\].truncate')
    // const hashlink = document.querySelector('#root > div.w-full.px-4.mx-auto.max-w-\[1248px\].pb-18.pt-18.sm\:px-6.sm\:pb-6.sm\:pt-\[84px\] > div > div.tabs-content > div > div.relative.w-full.overflow-auto > table > tbody > tr:nth-child(1) > td.p-2.align-middle.\[\&\:has\(\[role\=checkbox\]\)\]\:pr-0.dark\:text-zinc-50.text-center.text-secondary.max-w-\[10rem\].truncate')


    var xpathExpression = `/html/body/div[1]/div[1]/div/div[5]/div/div[1]/table/tbody/tr[1]/td[3]`;
    

    // Use document.evaluate to execute the XPath expression
    var hashEl = getElement(xpathExpression);


    const hash = hashEl ? hashEl.textContent : null;



    if (hash == lastHash) {
        return;
    }

    lastHash = hash
    scanSocket && scanSocket.send(JSON.stringify({
        command: 'hash'
        , hash
        , payload: hash
    }))

}


function mainFunc(event) {
    console.log('Crash started')
    initializeScanSocket()
    setInterval(() => {
        // check user is authorized or not
        if (authorizedKey == null) {

            // let's get key when user login succeed!
            chrome.storage.local.get(['authorizedKey'], (result) => {

                if (result.authorizedKey) {
                    console.log(result.authorizedKey)
                    authorizedKey = result.authorizedKey
                    if (socket == null) {
                        initializeSocket()
                    }
                }
            });
        }

        // checkHash()
    }, 100);

}

function initializeSocket() {
    socket = new WebSocket(wss_endpoint);
    socket.onopen = function (e) {
        const data = {
            command: 'authorize',
            clientType: 'ext',
            key: authorizedKey
        }
        socket && socket.send(JSON.stringify(data))
    };

    socket.onmessage = async function (event) {
        try {
            const json = JSON.parse(event.data);
            console.log('JSON', json);
            if (json.command == 'betting3x') {
                betting3x(json)
            } else if (json.command == 'up2x') {
                up2x(json)
            } else if (json.command == 'down2x') {
                down2x(json)
            } else if (json.command == 'hidden') {
                hidden(json)
            }

        } catch (err) {

        }

    }
    socket.onclose = function (event) {
        setTimeout(() => {
            if (authorizedKey) {
                initializeSocket();
            }
        }, 3000)
    };


}


function initializeScanSocket() {
    scanSocket = new WebSocket('ws://localhost:8888');


    scanSocket.onopen = function (e) {
        console.log('connected to bc engine server')
        scanSocket && scanSocket.send(JSON.stringify({
            command: 'id',
            id: 1
        }))
    };

    scanSocket.onclose = function (event) {
        setTimeout(() => {
            initializeScanSocket();
        }, 3000)
    };
}

