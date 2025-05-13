const { Client, Collection, Events, GatewayIntentBits, PermissionFlagsBits, ActivityType } = require('discord.js');
const { token, allowedGuildIds, dbBackUpCh } = require('./config.json');

const fs = require('node:fs');
const path = require('node:path');

const schedule = require('node-schedule');

const { onayDb, paraDb } = require('./database.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const filePath = path.join(__dirname, 'para.db');

client.once(Events.ClientReady, async readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	const guilds = client.guilds.cache;

	for (const guild of guilds.values()) {
		if (!allowedGuildIds.includes(guild.id)) {
			console.log(`İzin verilmeyen sunucuya katıldı: ${guild.name} (ID: ${guild.id}). Sunucudan çıkılıyor.`);
			
			guild.leave()
				.then(() => {
					console.log(`Sunucudan başarıyla ayrıldı: ${guild.name}`);
				})
				.catch(console.error);
		} else {
			console.log(`Bot izin verilen sunucuya katıldı: ${guild.name}`);
		}
	}

	client.user.setPresence({
		activities: [{ name: `Çete Kasasını`, type: ActivityType.Watching }],
		status: 'online',
	});

	schedule.scheduleJob('0 0 * * *', async () => {
        try {
            const channel = await client.channels.fetch(dbBackUpCh);
            if (channel) {
                await channel.send({
                    content: "Günlük yedek dosyası: `para.db`",
                    files: [filePath],
                });
                console.log("para.db dosyası başarıyla gönderildi.");
            }
        } catch (error) {
            console.error("Dosya gönderiminde hata oluştu:", error);
        }
    });

});

client.on('guildCreate', (guild) => {
    if (!allowedGuildIds.includes(guild.id)) {
        console.log(`İzin verilmeyen sunucuya katıldı: ${guild.name} (ID: ${guild.id}). Sunucudan çıkılıyor.`);
        
        guild.leave()
            .then(() => {
                console.log(`Sunucudan başarıyla ayrıldı: ${guild.name}`);
            })
            .catch(console.error);
    } else {
        console.log(`Bot izin verilen sunucuya katıldı: ${guild.name}`);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'Komut kullanılırken bir hata oluştu!', ephemeral: true });
		} else {			
			await interaction.reply({ content: 'Komut kullanılırken bir hata oluştu!', ephemeral: true });
		}
	}
});

process.on('SIGINT', () => {
    console.log('Bot kapanıyor, veritabanı kapatılıyor...');
    onayDb.close((err) => {
        if (err) {
            console.error('onay Veritabanı kapatılırken hata oluştu:', err.message);
        } else {
            console.log('onay Veritabanı başarıyla kapatıldı.');
        }
        process.exit(0);
    });

	paraDb.close((err) => {
        if (err) {
            console.error('para Veritabanı kapatılırken hata oluştu:', err.message);
        } else {
            console.log('para Veritabanı başarıyla kapatıldı.');
        }
        process.exit(0);
    });
});

client.login(token);