import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, Guild } from 'discord.js';
import { getTranslation } from '../localization/index.js';

export function createWhitelistModal(guild: Guild) {
    const modal = new ModalBuilder()
        .setCustomId('whitelist_modal')
        .setTitle(getTranslation(guild.id, 'antinuke.modals.whitelist_title'));

    const userIdInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel(getTranslation(guild.id, 'antinuke.modals.user_id_label'))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
    modal.addComponents(row);

    return modal;
}

export function createAuditModal(guild: Guild) {
    const modal = new ModalBuilder()
        .setCustomId('audit_modal')
        .setTitle(getTranslation(guild.id, 'antinuke.menu.audit.label'));

    const channelIdInput = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel(getTranslation(guild.id, 'antinuke.modals.channel_id_label'))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelIdInput);
    modal.addComponents(row);

    return modal;
}

export function createBanRoleModal(guild: Guild) {
    const modal = new ModalBuilder()
        .setCustomId('ban_role_modal')
        .setTitle(getTranslation(guild.id, 'antinuke.menu.ban_role.label'));

    const roleIdInput = new TextInputBuilder()
        .setCustomId('role_id')
        .setLabel(getTranslation(guild.id, 'antinuke.modals.role_id_label'))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(roleIdInput);
    modal.addComponents(row);

    return modal;
}

export function createWarningsModal(guild: Guild) {
    const modal = new ModalBuilder()
        .setCustomId('warnings_modal')
        .setTitle(getTranslation(guild.id, 'antinuke.menu.warnings.label'));

    const countInput = new TextInputBuilder()
        .setCustomId('warnings_count')
        .setLabel(getTranslation(guild.id, 'antinuke.modals.warnings_label'))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(countInput);
    modal.addComponents(row);

    return modal;
}

export function createGroupsModal(guild: Guild) {
    const modal = new ModalBuilder()
        .setCustomId('groups_modal')
        .setTitle(getTranslation(guild.id, 'antinuke.menu.groups.label'));

    const roleIdInput = new TextInputBuilder()
        .setCustomId('role_id')
        .setLabel(getTranslation(guild.id, 'antinuke.modals.role_id_label'))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(roleIdInput);
    modal.addComponents(row);

    return modal;
}
