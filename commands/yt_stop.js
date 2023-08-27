import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord.js';
import * as Music from "../musicBots.js";

export function command() {
    return {
        data: new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Stop youtube playback')
            .addStringOption(option =>
                option
                    .setName('url')
                    .setDescription('URL')
                    .setRequired(true)),
        async execute(interaction) {
            var response;
            if(interaction.channel.type != ChannelType.GuildVoice) response = "Error: this isn't a voice channel";
            var bot = Music.getBot(interaction.channel);
            if(bot == undefined && response == undefined) response = "Error: can't find the bot";
            else if(response == undefined) response = "Done";

            try{
                Music.getBot(interaction.channel)?.destroy();
            }
            catch(err){
                response = "Unknown error";
                console.log(err);
            }

            await interaction.reply({content: response, ephemeral: true});
            if(response == 'Done') interaction.deleteReply();
        },
    }
};