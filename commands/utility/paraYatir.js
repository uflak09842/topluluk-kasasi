const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { handleImageScan, insertOnayUser, sendErrorMessage, sendSuccessMessage } = require('../../para.js');
const { logChannel, avenger, apiKey } = require('../../config.json');

const axios = require('axios');
const FormData = require('form-data');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-yatir')
        .setDescription('Para yatırır')
        .addAttachmentOption((option) => option
            .setRequired(true)
            .setName('ss')
            .setDescription('Nitro Sahibi Değilseniz 8mb üstü dosya yükleyemezsiniz !')),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // Defer the reply immediately

        const API_KEY = apiKey;
        const client = interaction.client;
        const log = await client.channels.fetch(logChannel).catch(console.error);

        if (!log) {
            console.log('Log kanalı bulunamadı');
        }

        const time = Date.now();
        const userAvatar = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const attachment = interaction.options.getAttachment('ss');

        const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'];
        const fileName = attachment.name.toLowerCase();
        const isImage = imageExtensions.some(ext => fileName.endsWith(ext));

        if (!isImage) {
            return interaction.editReply({ content: 'Sadece resim dosyaları kabul edilir! (.png, .jpg, .jpeg, .webp, vb.)' });
        }

        async function uploadImageToImgbb(imageUrl) {
            try {
                const formData = new FormData();
                formData.append('key', API_KEY);
                formData.append('image', imageUrl);

                const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
                    headers: formData.getHeaders()
                });

                return response.data.success ? response.data.data.url : null;
            } catch (error) {
                console.error('ImgBB yükleme hatası:', error.message);
                return null;
            }
        }

        try {
            const imageUrl = await uploadImageToImgbb(attachment.url);
            if (!imageUrl) {
                return interaction.editReply({ content: 'Resim yükleme sırasında bir hata oluştu.' });
            }

            const sonuc = await handleImageScan(interaction);
            if (sonuc === null) {
                const hataEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Paranız Okunamadı !')
                    .setDescription("Doğru ss'i Attığınıza Emin Misiniz ?");
                return interaction.editReply({ embeds: [hataEmbed] });
            }

            await insertOnayUser(interaction.user.id, interaction.user.username, interaction.user.globalName, sonuc, imageUrl, userAvatar, time);
            
            const embed = new EmbedBuilder()
                .setColor('#036704')
                .setTitle('**Başarılı !**')
                .setDescription('Paranız Onay İçin Bekliyor...')
                .setImage(attachment.url)
                .setAuthor({ name: interaction.user.globalName || interaction.user.username || null, iconURL: userAvatar || null })
                .setTimestamp()
                .setFooter({ text: interaction.user.id });
            await interaction.editReply({ embeds: [embed], ephemeral: true });

            if (log) {
                await log.send(`<@${interaction.user.id}> Kasasına Para Yatırmak İstiyor ! <@&${avenger}>`)
                    .catch(e => console.error('Log gönderilemedi:', e));
            }
        } catch (error) {
            console.error('Komut işlenirken hata:', error);
            await interaction.editReply({ content: 'Bir hata oluştu, lütfen daha sonra tekrar deneyin.' });
        }
    },
};