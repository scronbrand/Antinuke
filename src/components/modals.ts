import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, Guild } from 'discord.js';
import { getTranslation } from '../localization/index.js';

export function createAutoroleModal() {
    const modal = new ModalBuilder()
        .setCustomId('autorole_modal')
        .setTitle('Настройка Auto-Role');

    const roleIdInput = new TextInputBuilder()
        .setCustomId('role_id')
        .setLabel('ID Роли')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('Введите ID роли');

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(roleIdInput);
    modal.addComponents(row);

    return modal;
}

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

export function createMemberRoleModal(guild: Guild) {
    const modal = new ModalBuilder()
        .setCustomId('member_role_modal')
        .setTitle(getTranslation(guild.id, 'antinuke.menu.member_role.label'));

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
        .setTitle(getTranslation(guild.id, 'antinuke.modals.role_id_label'));

    const roleIdInput = new TextInputBuilder()
        .setCustomId('role_id')
        .setLabel(getTranslation(guild.id, 'antinuke.modals.role_id_label'))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(roleIdInput);
    modal.addComponents(row);

    return modal;
}

// Anti-Bot Modals
export function createAntiBotWhitelistModal() {
    const modal = new ModalBuilder()
        .setCustomId('antibot_whitelist_modal')
        .setTitle('Белый список ботов');

    const botIdInput = new TextInputBuilder()
        .setCustomId('bot_id')
        .setLabel('ID Бота')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(botIdInput);
    modal.addComponents(row);

    return modal;
}

export function createAntiBotActionModal() {
    const modal = new ModalBuilder()
        .setCustomId('antibot_action_modal')
        .setTitle('Действие при добавлении бота');

    const actionInput = new TextInputBuilder()
        .setCustomId('action')
        .setLabel('Действие (kick или ban)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('kick');

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(actionInput);
    modal.addComponents(row);

    return modal;
}

export function createAntiBotLogModal() {
    const modal = new ModalBuilder()
        .setCustomId('antibot_log_modal')
        .setTitle('Канал логов');

    const channelInput = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel('ID Канала')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
    modal.addComponents(row);

    return modal;
}

// Anti-Link Modals
export function createAntiLinkWhitelistModal() {
    const modal = new ModalBuilder()
        .setCustomId('antilink_whitelist_modal')
        .setTitle('Разрешенные каналы');

    const channelInput = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel('ID Канала')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
    modal.addComponents(row);

    return modal;
}

export function createAntiLinkActionModal() {
    const modal = new ModalBuilder()
        .setCustomId('antilink_action_modal')
        .setTitle('Действие при отправке ссылки');

    const actionInput = new TextInputBuilder()
        .setCustomId('action')
        .setLabel('Действие (delete, warn или mute)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('delete');

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(actionInput);
    modal.addComponents(row);

    return modal;
}

export function createAntiLinkLogModal() {
    const modal = new ModalBuilder()
        .setCustomId('antilink_log_modal')
        .setTitle('Канал логов');

    const channelInput = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel('ID Канала')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
    modal.addComponents(row);

    return modal;
}

// Anti-Spam Modals
export function createAntiSpamThresholdModal() {
    const modal = new ModalBuilder()
        .setCustomId('antispam_threshold_modal')
        .setTitle('Порог спама');

    const maxMsgInput = new TextInputBuilder()
        .setCustomId('max_messages')
        .setLabel('Макс. сообщений')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('5');

    const timeInput = new TextInputBuilder()
        .setCustomId('time_window')
        .setLabel('Временное окно (секунды)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('5');

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(maxMsgInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);
    modal.addComponents(row1, row2);

    return modal;
}

export function createAntiSpamActionModal() {
    const modal = new ModalBuilder()
        .setCustomId('antispam_action_modal')
        .setTitle('Действие при спаме');

    const actionInput = new TextInputBuilder()
        .setCustomId('action')
        .setLabel('Действие (delete, mute или kick)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('mute');

    const durationInput = new TextInputBuilder()
        .setCustomId('mute_duration')
        .setLabel('Длительность мута (секунды, если mute)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('300');

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(actionInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput);
    modal.addComponents(row1, row2);

    return modal;
}

export function createAntiSpamLogModal() {
    const modal = new ModalBuilder()
        .setCustomId('antispam_log_modal')
        .setTitle('Канал логов');

    const channelInput = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel('ID Канала')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
    modal.addComponents(row);

    return modal;
}

// Anti-Webhook Modals
export function createAntiWebhookWhitelistModal() {
    const modal = new ModalBuilder()
        .setCustomId('antiwebhook_whitelist_modal')
        .setTitle('Белый список пользователей');

    const userInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID Пользователя')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(userInput);
    modal.addComponents(row);

    return modal;
}

export function createAntiWebhookLogModal() {
    const modal = new ModalBuilder()
        .setCustomId('antiwebhook_log_modal')
        .setTitle('Канал логов');

    const channelInput = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel('ID Канала')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
    modal.addComponents(row);

    return modal;
}

// Anti-Raid Modals
export function createAntiRaidThresholdModal() {
    const modal = new ModalBuilder()
        .setCustomId('antiraid_threshold_modal')
        .setTitle('Порог рейда');

    const thresholdInput = new TextInputBuilder()
        .setCustomId('join_threshold')
        .setLabel('Число входов')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('10');

    const timeInput = new TextInputBuilder()
        .setCustomId('time_window')
        .setLabel('Временное окно (секунды)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('10');

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(thresholdInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);
    modal.addComponents(row1, row2);

    return modal;
}

export function createAntiRaidActionModal() {
    const modal = new ModalBuilder()
        .setCustomId('antiraid_action_modal')
        .setTitle('Действие при рейде');

    const actionInput = new TextInputBuilder()
        .setCustomId('action')
        .setLabel('Действие (kick или ban)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('kick');

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(actionInput);
    modal.addComponents(row);

    return modal;
}

export function createAntiRaidLogModal() {
    const modal = new ModalBuilder()
        .setCustomId('antiraid_log_modal')
        .setTitle('Канал логов');

    const channelInput = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel('ID Канала')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
    modal.addComponents(row);

    return modal;
}
