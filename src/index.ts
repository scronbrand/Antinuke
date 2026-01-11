import { Client, GatewayIntentBits, AuditLogEvent, Events, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { config } from './config.js';
import { checkAction } from './logic/anti-nuke.js';
import { checkBotAddition } from './logic/anti-bot.js';
import { checkMessage } from './logic/anti-link.js';
import { checkSpam } from './logic/anti-spam.js';
import { checkWebhook } from './logic/anti-webhook.js';
import { checkRaid } from './logic/anti-raid.js';
import { createAntinukeEmbed } from './components/antinuke-ui.js';
import { createAntiBotEmbed } from './components/antibot-ui.js';
import { createAntiLinkEmbed } from './components/antilink-ui.js';
import { createAntiSpamEmbed } from './components/antispam-ui.js';
import { createAntiWebhookEmbed } from './components/antiwebhook-ui.js';
import { createAntiRaidEmbed } from './components/antiraid-ui.js';
import { createProtectionMenu } from './components/protection-menu.js';
import {
    createWhitelistModal, createAuditModal, createBanRoleModal, createWarningsModal, createGroupsModal,
    createAntiBotWhitelistModal, createAntiBotActionModal, createAntiBotLogModal,
    createAntiLinkWhitelistModal, createAntiLinkActionModal, createAntiLinkLogModal,
    createAntiSpamThresholdModal, createAntiSpamActionModal, createAntiSpamLogModal,
    createAntiWebhookWhitelistModal, createAntiWebhookLogModal,
    createAntiRaidThresholdModal, createAntiRaidActionModal, createAntiRaidLogModal
} from './components/modals.js';
import { getTranslation } from './localization/index.js';
import db from './database/index.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildWebhooks,
    ],
});

client.once(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('antinuke')
            .setDescription('Open Anti-Nuke configuration dashboard')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('setlang')
            .setDescription('Change bot language')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(opt => opt.setName('lang').setDescription('Language code (ru/en)').setRequired(true).addChoices({ name: 'Russian', value: 'ru' }, { name: 'English', value: 'en' }))
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
});

