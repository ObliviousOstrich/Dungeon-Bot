import ytdl from 'ytdl-core';
import {entersState, VoiceConnectionStatus, joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "@discordjs/voice";

var musicBots = [];

export function getBot(channel){
    for(let i = 0; i < musicBots.length; i++){
        if(musicBots[i].guild == channel.guild &&
            musicBots[i].channel == channel){
                return musicBots[i];
            }
    }
}

export async function createBot(_channel){
    const queue = {
        tracks: [],
        add(url, info){
            const stream = ytdl(url, {
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
            this.tracks.push(resource);
        },
        next(){
            var resource = this.tracks.shift();
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
        var song = queue.next();
        console.log("Playing " + song.metadata.title);
        await audioPlayer.play(song);
    }

    function destroy(){
        for(let i = 0; i < musicBots.length; i++){
            if(musicBots[i].audioPlayer == audioPlayer) {
                console.log("Destroyed player in channel: " + musicBots[i].channel.name);
                audioPlayer.stop();
                connection.destroy();
                musicBots.splice(i, 1);
                return true;
            }
        }
    }

    async function stateChange(a, b){
        if(b.status == 'idle'){
            if(!queue.empty()) await next();
            else destroy();
        }
    }

    musicBots.push({
        guild: _channel.guild,
        audioPlayer: audioPlayer,
        connection: connection,
        channel: _channel,
        queue: queue,
        next: next,
        destroy: destroy
    });

    return musicBots[musicBots.length - 1];
}