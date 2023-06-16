import { Events, Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'url';

var subscribe;
var unsubscribe;
var client;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

//load commands
async function load(){
    for(const file of commandFiles){
        const filePath = path.join(commandsPath, file);
        console.log("Loading " + filePath);
        var command = (await import("file://" + filePath)).command();
        if('data' in command && 'execute' in command){
          client.commands.set(command.data.name, command);
        }
        else{
          console.log(`ERR: command at ${filePath} is invalid`);
        }
    }
}

export function initialize(_client, _subscribe, _unsubscribe){
    client = _client;
    client.commands = new Collection();
    console.log("initialize commands");
    subscribe = _subscribe;
    unsubscribe = _unsubscribe;
    subscribe(Events.MessageCreate, messageCreate);
    subscribe(Events.InteractionCreate, interactionCreate);
    load();
}

async function messageCreate(message){
    //console.log("commands.js: " + message.content);
}

async function interactionCreate(interaction){
    if(interaction.isChatInputCommand()){
        const command = interaction.client.commands.get(interaction.commandName);
        if(!command){
            console.error(`No command matching ${interaction.commandName} was found`);
            return;
        }
        
        try{
            await command.execute(interaction);
        }
        catch(error){
            console.error(error);
            if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    }
}