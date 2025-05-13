const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { paraDb } = require('../../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('param')
		.setDescription('Kasadaki Toplam Paranızı Gösterir.'),
	async execute(interaction) {

        const sql = `SELECT para FROM users WHERE userId = ?`;
        
        paraDb.all(sql, [interaction.user.id], async (err, rows) => {
            if (err) {
                console.error('Veri çekme hatası:', err.message);
                return interaction.reply({ content: 'Veri çekilirken hata oluştu.', ephemeral: true });
            }

            if (rows.length === 0) {
                return interaction.reply({ content: 'Kasanızda Para Yok :/', ephemeral: true });
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

            const userAvatar = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
            const embed = new EmbedBuilder()
            .setColor('#278664')
            .setTitle(formattedPara)
            .setAuthor({ name: interaction.user.globalName, iconURL: userAvatar })
            .setTimestamp();

            await interaction.reply({embeds: [embed]})

        });

    },
};