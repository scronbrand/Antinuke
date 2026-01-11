import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Guild } from 'discord.js';
import { getTranslation } from '../localization/index.js';
import db from '../database/index.js';

export function createAntiWebhookEmbed(guild: Guild) {
    const settings = db.prepare('SELECT enabled, log_channel_id FROM antiwebhook_settings WHERE guild_id = ?').get(guild.id) as any || { enabled: 0 };
    const whitelist = db.prepare('SELECT user_id FROM antiwebhook_whitelist WHERE guild_id = ? LIMIT 10').all(guild.id) as { user_id: string }[];

    const embed = new EmbedBuilder()
        .setTitle('🪝 Anti-Webhook — Контроль вебхуков')
        .setDescription('Защита от несанкционированного создания вебхуков')
        .addFields(
            {
                name: '**Настройки:**', value: [
                    `• Канал логов: ${settings.log_channel_id ? `<#${settings.log_channel_id}>` : '#None'}`
                ].join('\n'), inline: false
            },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: '┃ **Белый список пользователей:**', value: whitelist.length ? whitelist.map(u => `• <@${u.user_id}>`).join('\n') : '• None', inline: false }
        )
        .setColor(settings.enabled ? 0x00ff00 : 0xff0000);

    const select = new StringSelectMenuBuilder()
        .setCustomId('antiwebhook_select')
        .setPlaceholder('Выберите настройку...')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Белый список')
                .setDescription('Кто может создавать вебхуки')
                .setValue('whitelist')
                .setEmoji('⚪'),
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
        .setCustomId('toggle_antiwebhook')
        .setLabel(' ')
        .setEmoji(settings.enabled ? '🟢' : '🔴')
        .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, toggleButton);

    return { embeds: [embed], components: [row1, row2] };
}
