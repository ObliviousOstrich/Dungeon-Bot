import { SlashCommandBuilder } from '@discordjs/builders';

import { join } from "../privateVoice.js";

export function command() {
    return {
	data: new SlashCommandBuilder()
		.setName('pw')
        .setDescription('enter room password')
        .addStringOption(option =>
            option
                .setName('password')
                .setDescription('Password')
                .setRequired(true)),
	async execute(interaction) {
        var response = "Incorrect password";
        if(join(interaction, interaction.options.getString('password'))){
            response = "Accepted";

            //console.log("PrivateVoice: Setting permissions for " + member.displayName);
            //privateChannel.permissionOverwrites.edit(member.user.id, { ViewChannel: true });
        }
        await interaction.reply({content: response, ephemeral: true});
        
        //member.voice.setChannel(privateChannel);
	},
}};