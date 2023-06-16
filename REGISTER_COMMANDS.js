import { REST, Routes } from 'discord.js';
import { clientId, guildId, token } from './config.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
// Grab all the command files from the commands directory you created earlier
const folderPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    var command = (await import("file://" + filePath)).command();
    console.log("Test === " + command['test']);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();