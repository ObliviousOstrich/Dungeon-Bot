import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import ytdl from 'ytdl-core';
import * as Music from "../musicBots.js";

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
            if(interaction.channel.type != 'voice'){
                await interaction.reply({content: "Error: this isn't a voice channel", ephemeral: true});
                return;
            }

            const url = interaction.options.getString('url');
            const valid = ytdl.validateURL(url);
            if(!valid){
                await interaction.reply({content: 'Bad URL', ephemeral: true});
                return;
            }
            var musicBot = await Music.getBot(interaction.channel);
            if(musicBot == undefined){
                console.log("Creating new musicBot for channel: " + interaction.channel.name);
                musicBot = await Music.createBot(interaction.channel);
            }
            var audioPlayer = musicBot.audioPlayer;

            
            musicBot.queue.add(url, await ytdl.getInfo(url));
            console.log("STATUS: " + audioPlayer.state.status);
            if(audioPlayer.state.status == 'idle') await musicBot.next();

            await interaction.reply({content: "Added    (" + musicBot.queue.tracks.length + " in queue)", ephemeral: true});
            interaction.deleteReply();
        },
    }
};