

let authorizedKey = null
let socket = null
let scanSocket = null
const wss_endpoint = 'ws://localhost:33333'

window.addEventListener('load', mainFunc, false);

const inputElSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div/div[1]/div/div[2]/div[1]/input'

// const inputElSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div[1]/div/div[1]/div[2]/div[2]/input'
// const buttonUpSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div[1]/div/div[1]/div[2]/div[3]/button[2]'
const buttonUpSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div/div[1]/div/div[2]/div[1]/div[2]/button[2]'

//const buttonDownSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div[1]/div/div[1]/div[2]/div[3]/button[1]'
const buttonDownSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div/div[1]/div/div[2]/div[1]/div[2]/button[1]'

// const button2XBetSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div[2]/div/div/div/div[2]/div[2]/button'
const button2XBetSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[2]/div[2]/button'

// const button1XBetSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div[2]/div/div/div/div[1]/div[2]/button'

const button1XBetSelector = '/html/body/div[1]/div[1]/div/div[1]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[1]/div[2]/button'


const hashElSelector = '/html/body/div[1]/div[1]/div/div[5]/div/div[1]/table/tbody/tr[1]/td[3]'
const historyElSelector = '/html/body/div[1]/div[1]/div/div[4]/button[2]'

const getElement = (selector) => {
    return document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
}

const betting2x = (json) => {

    console.log('BETTING 2X Called', json)
    const invest = json.invest;

    if (invest == 0) return;

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
        const betButton = getElement(button2XBetSelector);
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
                const betButton = getElement(button2XBetSelector);
                console.log('BET BUTTON1', betButton)
                betButton.click();
                return;
            }
        } else {
            if (currentValue <= invest) {
                clearInterval(handler);
                button = getElement(button2XBetSelector);
                button.click();
                return;
            }
        }

        button.click();
    })
}

const betting1x = (json) => {
    const invest = json.invest;

    console.log('BETTING 1X Called', json)

    if (invest == 0) return;

    let currentInvestEl = getElement(inputElSelector);

    if (currentInvestEl == undefined || currentInvestEl == null) {
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
        button = getElement(button1XBetSelector);
        button.click();
        return;
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
                button = getElement(button1XBetSelector);
                button.click();
                return;
            }
        } else {
            if (currentValue <= invest) {
                clearInterval(handler);
                button = getElement(button1XBetSelector);
                button.click();
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

let lastHash = null

let isClickedHistory = false

const checkHash = () => {

    // Use document.evaluate to execute the XPath expression

    let historyButtonEl = getElement(historyElSelector)

    if (historyButtonEl && isClickedHistory == false) {
        historyButtonEl.click()
        isClickedHistory = true
    }
    var hashEl = getElement(hashElSelector);


    const hash = hashEl ? hashEl.textContent : null;



    if (hash == lastHash) {
        return;
    }

    lastHash = hash

    let currentInvestEl = getElement(inputElSelector);

    console.log('CURRENT INVEST EL', currentInvestEl)

    if (currentInvestEl == undefined || currentInvestEl == null) {
        // clearInterval(handler);
        return;
    }
    let currentValue = parseFloat(currentInvestEl.value);


    console.log('LAST HASH: ', hash, scanSocket)
    scanSocket && scanSocket.send(JSON.stringify({
        command: 'classic-current'
        , hash
        , payload: hash
        , score: 0
        , amount: currentValue
    }))

}

function mainFunc(event) {
    console.log('Trendball started')
    initializeScanSocket()
    setInterval(() => {
        // check user is authorized or not
        // if (authorizedKey == null) {

        //     // let's get key when user login succeed!
        //     chrome.storage.local.get(['authorizedKey'], (result) => {

        //         if (result.authorizedKey) {
        //             console.log(result.authorizedKey)
        //             authorizedKey = result.authorizedKey
        //             if (socket == null) {
        //                 initializeSocket()
        //             }
        //         }
        //     });
        // }

        checkHash()
    }, 10);

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
            if (json.command == 'betting2x') {
                betting2x(json)
            } else if (json.command == 'betting1x') {
                betting1x(json)
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
    scanSocket = new WebSocket('ws://localhost:3000');


    scanSocket.onopen = function (e) {
        console.log('connected to bc engine server')
        scanSocket && scanSocket.send(JSON.stringify({
            command: 'id',
            id: 1
        }))
    };

    scanSocket.onmessage = async function (event) {
        try {
            const json = JSON.parse(event.data);
            console.log('JSON', json);
            if (json.command == 'betting2x') {
                betting2x(json)
            } else if (json.command == 'betting1/2x') {
                betting1x(json)
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

    scanSocket.onclose = function (event) {
        setTimeout(() => {
            initializeScanSocket();
        }, 3000)
    };
}