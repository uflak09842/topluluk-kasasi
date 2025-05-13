const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { handleImageScan, insertUser, sendErrorMessage, sendSuccessMessage, insertPara } = require('../../para.js');
const { paraDb } = require('../../database.js');
const { logChannel, avenger, gVizier, yLider, lider } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-cek')
        .setDescription('Para çeker')
        .addAttachmentOption((option) => option
			.setRequired(true)
			.setName('ss')
			.setDescription('Nitro Sahibi Değilseniz 8mb üstü dosya yükleyemezsiniz !')),
    async execute(interaction) {
        const ROLE_IDS = [avenger, gVizier, yLider, lider];

        const hasRole = ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
        
        if (!hasRole) {
            return interaction.reply({ content: 'Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.', ephemeral: true });
        }

        const client = interaction.client;
        const log = await client.channels.fetch(logChannel);

        if(!log) {
            console.log('Log kanalı bulunamadı');
        }

        const time = Date.now();
        const userAvatar = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

        const attachment = interaction.options.getAttachment('ss');

        const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'];
        const fileName = attachment.name.toLowerCase();
        const isImage = imageExtensions.some(ext => fileName.endsWith(ext));

        if (!isImage) {
            return interaction.reply({ content: 'Sadece resim dosyaları kabul edilir! (.png, .jpg, .jpeg, .webp, vb.)', ephemeral: true });
        }

        const sonuc = await handleImageScan(interaction);

        if (sonuc === null) {
            await sendErrorMessage(interaction);
        } else {
            const temizParaStr = sonuc.replace(/,/g, '');
            const para = parseFloat(temizParaStr);

            await insertPara(interaction.user.id, interaction.user.username, interaction.user.globalName, -para, interaction.options.getAttachment('ss').url, userAvatar, time);

            const onayLog = new EmbedBuilder()
            .setColor('Red')
            .setTitle('**-$**' + sonuc + ' Para Çekildi !')
            .setDescription('Kullanıcı id: ' + interaction.user.id)
            .setImage(interaction.options.getAttachment('ss').url || null)
            .setAuthor({ name: interaction.user.globalName || interaction.user.username || null, iconURL: userAvatar || null })
            .setTimestamp();

            await log.send({ embeds: [onayLog] })

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
        }
    },
};