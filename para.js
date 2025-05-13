// @ts-nocheck
const { EmbedBuilder } = require('discord.js');
const { onayDb, paraDb } = require('./database.js');

async function handleImageScan(interaction) {
    if(!interaction) {
        return;
    }
	const Lens = await import('chrome-lens-ocr');
	const lens = new Lens.default();

    const attachment = interaction.options.getAttachment('ss');

    const res = await lens.scanByURL(attachment.url).catch(console.error);
    if(!res) {
        return null;
    }
    const textMap = res.segments.map((x) => x.text); 

    const para = textMap.map((y) => {
        const match = y.match(/\$(\S+)/);
        return match ? match[1] : null;  
    }).filter(Boolean);

    return para.length === 0 ? null : para[0];
}

async function insertOnayUser(userId, userName, globalName, para, paraSs, userAvatar, time) {
    const sql = `INSERT INTO users (userId, userName, globalName, para, paraSs, userAvatar, time) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    await new Promise((resolve, reject) => {
        onayDb.run(sql, [userId, userName, globalName, para, paraSs, userAvatar, time], function(err) {
            if (err) {
                console.error('Veri eklenirken hata oluştu:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function insertUser(userId) {
    const sql = `INSERT OR IGNORE INTO Users (udc_id) VALUES (?)`;
    const params = [userId];

    await new Promise((resolve, reject) => {
        paraDb.run(sql, params, function (err) {
            if(err) {
                console.error('Veri eklenirken hata oluştu:', err.message);
                reject(err);
            } else {
                resolve();
            }
        })
    })
}

async function insertAdmin(adminId) {
    const sql = `INSERT OR IGNORE INTO Admins (adc_id) VALUES (?)`;
    const params = [adminId];

    await new Promise((resolve, reject) => {
        paraDb.run(sql, params, function (err) {
            if(err) {
                console.error('Veri eklenirken hata oluştu:', err.message);
                reject(err);
            } else {
                resolve();
            }
        })
    })
}

async function insertTransaction(udc_id, adc_id, para, adminNot, paraSs, talepZaman, talepKabulZaman) {
    const sql = `INSERT INTO Transactions (udc_id, adc_id, para, adminNot, paraSs, talepZaman, talepKabulZaman) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [udc_id, adc_id, para, adminNot, paraSs, talepZaman, talepKabulZaman];

    await new Promise((resolve, reject) => {
        paraDb.run(sql, params, function (err) {
            if(err) {
                console.error('Veri eklenirken hata oluştu:', err.message);
                reject(err);
            } else {
                resolve();
            }
        })
    })
}

async function sendErrorMessage(interaction) {
    const hataEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Paranız Okunamadı !')
        .setDescription("Doğru ss'i Attığınıza Emin Misiniz ?");
    await interaction.reply({ embeds: [hataEmbed], ephemeral: true });
}

async function sendSuccessMessage(interaction, sonuc, attachment, userAvatar) {
    const embed = new EmbedBuilder()
        .setColor('#036704')
        .setTitle('**Başarılı !**')
        .setDescription('Paranız Onay İçin Bekliyor...')
        .setImage(attachment || null)
        .setAuthor({ name: interaction.user.globalName || interaction.user.username || null, iconURL: userAvatar || null })
        .setTimestamp()
        .setFooter({ text: interaction.user.id });
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = {
    handleImageScan,
    sendErrorMessage,
    sendSuccessMessage,
    insertOnayUser,
    insertUser,
    insertAdmin,
    insertTransaction
};