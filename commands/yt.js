import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import ytdl from 'ytdl-core';
import * as Music from "../musicBots.js";
import ytpl from 'ytpl';
import { ChannelType } from 'discord.js';

function getPlaylist(url){
    const params = new URLSearchParams(url);
    if(params.has("list")){
        return params.get("list");
    };
}

export function command() {
    return {
        data: new SlashCommandBuilder()
            .setName('yt')
            .setDescription('Play youtube')
            .addStringOption(option =>
                option
                    .setName('url')
                    .setDescription('URL')
                    .setRequired(true)),
        async execute(interaction) {
            if(interaction.channel.type != ChannelType.GuildVoice){
                await interaction.reply({content: "Error: this isn't a voice channel", ephemeral: true});
                return;
            }

            const url = interaction.options.getString('url');
            const valid = ytdl.validateURL(url);
            const params = new URLSearchParams(url);
            var playlist = undefined;

            if(!valid){
                await interaction.reply({content: 'Bad URL', ephemeral: true});
                return;
            }
            
            if(params.has("list")) playlist = await ytpl(params.get("list"));

            var musicBot = await Music.getBot(interaction.channel);
            if(musicBot == undefined){
                console.log("Creating new musicBot for channel: " + interaction.channel.name);
                musicBot = await Music.createBot(interaction.channel);
            }
            var audioPlayer = musicBot.audioPlayer;

            //This is a playlist
            if(playlist != undefined) {
                console.log("Playlist items: " + playlist.items.length);
                //Start from index if it is provided
                let start = params.has("index") ? params.get("index") : 0;
                await interaction.reply({content: "Adding playlist...", ephemeral: true});
                for(let i = start; i < playlist.items.length; i++){
                    if(ytdl.validateURL(playlist.items[i].url)){
                        await musicBot.playlist.add(playlist.items[i].url, await ytdl.getInfo(playlist.items[i].url));
                    }
                }
                if(audioPlayer.state.status == 'idle') await musicBot.next();
            }
            //Else this is a single track
            else {
                musicBot.playlist.add(url, await ytdl.getInfo(url));
                console.log("STATUS: " + audioPlayer.state.status);
                if(audioPlayer.state.status == 'idle') await musicBot.next();
                await interaction.reply({content: "Added    (" + musicBot.playlist.tracks.length + " in queue)", ephemeral: true});
            }//interaction.deleteReply();
        },
    }
};