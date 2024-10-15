
const wss_endpoint = 'ws://localhost:33333'

let authorized = false
let socket = null
let key = null

let bcTabs = []
chrome.runtime.onInstalled.addListener(() => {
    console.log("Service worker is running!");
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == 'authorize') {
        key = request.key
        initializeSocket()
    }
});


chrome.action.onClicked.addListener((tab) => {
    const message = { action: "runMethod" }; // Define the action you want to trigger
    console.log('message====', tab.id)
    // chrome.tabs.sendMessage(tab.id, message, (response) => {
    //     if (chrome.runtime.lastError) {
    //         console.error("Error sending message:", chrome.runtime.lastError.message);
    //     } else {
    //         console.log("Response from content script:", response);
    //     }
    // });
});

const initializeSocket = () => {
    try {
        socket && socket.close()
    } catch (err) {

    }
    socket = new WebSocket(wss_endpoint);
    socket.onopen = (e) => {
        console.log('socket opened!')

        const data = {
            command: 'authorize',
            clientType: 'ext',
            key: key
        }
        socket && socket.send(JSON.stringify(data))

    };

    socket.onmessage = async (event) => {
        try {
            const json = JSON.parse(event.data);
            console.log('JSON', json);

            if (json.command == 'authorize') {
                if (json.payload == 'ok') {
                    authorized = true
                } else {
                    authorized = false
                    socket.close()
                }
            } else {
            }
        } catch (err) {

        }

    };

    socket.onclose = (event) => {
        if (authorized) {
            if (event.wasClean) {
                setTimeout(() => {
                    initializeSocket();
                }, 3000)
            } else {
                setTimeout(() => {
                    initializeSocket();
                }, 3000)
            }
        }

        socket = null
    };
}

const authorize = (key) => {
    if (socket) {
        socket && socket.send(JSON.stringify({
            command: 'authorize',
            clientType: 'ext',
            key: '123456'
        }))
    } else {
        initializeSocket({
            command: 'authorize',
            clientType: 'ext',
            key: '123456'
        });
    }
}