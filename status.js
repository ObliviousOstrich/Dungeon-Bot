import { Events, ActivityType } from "discord.js";
var subscribe;
var unsubscribe;
var client;

export function initialize(_client, _subscribe, _unsubscribe){
    console.log("initialize status");
    client = _client;
    subscribe = _subscribe;
    unsubscribe = _unsubscribe;
    subscribe(Events.ClientReady, clientReady);
}

async function clientReady(){
  await setStatus(ActivityType.Playing, "Phasmo 😈🤘🏼");
}

export async function setStatus(activity, message){
  await client.user.setPresence({
      activities: [{
        name: message,
        type: activity,
      },
    ],
    status: "online",
    });
}