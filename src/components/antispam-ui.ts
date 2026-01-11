import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Guild } from 'discord.js';
import { getTranslation } from '../localization/index.js';
import db from '../database/index.js';

export function createAntiSpamEmbed(guild: Guild) {
    const settings = db.prepare('SELECT enabled, max_messages, time_window, action, mute_duration, log_channel_id FROM antispam_settings WHERE guild_id = ?').get(guild.id) as any || { enabled: 0, max_messages: 5, time_window: 5, action: 'mute', mute_duration: 300 };

    const actionText = settings.action === 'delete' ? 'Удаление' : settings.action === 'mute' ? 'Мут' : 'Кик';

    const embed = new EmbedBuilder()
        .setTitle('💬 Anti-Spam — Защита от спама')
        .setDescription('Ограничение частоты сообщений')
        .addFields(
            {
                name: '**Настройки:**', value: [
                    `• Лимит сообщений: **${settings.max_messages}** за **${settings.time_window}с**`,
                    `• Действие: **${actionText}**`,
                    settings.action === 'mute' ? `• Длительность мута: **${settings.mute_duration}с**` : '',
                    `• Канал логов: ${settings.log_channel_id ? `<#${settings.log_channel_id}>` : '#None'}`
                ].filter(Boolean).join('\n'), inline: false
            }
        )
        .setColor(settings.enabled ? 0x00ff00 : 0xff0000);

    const select = new StringSelectMenuBuilder()
        .setCustomId('antispam_select')
        .setPlaceholder('Выберите настройку...')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Порог спама')
                .setDescription('Количество сообщений и временное окно')
                .setValue('threshold')
                .setEmoji('⏱️'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Действие')
                .setDescription('Удаление, мут или кик')
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
        .setCustomId('toggle_antispam')
        .setLabel(' ')
        .setEmoji(settings.enabled ? '🟢' : '🔴')
        .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, toggleButton);

    return { embeds: [embed], components: [row1, row2] };
}
