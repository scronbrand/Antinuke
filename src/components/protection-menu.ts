import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Guild } from 'discord.js';
import { getTranslation } from '../localization/index.js';

export function createProtectionMenu(guild: Guild) {
    const embed = new EmbedBuilder()
        .setTitle('🛡️ Система защиты сервера')
        .setDescription('Выберите модуль защиты для настройки:')
        .addFields(
            { name: '🔒 Anti-Nuke', value: 'Защита от массового удаления каналов, ролей и банов', inline: false },
            { name: '🤖 Anti-Bot', value: 'Контроль добавления ботов на сервер', inline: false },
            { name: '🔗 Anti-Link', value: 'Блокировка приглашений и подозрительных ссылок', inline: false },
            { name: '💬 Anti-Spam', value: 'Защита от спама сообщениями', inline: false },
            { name: '🪝 Anti-Webhook', value: 'Контроль создания вебхуков', inline: false },
            { name: '⚔️ Anti-Raid', value: 'Защита от массовых заходов (рейдов)', inline: false },
            { name: '🎭 Auto-Role', value: 'Автоматическая выдача ролей новым участникам', inline: false }
        )
        .setColor(0x2b2d31);

    const select = new StringSelectMenuBuilder()
        .setCustomId('protection_module_select')
        .setPlaceholder('Выберите модуль защиты...')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-Nuke')
                .setDescription('Защита от массового удаления')
                .setValue('antinuke')
                .setEmoji('🔒'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-Bot')
                .setDescription('Контроль добавления ботов')
                .setValue('antibot')
                .setEmoji('🤖'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-Link')
                .setDescription('Блокировка ссылок и приглашений')
                .setValue('antilink')
                .setEmoji('🔗'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-Spam')
                .setDescription('Защита от спам-сообщений')
                .setValue('antispam')
                .setEmoji('💬'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-Webhook')
                .setDescription('Контроль создания вебхуков')
                .setValue('antiwebhook')
                .setEmoji('🪝'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Anti-Raid')
                .setDescription('Защита от массовых заходов')
                .setValue('antiraid')
                .setEmoji('⚔️'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Auto-Role')
                .setDescription('Авто-выдача ролей')
                .setValue('autorole')
                .setEmoji('🎭')
        );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    return { embeds: [embed], components: [row] };
}
