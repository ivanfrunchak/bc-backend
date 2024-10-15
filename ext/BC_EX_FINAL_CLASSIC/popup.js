const wss_endpoint = 'ws://localhost:33333'

document.getElementById("unlock").addEventListener("click", () => {
    const key = document.getElementById('key').value;

    if (key.trim() == '') {
        return
    } else {
        // chrome.runtime.sendMessage({ action: "authorize", key: key.trim() })

        authorize(key)
    }
    
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['key'], (result) => {
        if (result.key) {
            document.getElementById('key').value = result.key;
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("RECEVIED popup.js", request.message)
    if (request.message) {
        document.getElementById("message").textContent = request.message;
    }
});

const authorize = (key) => {
    try {
        socket && socket.close()
        socket = null
    } catch (err) {
        socket = null
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
                    chrome.storage.local.set({ key: key, authorizedKey: key });
                } else {
                    authorized = false
                    chrome.storage.local.set({ key: key, authorizedKey: null });
                    
                }
                socket.close()
            } else {
            }
        } catch (err) {

        }

    };

    socket.onclose = (event) => {
        socket = null
    };
}

