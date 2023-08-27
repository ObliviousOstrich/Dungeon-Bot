import ytdl from 'ytdl-core';
import {entersState, VoiceConnectionStatus, joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "@discordjs/voice";
import events from 'events';
import { createId } from "./readableId.js";
import { inspect } from 'util';

export const BotAction = Object.freeze({
    NEXT: 'next',
    SKIP: 'skip',
    PAUSE: 'pause',
    QUIT: 'quit',
    ADD: 'add',
    REMOVE: 'remove',
    REORDER: 'reorder'
});

var musicBots = [];

export function getBot(channel){
    for(let i = 0; i < musicBots.length; i++){
        if(musicBots[i].guild == channel.guild &&
            musicBots[i].channel == channel){
                return musicBots[i];
            }
    }
}

export function getBotByChannelId(channelId){
    for(let i = 0; i < musicBots.length; i++){
        if(musicBots[i].channel.id == channelId){
                return musicBots[i];
            }
    }
}

export function getBotById(id){
    for(let i = 0; i < musicBots.length; i++){
        if(musicBots[i].id == id) return musicBots[i];
    }
}

function findBeginning(params){
    var begin = "0m0s";
    if(params.has("t")){
        if(params.get("t").includes("m")) return params.get("t");
        var minutes = 0;
        var seconds = parseInt(params.get("t"));
        if(seconds >= 60) {
            minutes = Math.floor(seconds / 60);
            seconds = Math.floor(seconds - (minutes * 60));
        }
        begin = minutes + "m" + seconds + "s";
    }
    return begin;
}

export async function createBot(_channel){
    const event = new events.EventEmitter();
    const id = createId();
    const playlist = {
        bot: undefined,
        tracks: [],
        current: undefined,
        serialize(){
            var tracks = [];
            for(let i = 0; i < this.tracks.length; i++){
                tracks.push({
                    title: this.tracks[i].metadata.title,
                    thumbnail: this.tracks[i].metadata.thumbnail,
                    duration: this.tracks[i].metadata.duration,
                    url: this.tracks[i].metadata.url
                });
            }
            return {
                action: "update",
                current: {
                    title: this.current.title,
                    thumbnail: this.current.thumbnail,
                    duration: this.current.duration,
                    url: this.current.url
                },
                tracks: tracks
            };
        },
        add(url, info){
            const params = new URLSearchParams(url);
            var stream;
            
            if(params.has("t")){
                //A stream that'll work with the begin option
                stream = ytdl(url, {
                    filter: "audioandvideo",
                    quality: "highest",
                    type: "ffmpeg",
                    begin: findBeginning(params)
                });
            }
            else stream = ytdl(url, {
                liveBuffer: 60000,
                filter: "audioonly",
                quality: "highestaudio",
                highWaterMark: 1 << 25,
                type: "opus"
            });
            var thumb = info.videoDetails.thumbnail.thumbnails[0]['url'];
            var resource = createAudioResource(stream, {
                metadata:{
                    title: info.videoDetails.title,
                    duration: info.videoDetails.lengthSeconds,
                    thumbnail: thumb,
                    url: url
                }
            });
            this.bot.event.emit(BotAction.ADD);
            this.tracks.push(resource);
        },
        next(){
            var resource = this.tracks.shift();
            this.current = resource.metadata;
            this.bot.event.emit(BotAction.NEXT);
            console.log("TRACKS: " + this.tracks.length);
            return resource;
        },
        empty(){
            return this.tracks.length == 0 ? true : false;
        },
    }

    const audioPlayer = createAudioPlayer();
    audioPlayer.on("stateChange", stateChange);

    const connection = await joinVoiceChannel({
        channelId: _channel.id,
        guildId: _channel.guild.id,
        adapterCreator: _channel.guild.voiceAdapterCreator,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    connection.subscribe(audioPlayer);

    async function next(){
        var song = playlist.next();
        console.log("Playing " + song.metadata.title);
        try{
            await audioPlayer.play(song);
        }
        catch(ex){
            console.log("ERROR - MusicBot.next() - audioPlayer.play");
            console.log(ex);
        }
    }

    async function skip(){
        event.emit(BotAction.SKIP);
        next();
    }

    function destroy(){
        for(let i = 0; i < musicBots.length; i++){
            if(musicBots[i].audioPlayer == audioPlayer) {
                console.log("Destroyed player in channel: " + musicBots[i].channel.name);
                event.emit(BotAction.QUIT);
                audioPlayer.stop();
                connection.destroy();
                musicBots.splice(i, 1);
                return true;
            }
        }
    }

    async function stateChange(a, b){
        if(b.status == 'idle'){
            if(!playlist.empty()) await next();
            else destroy();
        }
    }

    musicBots.push({
        id: id,
        guild: _channel.guild,
        audioPlayer: audioPlayer,
        connection: connection,
        channel: _channel,
        playlist: playlist,
        event: event,
        next: next,
        destroy: destroy
    });

    var index = musicBots.length - 1;
    console.log("Index= " + index);
    console.log(inspect(musicBots[index]));
    //console.log("ID= " + this.musicBots[index].id);
    musicBots[index].playlist.bot = musicBots[index];

    console.log("Created musicBot '" + id + "'");
    return musicBots[index];
}