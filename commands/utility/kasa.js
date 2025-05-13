const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { paraDb } = require('../../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kasa')
		.setDescription('Kasadaki Toplam Parayı Gösterir.'),
	async execute(interaction) {

        const sql = `SELECT para FROM users`;
        
        paraDb.all(sql, [], async (err, rows) => {
            if (err) {
                console.error('Veri çekme hatası:', err.message);
                return interaction.reply({ content: 'Veri çekilirken hata oluştu.', ephemeral: true });
            }

            if (rows.length === 0) {
                return interaction.reply({ content: 'Kasa Boş :/', ephemeral: true });
            }

            let toplamPara = 0;

            rows.forEach(row => {
                toplamPara += row.para;
            });

            const formattedPara = toplamPara.toLocaleString('en-US', { 
                style: 'currency', 
                currency: 'USD', 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });

            const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle(formattedPara)
            //.setAuthor({ name: 'test', iconURL: 'test' })
            .setTimestamp();

            await interaction.reply({embeds: [embed]})

        });

    },
};