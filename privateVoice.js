import { StreamType, entersState, VoiceConnectionStatus, joinVoiceChannel } from "@discordjs/voice";
import { s } from "@sapphire/shapeshift";
import { ChannelType, PermissionsBitField, Events, Collection } from 'discord.js';


class Server {
    constructor(guild, subscribe, unsubscribe){
        this.privateChannels = [];
        this.category;
        this.guild = guild;
        this.subscribe = subscribe;
        this.unsubscribe = unsubscribe;
    }

    createPermissions(interaction, deny){
        var result = [
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.ReadMessageHistory],
            },
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.SendMessages],
            },
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.Speak],
            },
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.Stream],
            },
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.Connect],
            },
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.UseVAD],
            },
        ];
        if(deny){
            result.push(
                {
                    id: interaction.guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                }
            );
        }
        return result;
    }

    async createChannel(interaction, title, password){
        if(this.category == undefined) {
            this.category = await interaction.guild.channels.create({
                name: 'Private Rooms',
                type: ChannelType.GuildCategory,
                permissionOverwrites: this.createPermissions(interaction, true),
            });
            console.log("Created category");
        }

        for(let i = 0; i < this.privateChannels.length; i++){
            if(this.privateChannels[i].password == password){
                await interaction.reply({content: 'Error: Password in use', ephemeral: true});
                return;
            }
        }

        const channel = await interaction.guild.channels.create({
            name: title,
            type: ChannelType.GuildVoice,
            parent: this.category,
            permissionOverwrites: this.createPermissions(interaction, true),
        });

        const privateChannel = {
            channel: channel,
            password: password,
            onEvent(oldState, newState){
                console.log("onEvent called");
                if(oldState.channel == channel){
                    if(oldState.channel.members.size == 0){
                        console.log("Closing private channel: " + channel.name + " in " + channel.guild.name);
                        var server = findServer(oldState.channel.guild);
                        server.destroy(channel);
                    }
                }
        
            }                
        }
        this.privateChannels.push(privateChannel);
        this.subscribe(Events.VoiceStateUpdate, privateChannel.onEvent);//this.privateChannels[this.privateChannels.length - 1].privateChannel.onEvent);
        await interaction.reply({content: 'Done', ephemeral: true});
        return privateChannel;
    }

    gainAccess(interaction, password){
        for(let i = 0; i < this.privateChannels.length; i++){
            if(this.privateChannels[i].password == password){
                //Join
                this.privateChannels[i].channel.permissionOverwrites.edit(interaction.member.user.id, { ViewChannel: true });
                return true;
            }
        }
        return false;
    }

    destroy(channel){
        for(let i = 0; i < this.privateChannels.length; i++){
            if(this.privateChannels[i].channel = channel){
                channel.delete();
                this.unsubscribe(this.privateChannels[i].onEvent);
                this.privateChannels.splice(i, 1);
                if(this.privateChannels.length == 0){
                    this.category.delete();
                    this.category = undefined;
                }
            }
        }
    }


}


//need persistance in case the bot crashes while any are open
var servers = [];
var subscribe;
var unsubscribe;
var client;

export function initialize(_client, _subscribe, _unsubscribe){
    client = _client;
    console.log("initialize privateVoice");
    subscribe = _subscribe;
    unsubscribe = _unsubscribe;
}

function findServer(guild){
    for(let i = 0; i < servers.length; i++){
        if(servers[i].guild == guild) return servers[i];
    }
}

export function join(interaction, password){
    var server = findServer(interaction.guild);
    return server.gainAccess(interaction, password);
}

export async function create(interaction, title, password){
    for(let i = 0; i < servers.length; i++){
        if(servers[i].guild == interaction.guild){
            await servers[i].createChannel(interaction, title, password);
            return;
        }
    }
    const server = new Server(interaction.guild, subscribe, unsubscribe);
    servers.push(server);
    console.log("Server created");
    await server.createChannel(interaction, title, password);
}

// export function getChannel(interaciton, password){
//     for(let i = 0; i < privateChannels.length; i++){
//         if(privateChannels[i].guild == interaciton.guild &&
//             privateChannels[i].password == password){
//                 return privateChannels[i];
//             }
//     }
// }

// export async function createChannel(interaction){
//     var server = getServer(interaction.guild.id);
//     if(server == undefined) return false;

//     privateChannel = await interaction.guild.channels.create({
//         name: interaction.options.getString('title'),
//         type: ChannelType.GuildVoice,
//         parent: server.category,
//         permissionOverwrites: [
//             {
//                 id: interaction.guild.roles.everyone,
//                 deny: [PermissionsBitField.Flags.ViewChannel],
//             },
//             {
//                 id: interaction.user.id,
//                 allow: [PermissionsBitField.Flags.ViewChannel],
//             },
//         ],
//     });
// }

