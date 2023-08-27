import * as http from 'http';
import * as Music from "../musicBots.js";
import express from "express";
import WebSocket from "ws";
import path from "node:path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Session {
    constructor(client, clientId, bot){
        this.client = client;
        this.musicBot = bot;
        this.clientId = clientId;
        console.log("client " + this.clientId + " joined.");

        this.disconnect = function(){
            console.log("Disconnecting");
            this.client.close();
            this.client.terminate();
        };

        this.message = function(data){

        };

        client.on("close", ()=>{
            console.log("client " + this.clientId + " left.");
            this.disconnect();
        });

        client.on("message", (data)=>{
            console.log("Data: " + data);
            var obj = JSON.parse(data);
            if(obj.action == "load"){
                if(bot == undefined){
                    this.musicBot = Music.getBotById(obj.id);
                    if(this.musicBot == undefined){ { this.client.close(); return; }}
                    this.client.send(JSON.stringify(this.musicBot.playlist.serialize()));
                    this.musicBot.event.on(Music.BotAction.NEXT, this.onNext);
                }
            }
        });

        this.onNext = function(){
            this.client.send(JSON.stringify(this.musicBot.playlist.serialize()));
        };
    }
}

var sessions = [];
const wss = new WebSocket.Server({port: 8080 });

function newClientId(){
    return Math.random() * 1000;
    var id = -1;
    while(id == -1){
        const t = Math.random() * 1000;
        for(let i = 0; i < sessions.length; i++){
            if(sessions[i].clientId == t) continue;
            else return t;
        }
    }
}

wss.on("connection", ws =>{
    console.log("Connection made");
    sessions.push(new Session(ws, newClientId(), undefined));
});

wss.on("close", () =>{
    var length = sessions.length;
    for(let i = 0; i < length; i++){
        const state = sessions[i].client.readyState;
        //Will this work????
        if(state == WebSocket.CLOSED || state == WebSocket.CLOSING){
            sessions[i].disconnect();
            sessions.splice(i, 1);
            i--;
            length--;
        }
    }
});

wss.on("message", data =>{
    console.log("Data: " + data);
    var obj = JSON.parse(data);
    if(obj.action == "load"){
        var bot = Music.getBotById(id);
        if(bot == undefined) { ws.close(); return; }
        sessions.push(new Session(ws, newClientId(), bot));
    }
    
    //channelId + action (add, skip, delete, reorder)
    //echo that action back to each other client to sync
    //send playlist as resourceID, metadata, user-who-requested
});

let app = express();

app.get("/", (req, res) => {
    const id = req.query.room;
    var bot = Music.getBotById(id);
    if(bot == undefined) { res.send("Unknown room ID"); return; }

    console.log("Loading " + __dirname + "/index.html");
    res.sendFile(path.join(__dirname, '/index.html'));
});

export function initialize(){
    app.listen(port, ()=>{
        console.log(`Server is running`);
    });
    // server.listen(port, host, ()=>{
    //     console.log(`Server is running on http://${host}:${port}`)
    // });
}

const host = 'localhost';
const port = 8000;

// const requestlistener = function(req, res){
//     console.log("REQ: = " + req.url);
//     var id = req.url.slice(1);
//     var bot = Music.getBotByID(id);
//     if(bot == undefined){
//         console.log("UNDEFINED BOT!");
//         res.end("<html><body><h1>Failed</h1></body></html>");
//         return;
//     }
//     else{
//         console.log("QUEUE LENGTH: " + bot.queue.tracks.length);
//     }
//     res.setHeader("Content-Type", "text/html");
//     res.writeHead(200);
//     res.end("<html><body><h1>Now Playing: " + bot.queue.current.title + "</h1></body></html>");
// }


// const server = http.createServer(requestlistener);
