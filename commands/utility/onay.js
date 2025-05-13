// @ts-nocheck
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Embed, time, Events, ModalBuilder, TextInputStyle, TextInputBuilder } = require('discord.js');
const { onayDb } = require('../../database.js');
const { logChannel, paraChannel, avenger, gVizier, yLider, lider } = require('../../config.json');
const { insertUser, insertAdmin, insertTransaction } = require('../../para.js'); 

module.exports = {
	data: new SlashCommandBuilder()
		.setName('para-onay')
		.setDescription('Atılan paraları onaylar'),
	async execute(interaction) {
        const ROLE_IDS = [avenger, gVizier, yLider, lider];

        const hasRole = ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
        
        if (!hasRole) {
            return interaction.reply({ content: 'Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.', ephemeral: true });
        }

        const client = interaction.client;
        const log = await client.channels.fetch(logChannel);
        const paraCh = await client.channels.fetch(paraChannel);

        if(!log) {
            console.log('Log kanalı bulunamadı');
        }

        if(!paraCh) {
            console.log('Para kanalı bulunamadı');
        }

        const sql = `SELECT * FROM users`;

        var line = 0;

        onayDb.all(sql, [], async (err, rows) => {
            if (err) {
                console.error('Veri çekme hatası:', err.message);
                return interaction.reply({ content: 'Veri çekilirken hata oluştu.', ephemeral: true });
            }

            if (rows.length === 0) {
                return interaction.reply({ content: 'Onay bekleyen hiç kullanıcı yok.', ephemeral: true });
            }

            var adminNot;

            const onay = new ButtonBuilder()
                .setCustomId('onay')
                .setLabel('Onayla')
                .setStyle(ButtonStyle.Success);

            const reddet = new ButtonBuilder()
                .setCustomId('reddet')
                .setLabel('Reddet')
                .setStyle(ButtonStyle.Danger);

            const not = new ButtonBuilder()
                .setCustomId('not')
                .setLabel('Not')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(onay, reddet, not);
            
            const timestamp = Math.floor(rows[line].time);
            const date = new Date(timestamp)
            const options = {
                timeZone: 'Europe/Istanbul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };

            const formattedDate = date.toLocaleString('tr-TR', options);

            const createEmbed = (line) => {
                return new EmbedBuilder()
                    .setColor('#036704')
                    .setTitle('Hesaba Geçecek Tutar: ' + '$' + rows[line].para || 'empty')
                    .addFields(
                        { name: '**Zaman**', value: formattedDate || 'null'}
                    )
                    .setImage(rows[line].paraSs || null)
                    .setAuthor({ name: rows[line].globalName || rows[line].userName || null, iconURL: rows[line].userAvatar || null })
                    .setFooter({ text: rows[line].userId });
            };

            const response = await interaction.reply({ 
                content: `Onay bekleyen kullanıcılar:`, 
                embeds: [createEmbed(line)], 
                ephemeral: true, 
                components: [row] 
            });

            const collectorFilter = i => i.user.id === interaction.user.id;

            try {
                const collector = response.createMessageComponentCollector({ filter: collectorFilter, time: 60000 });

                collector.on('collect', async i => {
                    const userAvatar = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

                    if (i.customId === 'not') {
                        const modal = new ModalBuilder()
                            .setCustomId('notModal')
                            .setTitle('Notunuzu Girin');
                    
                        const notInput = new TextInputBuilder()
                            .setCustomId('notInput')
                            .setLabel("Notunuzu Girin.")
                            .setStyle(TextInputStyle.Paragraph);
                    
                        const notRow = new ActionRowBuilder().addComponents(notInput);
                        modal.addComponents(notRow);
                    
                        await i.showModal(modal);
                    
                        try {
                            // Modal submit'i bekle
                            const submitted = await i.awaitModalSubmit({
                                filter: (mInteraction) => 
                                    mInteraction.customId === 'notModal' &&
                                    mInteraction.user.id === i.user.id,
                                time: 60_000
                            });
                    
                            adminNot = submitted.fields.getTextInputValue('notInput');
                            await submitted.reply({ 
                                content: `Notunuz kaydedildi: **${adminNot}**`, 
                                ephemeral: true 
                            });
                    
                        } catch (error) {
                            console.error('Modal hatası:', error);
                            await i.followUp({ 
                                content: 'Not ekleme işlemi tamamlanamadı.', 
                                ephemeral: true 
                            });
                        }
                        return;
                    }

                    if(i.customId === 'onay') {
                        const onayTime = Date.now();

                        const temizParaStr = rows[line].para.replace(/,/g, '');
                        const para = parseFloat(temizParaStr);

                        await insertUser(rows[line].userId);
                        await insertAdmin(interaction.user.id);
                        await insertTransaction(rows[line].userId, interaction.user.id, para, adminNot, rows[line].paraSs, rows[line].time, onayTime);

                        const onayDateTime = new Date(onayTime)
                        const onayDate = onayDateTime.toLocaleString('tr-TR', options);

                        const onayLog = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('Para Gönderimi Kabul Edildi ! \n' + '$' + rows[line].para)
                        .setDescription('Kullanıcı id: ' + rows[line].userId)
                        .addFields(
                            { name: 'Talep Zamanı', value: formattedDate, inline: true},
                            { name: 'Talep Kabul Zamanı', value: onayDate, inline: true},
                        )
                        .setImage(rows[line].paraSs || null)
                        .setAuthor({ name: rows[line].globalName || rows[line].userName || null, iconURL: rows[line].userAvatar || null })
                        .setFooter({ text: interaction.user.globalName + ' Tarafından Onaylandı.', iconURL: userAvatar || null});

                        const sqlDel = `DELETE FROM users WHERE id = ?`;

                        onayDb.run(sqlDel, [rows[line].id], function(err) {
                            if (err) {
                                console.error('Veri silme hatası:', err.message);
                                return i.update({ content: 'Kullanıcı silinirken hata oluştu.', components: [], embeds: [] });
                            }

                            if (this.changes === 0) {
                                return i.update({ content: 'Belirtilen kullanıcı bulunamadı.', components: [], embeds: [] });
                            }
                        });

                        await paraCh.send({ embeds: [onayLog] })

                        line++;
                    }

                    if(i.customId === 'reddet') {
                        const time = Date.now();

                        const redDateTime = new Date(time)
                        const redDate = redDateTime.toLocaleString('tr-TR', options);

                        const redDm = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(formattedDate + ' Tarihindeki Para Gönderim Talebiniz Yetkili Tarafından Reddedildi \n' + '$' + rows[line].para || 'empty')
                        .setDescription(adminNot || 'Açıklama Yok')
                        .setImage(rows[line].paraSs || null)
                        .setAuthor({ name: rows[line].globalName || rows[line].userName || null, iconURL: rows[line].userAvatar || null })
                        .setFooter({ text: rows[line].userId });

                        const redLog = new EmbedBuilder()
                        .setColor('Orange')
                        .setTitle('Para Gönderimi Reddedildi !')
                        .setDescription('Kullanıcı id: ' + rows[line].userId)
                        .addFields(
                            { name: 'Talep Zamanı', value: formattedDate, inline: true},
                            { name: 'Talep Red Zamanı', value: redDate, inline: true},
                        )
                        .setImage(rows[line].paraSs || null)
                        .setAuthor({ name: rows[line].globalName || rows[line].userName || null, iconURL: rows[line].userAvatar || null })
                        .setFooter({ text: interaction.user.globalName + ' Tarafından Reddedildi.', iconURL: userAvatar || null});

                        const sqlDel = `DELETE FROM users WHERE id = ?`;

                        onayDb.run(sqlDel, [rows[line].id], function(err) {
                            if (err) {
                                console.error('Veri silme hatası:', err.message);
                                return i.update({ content: 'Kullanıcı silinirken hata oluştu.', components: [], embeds: [] });
                            }

                            if (this.changes === 0) {
                                return i.update({ content: 'Belirtilen kullanıcı bulunamadı.', components: [], embeds: [] });
                            }
                        });

                        var dmMessage;
                        try {
                            const user = await client.users.fetch(rows[line].userId);
                            await user.send({ embeds: [redDm] });
                        } catch (err) {
                            if (err.rawError.code === 50007) {
                                dmMessage = "**Kullanıcının DM'i Kapalı**";
                            } else {
                                console.error("DM gönderim hatası:", err);
                            }
                        }

                        await log.send({ 
                            content: dmMessage ? dmMessage : undefined, 
                            embeds: [redLog] 
                        });

                        line++;
                    }

                    if (line < rows.length) {
                        await i.update({ embeds: [createEmbed(line)] });
                    } else {
                        await i.update({ content: 'Onay Bekleyen Kullanıcı Kalmadı', components: [], embeds: [] });
                        collector.stop();
                    }
                });

                collector.on('end', async () => {
                    if (line >= rows.length) return;
                    await interaction.editReply({ content: '1 dakikadır işlem yapılmadı, kapanıyor.', components: [], embeds: [] });
                });

            } catch (e) {
                console.error(e);
                await interaction.editReply({ content: '1 dakikadır işlem yapılmadı, kapanıyor.', components: [], embeds: [] });
            }
        });
    },
};