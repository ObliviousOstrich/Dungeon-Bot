import * as PrivateVoice from "../privateVoice.js";

import { SlashCommandBuilder } from '@discordjs/builders';

export function command() {
    return {
	data: new SlashCommandBuilder()
		.setName('party')
        .setDescription('Create a private room')
        .addStringOption(option =>
            option
                .setName('title')
                .setDescription('Name')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('password')
                .setDescription('Password')
                .setRequired(true))
        .addBooleanOption(option =>
            option
                .setName('nsfw')
                .setDescription('NSFW')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('description')
                .setDescription('Description')
                .setRequired(false)),
	async execute(interaction) {
        await PrivateVoice.create(interaction, interaction.options.getString('title'), interaction.options.getString('password'));
        //await interaction.reply({content: 'Done', ephemeral: true});
        //interaction.deleteReply();
	},
}};