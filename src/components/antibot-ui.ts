import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Guild } from 'discord.js';
import { getTranslation } from '../localization/index.js';
import db from '../database/index.js';

export function createAntiBotEmbed(guild: Guild) {
    const settings = db.prepare('SELECT enabled, action, log_channel_id FROM antibot_settings WHERE guild_id = ?').get(guild.id) as any || { enabled: 0, action: 'kick' };
    const whitelist = db.prepare('SELECT bot_id FROM antibot_whitelist WHERE guild_id = ? LIMIT 10').all(guild.id) as { bot_id: string }[];

    const embed = new EmbedBuilder()
        .setTitle('🤖 Anti-Bot — Защита от ботов')
        .setDescription('Контроль добавления ботов на сервер')
        .addFields(
            {
                name: '**Настройки:**', value: [
                    `• Действие: **${settings.action === 'kick' ? 'Кик' : 'Бан'}**`,
                    `• Канал логов: ${settings.log_channel_id ? `<#${settings.log_channel_id}>` : '#None'}`
                ].join('\n'), inline: false
            },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: '┃ **Белый список ботов:**', value: whitelist.length ? whitelist.map(b => `• <@${b.bot_id}>`).join('\n') : '• None', inline: false }
        )
        .setColor(settings.enabled ? 0x00ff00 : 0xff0000);

    const select = new StringSelectMenuBuilder()
        .setCustomId('antibot_select')
        .setPlaceholder('Выберите настройку...')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Белый список ботов')
                .setDescription('Добавить или удалить бота')
                .setValue('whitelist')
                .setEmoji('⚪'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Действие')
                .setDescription('Кик или бан при добавлении')
                .setValue('action')
                .setEmoji('⚔️'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Канал логов')
                .setDescription('Куда отправлять уведомления')
                .setValue('log')
                .setEmoji('📋')
        );

    const backButton = new ButtonBuilder()
        .setCustomId('back_to_protection')
        .setLabel('Назад к выбору защиты')
        .setStyle(ButtonStyle.Secondary);

    const toggleButton = new ButtonBuilder()
        .setCustomId('toggle_antibot')
        .setLabel(' ')
        .setEmoji(settings.enabled ? '🟢' : '🔴')
        .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, toggleButton);

    return { embeds: [embed], components: [row1, row2] };
}
