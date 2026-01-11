import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Guild } from 'discord.js';
import { getTranslation } from '../localization/index.js';
import db from '../database/index.js';

export function createAntiLinkEmbed(guild: Guild) {
    const settings = db.prepare('SELECT enabled, action, log_channel_id FROM antilink_settings WHERE guild_id = ?').get(guild.id) as any || { enabled: 0, action: 'delete' };
    const whitelist = db.prepare('SELECT channel_id FROM antilink_whitelist_channels WHERE guild_id = ? LIMIT 10').all(guild.id) as { channel_id: string }[];

    const actionText = settings.action === 'delete' ? 'Удаление' : settings.action === 'warn' ? 'Предупреждение' : 'Мут';

    const embed = new EmbedBuilder()
        .setTitle('🔗 Anti-Link — Блокировка ссылок')
        .setDescription('Защита от Discord-приглашений и подозрительных ссылок')
        .addFields(
            {
                name: '**Настройки:**', value: [
                    `• Действие: **${actionText}**`,
                    `• Канал логов: ${settings.log_channel_id ? `<#${settings.log_channel_id}>` : '#None'}`
                ].join('\n'), inline: false
            },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: '┃ **Разрешенные каналы:**', value: whitelist.length ? whitelist.map(c => `• <#${c.channel_id}>`).join('\n') : '• None', inline: false }
        )
        .setColor(settings.enabled ? 0x00ff00 : 0xff0000);

    const select = new StringSelectMenuBuilder()
        .setCustomId('antilink_select')
        .setPlaceholder('Выберите настройку...')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Разрешенные каналы')
                .setDescription('Где ссылки можно отправлять')
                .setValue('whitelist')
                .setEmoji('⚪'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Действие')
                .setDescription('Удаление, предупреждение или мут')
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
        .setCustomId('toggle_antilink')
        .setLabel(' ')
        .setEmoji(settings.enabled ? '🟢' : '🔴')
        .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, toggleButton);

    return { embeds: [embed], components: [row1, row2] };
}
