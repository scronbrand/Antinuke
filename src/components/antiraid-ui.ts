import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Guild } from 'discord.js';
import { getTranslation } from '../localization/index.js';
import db from '../database/index.js';

export function createAntiRaidEmbed(guild: Guild) {
    const settings = db.prepare('SELECT enabled, join_threshold, time_window, action, log_channel_id FROM antiraid_settings WHERE guild_id = ?').get(guild.id) as any || { enabled: 0, join_threshold: 10, time_window: 10, action: 'kick' };

    const actionText = settings.action === 'kick' ? 'Кик' : 'Бан';

    const embed = new EmbedBuilder()
        .setTitle('⚔️ Anti-Raid — Защита от рейдов')
        .setDescription('Обнаружение и блокировка массовых заходов')
        .addFields(
            {
                name: '**Настройки:**', value: [
                    `• Порог входа: **${settings.join_threshold}** участников за **${settings.time_window}с**`,
                    `• Действие: **${actionText}**`,
                    `• Канал логов: ${settings.log_channel_id ? `<#${settings.log_channel_id}>` : '#None'}`
                ].join('\n'), inline: false
            }
        )
        .setColor(settings.enabled ? 0x00ff00 : 0xff0000);

    const select = new StringSelectMenuBuilder()
        .setCustomId('antiraid_select')
        .setPlaceholder('Выберите настройку...')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Порог рейда')
                .setDescription('Количество входов и временное окно')
                .setValue('threshold')
                .setEmoji('⏱️'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Действие')
                .setDescription('Кик или бан при рейде')
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
        .setCustomId('toggle_antiraid')
        .setLabel(' ')
        .setEmoji(settings.enabled ? '🟢' : '🔴')
        .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, toggleButton);

    return { embeds: [embed], components: [row1, row2] };
}
