import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Guild, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import db from '../database/index.js';

export function createAutoroleEmbed(guild: Guild) {
    const settings = db.prepare('SELECT enabled, role_id FROM autorole_settings WHERE guild_id = ?').get(guild.id) as any || { enabled: 0, role_id: null };

    const status = settings.enabled ? '🟢 Включено' : '🔴 Выключено';
    const currentRole = settings.role_id ? `<@&${settings.role_id}>` : 'Не установлена';

    const embed = new EmbedBuilder()
        .setTitle('🎭 Auto-Role System')
        .setDescription(`Настройка автоматической выдачи роли новым участникам.`)
        .addFields(
            { name: 'Статус', value: status, inline: true },
            { name: 'Роль', value: currentRole, inline: true }
        )
        .setColor(settings.enabled ? 0x00ff00 : 0xff0000)
        .setTimestamp();

    const select = new StringSelectMenuBuilder()
        .setCustomId('autorole_select')
        .setPlaceholder('Выберите действие...')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Установить роль')
                .setDescription('Выберите роль для авто-выдачи')
                .setValue('set_role')
                .setEmoji('🎭')
        );

    const toggleButton = new ButtonBuilder()
        .setCustomId('toggle_autorole')
        .setLabel(settings.enabled ? 'Выключить' : 'Включить')
        .setStyle(settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

    const backButton = new ButtonBuilder()
        .setCustomId('back_to_protection')
        .setLabel('Назад')
        .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(toggleButton, backButton);

    return { embeds: [embed], components: [row1, row2] };
}
