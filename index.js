import {keepAlive} from "./server.js";
import { clientId, token } from './token.js';
import { Client, Events, GatewayIntentBits, Utils } from "discord.js";
import * as Commands from "./commands.js";
import * as Status from "./status.js";
import * as PrivateVoice from "./privateVoice.js";
import * as WebServer from "./webServer/main.js";

const client = new Client({ intents: [GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds, 512, 32768] });


//EVENT subscription
var eventSubscribers = [];
export function subscribe(event, callback){
    console.log("Subscriber: " + callback.name + " to " + event);
    eventSubscribers.push({
        event: event,
        func: callback
    });
}
export function unsubscribe(event, callback){
    for(let sub = 0; sub < eventSubscribers.length; sub++){
        if(eventSubscribers[sub].event == event){
            if(eventSubscribers[sub].func == callback){
                eventSubscribers.splice(sub, 1);
            }
        }
    }
}


//load commands
Commands.initialize(client, subscribe, unsubscribe);
Status.initialize(client, subscribe, unsubscribe);
PrivateVoice.initialize(client, subscribe, unsubscribe);
WebServer.initialize();


//EVENTS
client.on(Events.MessageCreate, async function(message){
    eventSubscribers.forEach(sub => {
        if(sub.event == Events.MessageCreate) sub.func(message);
    });
});

client.on(Events.VoiceStateUpdate, async function(oldState, newState) {
    eventSubscribers.forEach(sub => {
        if(sub.event == Events.VoiceStateUpdate) sub.func(oldState, newState);
    });
});

client.on(Events.InteractionCreate, async interaction => {
    eventSubscribers.forEach(sub => {
        if(sub.event == Events.InteractionCreate) sub.func(interaction);
    });
});

client.on(Events.ClientReady, async() =>{
    eventSubscribers.forEach(sub => {
        if(sub.event == Events.ClientReady) sub.func();
    });
});


keepAlive();
client.login(token);