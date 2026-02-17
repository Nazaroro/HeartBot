require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    Events, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    ChannelType 
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

console.log("Бот запускається...");

// --------- СЛЕШ-КОМАНДА ---------
const commands = [
    new SlashCommandBuilder()
        .setName('farm')               
        .setDescription('Фармить на вишці')
].map(cmd => cmd.toJSON());

// --------- ПІДКЛЮЧЕННЯ БОТА І ОНОВЛЕННЯ КОМАНД ---------
client.once(Events.ClientReady, async () => {
    console.log(`✅ Бот онлайн як ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        // ---- ДОДАЄМО /farm ----
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, '1473112469051412530'), // <-- встав свій ID сервера
            { body: commands }
        );
        console.log('Команда /farm додана ✅');

    } catch (err) {
        console.error(err);
    }
});

// --------- ОБРОБКА ВЗАЄМОДІЙ ---------
client.on(Events.InteractionCreate, async interaction => {

    // Slash команда /farm
    if (interaction.isChatInputCommand() && interaction.commandName === 'farm') {
        const modal = new ModalBuilder()
            .setCustomId('towerModal')
            .setTitle('Фармить на вишці');

        const whoInput = new TextInputBuilder()
            .setCustomId('who')
            .setLabel('Хто фармить? (!!!ЗАЛИШИТИ ПОЛЕ ПОРОЖНІМ!!!)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false); // <-- поле НЕ обов'язкове

        const towerInput = new TextInputBuilder()
            .setCustomId('tower')
            .setLabel('Номер вишки')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const timeInput = new TextInputBuilder()
            .setCustomId('time')
            .setLabel('На скільки часу?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(whoInput),
            new ActionRowBuilder().addComponents(towerInput),
            new ActionRowBuilder().addComponents(timeInput)
        );

        await interaction.showModal(modal);
    }

    // Обробка модалі
    if (interaction.isModalSubmit() && interaction.customId === 'towerModal') {
        let whoInput = interaction.fields.getTextInputValue('who').trim();
        const tower = interaction.fields.getTextInputValue('tower');
        const time = interaction.fields.getTextInputValue('time');

        // Автоматичний тег, якщо поле порожнє
        let who;
        if (!whoInput) {
            who = `<@${interaction.user.id}>`;
        } else if (/^\d+$/.test(whoInput)) {
            who = `<@${whoInput}>`;
        } else {
            who = whoInput;
        }

        // Знаходимо форум-канал "id"
        const forumChannel = await interaction.guild.channels.fetch('1473125424325459968');

if (!forumChannel || forumChannel.type !== ChannelType.GuildForum)
    return interaction.reply({ content: '❌ Форум-канал не знайдено або це не форум!', ephemeral: true });

        // Створюємо thread у форумі
        await forumChannel.threads.create({
            name: `Вишка — ${tower}`,
            autoArchiveDuration: 1440,
            message: {
                content:
                    `🗼 **Вишка:** ${tower}\n` +
                    `👤 **Хто:** ${who}\n` +
                    `⏳ **Час:** ${time}\n` +
                    `📢 **Статус:** Фармить ❌`,
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('leave')
                            .setLabel('Закінчив фарм ✅')
                            .setStyle(ButtonStyle.Success)
                    )
                ]
            }
        });

        await interaction.reply({ content: 'Гілку створено ✅', ephemeral: true });
    }

    // Кнопка "Закінчив фарм"
    if (interaction.isButton() && interaction.customId === 'leave') {
        await interaction.update({
            content: interaction.message.content.replace('Фармить ❌', 'Закінчив фарм ✅'),
            components: []
        });
    }

});

client.login(process.env.TOKEN);
