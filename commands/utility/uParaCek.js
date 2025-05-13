const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { handleImageScan, insertUser, sendErrorMessage, sendSuccessMessage, insertPara } = require('../../para.js');
const { paraDb } = require('../../database.js');
const { logChannel, paraChannel, avenger, gVizier, yLider, lider } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kpara-cek')
        .setDescription('Belirttiğiniz Kullanıcının Hesabından Para Çeker.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Para Çekilecek Kullanıcı Seçin.')
                .setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName('miktar')
                .setDescription('Çekilecek Miktarı Girin.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const ROLE_IDS = [avenger, gVizier, yLider, lider];

        const hasRole = ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
        
        if (!hasRole) {
            return interaction.reply({ content: 'Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.', ephemeral: true });
        }

        const client = interaction.client;
        const log = await client.channels.fetch(logChannel);
        const para = await client.channels.fetch(paraChannel);

        const kullanici = interaction.options.getUser('kullanici');
        const miktar = interaction.options.getInteger('miktar')

        if(!log) {
            console.log('Log kanalı bulunamadı');
        }

        if(!para) {
            console.log('Para kanalı bulunamadı');
        }

        const time = Date.now();

        await insertPara(kullanici.id, kullanici.username, kullanici.globalName, -miktar, time);

        const userAvatar = kullanici.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const adminAvatar = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

        const onayLog = new EmbedBuilder()
        .setColor('Red')
        .setTitle('**-$**' + miktar + ' Para Çekildi !')
        .setDescription('Kullanıcı id: ' + kullanici.id)
        .setAuthor({ name: kullanici.globalName || kullanici.username || null, iconURL: userAvatar || null })
        .setTimestamp()
        .setFooter({ text: interaction.user.globalName + ' Tarafından.', iconURL: adminAvatar});

        await para.send({ embeds: [onayLog] })

        await interaction.reply({ content: 'Para çekme işleminiz Başarıyla Gerçekleşti !', ephemeral: true});

        const sql = `SELECT * FROM users`;
        paraDb.all(sql, [], async (err, rows) => {
            if (err) {
                console.error('Veri çekme hatası:', err.message);
                return interaction.reply({ content: 'Veri çekilirken hata oluştu.', ephemeral: true });
            }

            if (rows.length === 0) {
                return interaction.reply({ content: 'Onay bekleyen hiç kullanıcı yok.', ephemeral: true });
            }

        }); 
    },
};