import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";

import { NewMessage } from "telegram/events/index.js";

//import { StringSession } from "telegram/sessions";
const apiId = 15656957;
const apiHash = "8649b036eaa222a593db6de15dd4281f";
//const stringSession = new StringSession("1AQAOMTQ5LjE1NC4xNzUuNTQBu5WVuhPIRP+M601Z369pEAU45pjJr1TUCPOwgsTr1WhVgxAF6IWHAfA1ImcDYQ5ESbT1w4DW+o2YhPT6CslV8RzW55YXLzsZxr3j4AQ1zmZcaP4vTavOsdATTEngEtUJTlO7J1PufRDDx7vEDL91HHJN+roSQNkwo41hUzJ0fisGdUUahcCZAQDzUrWLTLChxJbuBf0ApjxKxPCM4tI7cXxiDPSPeGU3htRS8kB9Lx/lnrXmmQU7w6FZbmlRy2TkiUgf3PwiW1EyBj2bmdE76JRKmVPQR9yrHKwXwhWZP6T+R4CqrZrLewuEJimLp82r4IGtKvpsdR2HHkqZ0FwtGfQ="); // fill this later with the value from session.save()
const stringSession = new StringSession("1AQAOMTQ5LjE1NC4xNzUuNTQBuxxA4kygiCxsqLJ4ar7Fb2zgQMhMgDqRN85feR7uriDjtElFe2qz7qF+SCpEZtSbiols2B/OZDD+WnrfGNDlys7ry2nWYIfznC5q430e7HmBJYUesS8yMAQMge0NCP2zPwtGMFl0UFFckWlzHVVDeJKw6AeU4f8Rf1/Cu1uoFIvvlwSFb0+tbOXdn715J7LboN3mUi8/cmaQOmGwPQGRNk29WsMbGd/R9o/DGqPmSoUC4yBeMaG0Jy/s3i4Nt6Np33BUut/VR5cAXAKaOms6l7GFN+mDM7Tksmgdrgv1pSEgqksDXXlwxB2hVIFLOK/SvZ8JRDe0TvF9nOHJDz+BmKQ="); // fill this later with the value from session.save()
let lastId = 0;
const boughtTokens = [];
(async () => {
    console.log("Loading interactive example...");
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: async () => await input.text("Please enter your number: "),
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () =>
            await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
    });
    console.log("You should now be connected.");
    console.log(client.session.save()); // Save this string to avoid logging in again

    const eventBulder = new NewMessage();
    eventBulder.incoming = true;
    client.addEventHandler((event) => {
        console.log(event);
        console.log("===================================================")

        if (event.originalUpdate) {
            //if (event.originalUpdate.message == 'UpdateNewChannelMessage')

            if (event.originalUpdate.message.id == lastId) return;

            lastId = event.originalUpdate.message.id;


            const regex = /kucoin\.com\/trade\/(\w+-\w+)/;
            const match = event.originalUpdate.message.match(regex);

            if (match) {
                const token = match[1]; // Output: ODDZ-USDT
                // needs to buy now!
                if (boughtTokens.includes(token)) {
                    console.log('Already bought', token);
                    return;
                }
                boughtTokens.push(token);
                // need to buy now.... with market price!


                const accounts = getAccounts();

                

            }

        }
    }, eventBulder)

    //await client.sendMessage("me", { message: "Hello!" });
    //await client.sendMessage("mega_pump_group", { message: "Hello!" });

    // setInterval(async() => {

    //     channels.map(async (chan, idx) => {
    //         const channel = chan;
    //         const index = idx;
    //         let params = {
    //             limit: 2,
    //         }
    //         if (channel.lastId != 0) {
    //             params.limit = 10;
    //             params.minId = channel.lastId - 1; 
    //         }

    //     })
    // }, 1000)

    //console.log(msg);
})();