// Protection Module Event Listeners
client.on(Events.GuildAuditLogEntryCreate, async (auditLog, guild) => {
    const { action, executorId } = auditLog;
    if (!executorId) return;

    const suspiciousActions = [
        AuditLogEvent.ChannelDelete,
        AuditLogEvent.RoleDelete,
        AuditLogEvent.MemberBanAdd,
        AuditLogEvent.MemberKick,
        AuditLogEvent.MemberUpdate,
        AuditLogEvent.GuildUpdate,
    ];

    if (suspiciousActions.includes(action)) {
        const executor = await client.users.fetch(executorId).catch(() => null);
        if (executor && !executor.bot) {
            await checkAction(guild, executor, action);
        }
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    await checkBotAddition(member);
    await checkRaid(member);
});

client.on(Events.MessageCreate, async (message) => {
    await checkMessage(message);
    await checkSpam(message);
});

client.on(Events.WebhooksUpdate, async (channel) => {
    if (channel.guild) {
        await checkWebhook(channel.guild, channel.id);
    }
});

// Interaction Handler
client.on(Events.InteractionCreate, async (interaction) => {
    // Permission check
    if (interaction.isCommand() || interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            const msg = getTranslation(interaction.guildId || '', 'antinuke.messages.no_permission');
            if (interaction.isRepliable()) {
                await interaction.reply({ content: msg, ephemeral: true });
            }
            return;
        }
    }

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'antinuke') {
            const response = createAntinukeEmbed(interaction.guild!);
            await interaction.reply(response);
        }

        if (interaction.commandName === 'setlang') {
            const lang = interaction.options.getString('lang')!;
            db.prepare('INSERT INTO guild_settings (guild_id, language) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET language = ?').run(interaction.guildId, lang, lang);
            await interaction.reply({ content: `Language set to ${lang === 'ru' ? 'Russian' : 'English'}!`, ephemeral: true });
        }
    }

    if (interaction.isStringSelectMenu()) {
        const guildId = interaction.guildId!;

        // Protection module selection
        if (interaction.customId === 'protection_module_select') {
            const module = interaction.values[0];
            const responses: Record<string, any> = {
                'antinuke': createAntinukeEmbed(interaction.guild!),
                'antibot': createAntiBotEmbed(interaction.guild!),
                'antilink': createAntiLinkEmbed(interaction.guild!),
                'antispam': createAntiSpamEmbed(interaction.guild!),
                'antiwebhook': createAntiWebhookEmbed(interaction.guild!),
                'antiraid': createAntiRaidEmbed(interaction.guild!)
            };
            await interaction.reply(responses[module] || { content: `Модуль ${module} в разработке.`, ephemeral: true });
        }

        // Anti-Nuke select
        if (interaction.customId === 'antinuke_select') {
            const action = interaction.values[0];
            const modals: Record<string, any> = {
                'whitelist': createWhitelistModal(interaction.guild!),
                'audit': createAuditModal(interaction.guild!),
                'ban_role': createBanRoleModal(interaction.guild!),
                'warnings': createWarningsModal(interaction.guild!),
                'groups': createGroupsModal(interaction.guild!)
            };
            await interaction.showModal(modals[action]);
        }

        // Anti-Bot select
        if (interaction.customId === 'antibot_select') {
            const action = interaction.values[0];
            const modals: Record<string, any> = {
                'whitelist': createAntiBotWhitelistModal(),
                'action': createAntiBotActionModal(),
                'log': createAntiBotLogModal()
            };
            await interaction.showModal(modals[action]);
        }

        // Anti-Link select
        if (interaction.customId === 'antilink_select') {
            const action = interaction.values[0];
            const modals: Record<string, any> = {
                'whitelist': createAntiLinkWhitelistModal(),
                'action': createAntiLinkActionModal(),
                'log': createAntiLinkLogModal()
            };
            await interaction.showModal(modals[action]);
        }

        // Anti-Spam select  
        if (interaction.customId === 'antispam_select') {
            const action = interaction.values[0];
            const modals: Record<string, any> = {
                'threshold': createAntiSpamThresholdModal(),
                'action': createAntiSpamActionModal(),
                'log': createAntiSpamLogModal()
            };
            await interaction.showModal(modals[action]);
        }

        // Anti-Webhook select
        if (interaction.customId === 'antiwebhook_select') {
            const action = interaction.values[0];
            const modals: Record<string, any> = {
                'whitelist': createAntiWebhookWhitelistModal(),
                'log': createAntiWebhookLogModal()
            };
            await interaction.showModal(modals[action]);
        }

        // Anti-Raid select
        if (interaction.customId === 'antiraid_select') {
            const action = interaction.values[0];
            const modals: Record<string, any> = {
                'threshold': createAntiRaidThresholdModal(),
                'action': createAntiRaidActionModal(),
                'log': createAntiRaidLogModal()
            };
            await interaction.showModal(modals[action]);
        }
    }

    if (interaction.isModalSubmit()) {
        const guildId = interaction.guildId!;
        let responseEmbed: EmbedBuilder | null = null;
        let refreshFunction: any = null;

        // Anti-Nuke modals
        if (interaction.customId === 'whitelist_modal') {
            const userId = interaction.fields.getTextInputValue('user_id');
            const exists = db.prepare('SELECT 1 FROM whitelist WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
            if (exists) {
                db.prepare('DELETE FROM whitelist WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Белый список обновлен')
                    .setDescription(`Пользователь <@${userId}> **удален** из белого списка.`)
                    .setColor(0xff0000)
                    .setTimestamp();
            } else {
                db.prepare('INSERT INTO whitelist (guild_id, user_id) VALUES (?, ?)').run(guildId, userId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Белый список обновлен')
                    .setDescription(`Пользователь <@${userId}> **добавлен** в белый список.`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            }
            refreshFunction = () => createAntinukeEmbed(interaction.guild!);
        }

        if (interaction.customId === 'audit_modal') {
            const channelId = interaction.fields.getTextInputValue('channel_id');
            db.prepare('INSERT INTO guild_settings (guild_id, log_channel_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = ?').run(guildId, channelId, channelId);
            responseEmbed = new EmbedBuilder()
                .setTitle('— • Канал логов установлен')
                .setDescription(`Канал для логов: <#${channelId}>`)
                .setColor(0x00ff00)
                .setTimestamp();
            refreshFunction = () => createAntinukeEmbed(interaction.guild!);
        }

        if (interaction.customId === 'ban_role_modal') {
            const roleId = interaction.fields.getTextInputValue('role_id');
            db.prepare('INSERT INTO guild_settings (guild_id, quarantine_role_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET quarantine_role_id = ?').run(guildId, roleId, roleId);
            responseEmbed = new EmbedBuilder()
                .setTitle('— • Роль карантина установлена')
                .setDescription(`Роль карантина: <@&${roleId}>`)
                .setColor(0x00ff00)
                .setTimestamp();
            refreshFunction = () => createAntinukeEmbed(interaction.guild!);
        }

        if (interaction.customId === 'warnings_modal') {
            const count = parseInt(interaction.fields.getTextInputValue('warnings_count'));
            if (!isNaN(count) && count > 0 && count <= 10) {
                db.prepare('INSERT INTO guild_settings (guild_id, max_warnings) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET max_warnings = ?').run(guildId, count, count);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Количество предупреждений')
                    .setDescription(`Максимальное количество предупреждений: **${count}**`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            } else {
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Ошибка')
                    .setDescription('Некорректное значение. Используйте число от 1 до 10.')
                    .setColor(0xff0000)
                    .setTimestamp();
            }
            refreshFunction = () => createAntinukeEmbed(interaction.guild!);
        }

        if (interaction.customId === 'groups_modal') {
            const roleId = interaction.fields.getTextInputValue('role_id');
            const exists = db.prepare('SELECT 1 FROM groups WHERE guild_id = ? AND role_id = ?').get(guildId, roleId);
            if (exists) {
                db.prepare('DELETE FROM groups WHERE guild_id = ? AND role_id = ?').run(guildId, roleId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Группа удалена')
                    .setDescription(`Роль <@&${roleId}> **удалена** из групп.`)
                    .setColor(0xff0000)
                    .setTimestamp();
            } else {
                db.prepare('INSERT INTO groups (guild_id, role_id) VALUES (?, ?)').run(guildId, roleId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Группа добавлена')
                    .setDescription(`Роль <@&${roleId}> **добавлена** в группы.`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            }
            refreshFunction = () => createAntinukeEmbed(interaction.guild!);
        }

        // Anti-Bot modals
        if (interaction.customId === 'antibot_whitelist_modal') {
            const botId = interaction.fields.getTextInputValue('bot_id');
            const exists = db.prepare('SELECT 1 FROM antibot_whitelist WHERE guild_id = ? AND bot_id = ?').get(guildId, botId);
            if (exists) {
                db.prepare('DELETE FROM antibot_whitelist WHERE guild_id = ? AND bot_id = ?').run(guildId, botId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Anti-Bot обновлен')
                    .setDescription(`Бот <@${botId}> **удален** из белого списка.`)
                    .setColor(0xff0000)
                    .setTimestamp();
            } else {
                db.prepare('INSERT INTO antibot_whitelist (guild_id, bot_id) VALUES (?, ?)').run(guildId, botId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Anti-Bot обновлен')
                    .setDescription(`Бот <@${botId}> **добавлен** в белый список.`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            }
            refreshFunction = () => createAntiBotEmbed(interaction.guild!);
        }

        if (interaction.customId === 'antibot_action_modal') {
            const action = interaction.fields.getTextInputValue('action');
            if (action === 'kick' || action === 'ban') {
                db.prepare('INSERT INTO antibot_settings (guild_id, action) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET action = ?').run(guildId, action, action);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Действие установлено')
                    .setDescription(`Действие при добавлении бота: **${action}**`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            } else {
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Ошибка')
                    .setDescription('Некорректное действие. Используйте: **kick** или **ban**')
                    .setColor(0xff0000)
                    .setTimestamp();
            }
            refreshFunction = () => createAntiBotEmbed(interaction.guild!);
        }

        if (interaction.customId === 'antibot_log_modal') {
            const channelId = interaction.fields.getTextInputValue('channel_id');
            db.prepare('INSERT INTO antibot_settings (guild_id, log_channel_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = ?').run(guildId, channelId, channelId);
            responseEmbed = new EmbedBuilder()
                .setTitle('— • Канал логов установлен')
                .setDescription(`Канал для логов: <#${channelId}>`)
                .setColor(0x00ff00)
                .setTimestamp();
            refreshFunction = () => createAntiBotEmbed(interaction.guild!);
        }

        // Anti-Link modals
        if (interaction.customId === 'antilink_whitelist_modal') {
            const channelId = interaction.fields.getTextInputValue('channel_id');
            const exists = db.prepare('SELECT 1 FROM antilink_whitelist_channels WHERE guild_id = ? AND channel_id = ?').get(guildId, channelId);
            if (exists) {
                db.prepare('DELETE FROM antilink_whitelist_channels WHERE guild_id = ? AND channel_id = ?').run(guildId, channelId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Anti-Link обновлен')
                    .setDescription(`Канал <#${channelId}> **удален** из разрешенных.`)
                    .setColor(0xff0000)
                    .setTimestamp();
            } else {
                db.prepare('INSERT INTO antilink_whitelist_channels (guild_id, channel_id) VALUES (?, ?)').run(guildId, channelId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Anti-Link обновлен')
                    .setDescription(`Канал <#${channelId}> **добавлен** в разрешенные.`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            }
            refreshFunction = () => createAntiLinkEmbed(interaction.guild!);
        }

        if (interaction.customId === 'antilink_action_modal') {
            const action = interaction.fields.getTextInputValue('action');
            if (['delete', 'warn', 'mute'].includes(action)) {
                db.prepare('INSERT INTO antilink_settings (guild_id, action) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET action = ?').run(guildId, action, action);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Действие установлено')
                    .setDescription(`Действие при отправке ссылок: **${action}**`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            } else {
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Ошибка')
                    .setDescription('Некорректное действие. Используйте: **delete**, **warn** или **mute**')
                    .setColor(0xff0000)
                    .setTimestamp();
            }
            refreshFunction = () => createAntiLinkEmbed(interaction.guild!);
        }

        if (interaction.customId === 'antilink_log_modal') {
            const channelId = interaction.fields.getTextInputValue('channel_id');
            db.prepare('INSERT INTO antilink_settings (guild_id, log_channel_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = ?').run(guildId, channelId, channelId);
            responseEmbed = new EmbedBuilder()
                .setTitle('— • Канал логов установлен')
                .setDescription(`Канал для логов: <#${channelId}>`)
                .setColor(0x00ff00)
                .setTimestamp();
            refreshFunction = () => createAntiLinkEmbed(interaction.guild!);
        }

        // Anti-Spam modals
        if (interaction.customId === 'antispam_threshold_modal') {
            const maxMessages = parseInt(interaction.fields.getTextInputValue('max_messages'));
            const timeWindow = parseInt(interaction.fields.getTextInputValue('time_window'));
            if (!isNaN(maxMessages) && !isNaN(timeWindow)) {
                db.prepare('INSERT INTO antispam_settings (guild_id, max_messages, time_window) VALUES (?, ?, ?) ON CONFLICT(guild_id) DO UPDATE SET max_messages = ?, time_window = ?').run(guildId, maxMessages, timeWindow, maxMessages, timeWindow);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Порог спама установлен')
                    .setDescription(`Порог: **${maxMessages}** сообщений за **${timeWindow}с**`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            } else {
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Ошибка')
                    .setDescription('Некорректные значения.')
                    .setColor(0xff0000)
                    .setTimestamp();
            }
            refreshFunction = () => createAntiSpamEmbed(interaction.guild!);
        }

        if (interaction.customId === 'antispam_action_modal') {
            const action = interaction.fields.getTextInputValue('action');
            const muteDuration = interaction.fields.getTextInputValue('mute_duration');
            if (['delete', 'mute', 'kick'].includes(action)) {
                const duration = muteDuration ? parseInt(muteDuration) : 300;
                db.prepare('INSERT INTO antispam_settings (guild_id, action, mute_duration) VALUES (?, ?, ?) ON CONFLICT(guild_id) DO UPDATE SET action = ?, mute_duration = ?').run(guildId, action, duration, action, duration);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Действие установлено')
                    .setDescription(`Действие: **${action}**${action === 'mute' ? ` (${duration}с)` : ''}`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            } else {
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Ошибка')
                    .setDescription('Некорректное действие. Используйте: **delete**, **mute** или **kick**')
                    .setColor(0xff0000)
                    .setTimestamp();
            }
            refreshFunction = () => createAntiSpamEmbed(interaction.guild!);
        }

        if (interaction.customId === 'antispam_log_modal') {
            const channelId = interaction.fields.getTextInputValue('channel_id');
            db.prepare('INSERT INTO antispam_settings (guild_id, log_channel_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = ?').run(guildId, channelId, channelId);
            responseEmbed = new EmbedBuilder()
                .setTitle('— • Канал логов установлен')
                .setDescription(`Канал для логов: <#${channelId}>`)
                .setColor(0x00ff00)
                .setTimestamp();
            refreshFunction = () => createAntiSpamEmbed(interaction.guild!);
        }

        // Anti-Webhook modals
        if (interaction.customId === 'antiwebhook_whitelist_modal') {
            const userId = interaction.fields.getTextInputValue('user_id');
            const exists = db.prepare('SELECT 1 FROM antiwebhook_whitelist WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
            if (exists) {
                db.prepare('DELETE FROM antiwebhook_whitelist WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Anti-Webhook обновлен')
                    .setDescription(`Пользователь <@${userId}> **удален** из белого списка.`)
                    .setColor(0xff0000)
                    .setTimestamp();
            } else {
                db.prepare('INSERT INTO antiwebhook_whitelist (guild_id, user_id) VALUES (?, ?)').run(guildId, userId);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Anti-Webhook обновлен')
                    .setDescription(`Пользователь <@${userId}> **добавлен** в белый список.`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            }
            refreshFunction = () => createAntiWebhookEmbed(interaction.guild!);
        }

        if (interaction.customId === 'antiwebhook_log_modal') {
            const channelId = interaction.fields.getTextInputValue('channel_id');
            db.prepare('INSERT INTO antiwebhook_settings (guild_id, log_channel_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = ?').run(guildId, channelId, channelId);
            responseEmbed = new EmbedBuilder()
                .setTitle('— • Канал логов установлен')
                .setDescription(`Канал для логов: <#${channelId}>`)
                .setColor(0x00ff00)
                .setTimestamp();
            refreshFunction = () => createAntiWebhookEmbed(interaction.guild!);
        }

        // Anti-Raid modals
        if (interaction.customId === 'antiraid_threshold_modal') {
            const joinThreshold = parseInt(interaction.fields.getTextInputValue('join_threshold'));
            const timeWindow = parseInt(interaction.fields.getTextInputValue('time_window'));
            if (!isNaN(joinThreshold) && !isNaN(timeWindow)) {
                db.prepare('INSERT INTO antiraid_settings (guild_id, join_threshold, time_window) VALUES (?, ?, ?) ON CONFLICT(guild_id) DO UPDATE SET join_threshold = ?, time_window = ?').run(guildId, joinThreshold, timeWindow, joinThreshold, timeWindow);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Порог рейда установлен')
                    .setDescription(`Порог рейда: **${joinThreshold}** входов за **${timeWindow}с**`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            } else {
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Ошибка')
                    .setDescription('Некорректные значения.')
                    .setColor(0xff0000)
                    .setTimestamp();
            }
            refreshFunction = () => createAntiRaidEmbed(interaction.guild!);
        }

        if (interaction.customId === 'antiraid_action_modal') {
            const action = interaction.fields.getTextInputValue('action');
            if (action === 'kick' || action === 'ban') {
                db.prepare('INSERT INTO antiraid_settings (guild_id, action) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET action = ?').run(guildId, action, action);
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Действие установлено')
                    .setDescription(`Действие при рейде: **${action}**`)
                    .setColor(0x00ff00)
                    .setTimestamp();
            } else {
                responseEmbed = new EmbedBuilder()
                    .setTitle('— • Ошибка')
                    .setDescription('Некорректное действие. Используйте: **kick** или **ban**')
                    .setColor(0xff0000)
                    .setTimestamp();
            }
            refreshFunction = () => createAntiRaidEmbed(interaction.guild!);
        }

        if (interaction.customId === 'antiraid_log_modal') {
            const channelId = interaction.fields.getTextInputValue('channel_id');
            db.prepare('INSERT INTO antiraid_settings (guild_id, log_channel_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = ?').run(guildId, channelId, channelId);
            responseEmbed = new EmbedBuilder()
                .setTitle('— • Канал логов установлен')
                .setDescription(`Канал для логов: <#${channelId}>`)
                .setColor(0x00ff00)
                .setTimestamp();
            refreshFunction = () => createAntiRaidEmbed(interaction.guild!);
        }

        if (responseEmbed) {
            await interaction.reply({ embeds: [responseEmbed] });
        }
        if (refreshFunction && interaction.message) {
            await interaction.message.edit(refreshFunction());
        }
    }

    if (interaction.isButton()) {
        const guildId = interaction.guildId!;

        // Toggle buttons for all modules
        const toggleHandlers: Record<string, { table: string, refreshFunc: () => any }> = {
            'toggle_antinuke': { table: 'guild_settings', refreshFunc: () => createAntinukeEmbed(interaction.guild!) },
            'toggle_antibot': { table: 'antibot_settings', refreshFunc: () => createAntiBotEmbed(interaction.guild!) },
            'toggle_antilink': { table: 'antilink_settings', refreshFunc: () => createAntiLinkEmbed(interaction.guild!) },
            'toggle_antispam': { table: 'antispam_settings', refreshFunc: () => createAntiSpamEmbed(interaction.guild!) },
            'toggle_antiwebhook': { table: 'antiwebhook_settings', refreshFunc: () => createAntiWebhookEmbed(interaction.guild!) },
            'toggle_antiraid': { table: 'antiraid_settings', refreshFunc: () => createAntiRaidEmbed(interaction.guild!) }
        };

        if (toggleHandlers[interaction.customId]) {
            const handler = toggleHandlers[interaction.customId];
            const settings = db.prepare(`SELECT enabled FROM ${handler.table} WHERE guild_id = ?`).get(guildId) as any || { enabled: 1 };
            const nextStatus = settings.enabled ? 0 : 1;
            db.prepare(`INSERT INTO ${handler.table} (guild_id, enabled) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET enabled = ?`).run(guildId, nextStatus, nextStatus);
            await interaction.update(handler.refreshFunc());
        }

        if (interaction.customId === 'back_to_protection') {
            const menu = createProtectionMenu(interaction.guild!);
            await interaction.reply({ ...menu, ephemeral: true });
        }
    }
});

client.login(config.token);
