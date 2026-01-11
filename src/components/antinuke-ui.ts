import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Guild } from 'discord.js';
import { getTranslation } from '../localization/index.js';
import db from '../database/index.js';

export function createAntinukeEmbed(guild: Guild) {
    const settings = db.prepare('SELECT log_channel_id, quarantine_role_id, max_warnings, enabled FROM guild_settings WHERE guild_id = ?').get(guild.id) as any || { max_warnings: 3, enabled: 1 };
    const whitelist = db.prepare('SELECT user_id FROM whitelist WHERE guild_id = ? LIMIT 10').all(guild.id) as { user_id: string }[];
    const groups = db.prepare('SELECT role_id FROM groups WHERE guild_id = ? LIMIT 10').all(guild.id) as { role_id: string }[];

    const embed = new EmbedBuilder()
        .setTitle(getTranslation(guild.id, 'antinuke.title'))
        .setDescription(getTranslation(guild.id, 'antinuke.description'))
        .addFields(
            {
                name: getTranslation(guild.id, 'antinuke.main_info'), value: [
                    getTranslation(guild.id, 'antinuke.quarantine_role', { role: settings.quarantine_role_id ? `<@&${settings.quarantine_role_id}>` : '@None' }),
                    getTranslation(guild.id, 'antinuke.log_channel', { channel: settings.log_channel_id ? `<#${settings.log_channel_id}>` : '#None' }),
                    getTranslation(guild.id, 'antinuke.max_warnings', { count: settings.max_warnings.toString() })
                ].join('\n'), inline: false
            },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: getTranslation(guild.id, 'antinuke.groups_title'), value: groups.length ? groups.map(g => `• <@&${g.role_id}>`).join('\n') : '• @everyone', inline: true },
            { name: getTranslation(guild.id, 'antinuke.whitelist_title'), value: whitelist.length ? whitelist.map(w => `• <@${w.user_id}>`).join('\n') : '• None', inline: true }
        )
        .setColor(0x2b2d31);

    const select = new StringSelectMenuBuilder()
        .setCustomId('antinuke_select')
        .setPlaceholder(getTranslation(guild.id, 'antinuke.select_action'))
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(getTranslation(guild.id, 'antinuke.menu.groups.label'))
                .setDescription(getTranslation(guild.id, 'antinuke.menu.groups.description'))
                .setValue('groups')
                .setEmoji('📁'),
            new StringSelectMenuOptionBuilder()
                .setLabel(getTranslation(guild.id, 'antinuke.menu.whitelist.label'))
                .setDescription(getTranslation(guild.id, 'antinuke.menu.whitelist.description'))
                .setValue('whitelist')
                .setEmoji('⚪'),
            new StringSelectMenuOptionBuilder()
                .setLabel(getTranslation(guild.id, 'antinuke.menu.audit.label'))
                .setDescription(getTranslation(guild.id, 'antinuke.menu.audit.description'))
                .setValue('audit')
                .setEmoji('📋'),
            new StringSelectMenuOptionBuilder()
                .setLabel(getTranslation(guild.id, 'antinuke.menu.ban_role.label'))
                .setDescription(getTranslation(guild.id, 'antinuke.menu.ban_role.description'))
                .setValue('ban_role')
                .setEmoji('🚫'),
            new StringSelectMenuOptionBuilder()
                .setLabel(getTranslation(guild.id, 'antinuke.menu.warnings.label'))
                .setDescription(getTranslation(guild.id, 'antinuke.menu.warnings.description'))
                .setValue('warnings')
                .setEmoji('⚠️')
        );

    const backButton = new ButtonBuilder()
        .setCustomId('back_to_protection')
        .setLabel(getTranslation(guild.id, 'antinuke.back_to_protection'))
        .setStyle(ButtonStyle.Secondary);

    const toggleButton = new ButtonBuilder()
        .setCustomId('toggle_antinuke')
        .setLabel(' ')
        .setEmoji(settings.enabled ? '🟢' : '🔴')
        .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, toggleButton);

    return { embeds: [embed], components: [row1, row2] };
}
