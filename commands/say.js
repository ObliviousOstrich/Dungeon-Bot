import { SlashCommandBuilder } from '@discordjs/builders';

export function command() {
    return {
	data: new SlashCommandBuilder()
		.setName('say')
        .setDescription('Speak as bot')
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('message')
                .setRequired(true)),
	async execute(interaction) {
        await interaction.reply({content: 'Done', ephemeral: true});
        interaction.deleteReply();
        await interaction.channel.send(interaction.options.getString('message'));
	},
}};