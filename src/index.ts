import { Client, GatewayIntentBits, AuditLogEvent, Events, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { config } from './config.js';
import { checkAction } from './logic/anti-nuke.js';
import { checkBotAddition } from './logic/anti-bot.js';
import { checkMessage } from './logic/anti-link.js';
import { checkSpam } from './logic/anti-spam.js';
import { checkWebhook } from './logic/anti-webhook.js';
import { checkRaid } from './logic/anti-raid.js';
import { createAntinukeEmbed } from './components/antinuke-ui.js';
import { createProtectionMenu } from './components/protection-menu.js';
import { createWhitelistModal, createAuditModal, createBanRoleModal, createWarningsModal, createGroupsModal } from './components/modals.js';
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

    // Register commands
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

// Anti-Nuke
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

// Anti-Bot & Anti-Raid
client.on(Events.GuildMemberAdd, async (member) => {
    await checkBotAddition(member);
    await checkRaid(member);
});

// Anti-Link & Anti-Spam
client.on(Events.MessageCreate, async (message) => {
    await checkMessage(message);
    await checkSpam(message);
});

// Anti-Webhook
client.on(Events.WebhooksUpdate, async (channel) => {
    if (channel.guild) {
        await checkWebhook(channel.guild, channel.id);
    }
});

// Interaction Handler
client.on(Events.InteractionCreate, async (interaction) => {
    // Permission check for all interactions
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
        if (interaction.customId === 'protection_module_select') {
            const module = interaction.values[0];
            if (module === 'antinuke') {
                const response = createAntinukeEmbed(interaction.guild!);
                await interaction.reply(response);
            } else {
                await interaction.reply({ content: `Модуль ${module} находится в разработке.`, ephemeral: true });
            }
        }

        if (interaction.customId === 'antinuke_select') {
            const action = interaction.values[0];
            switch (action) {
                case 'whitelist':
                    await interaction.showModal(createWhitelistModal(interaction.guild!));
                    break;
                case 'audit':
                    await interaction.showModal(createAuditModal(interaction.guild!));
                    break;
                case 'ban_role':
                    await interaction.showModal(createBanRoleModal(interaction.guild!));
                    break;
                case 'warnings':
                    await interaction.showModal(createWarningsModal(interaction.guild!));
                    break;
                case 'groups':
                    await interaction.showModal(createGroupsModal(interaction.guild!));
                    break;
            }
        }
    }

    if (interaction.isModalSubmit()) {
        const guildId = interaction.guildId!;
        let responseMessage = '';

        if (interaction.customId === 'whitelist_modal') {
            const userId = interaction.fields.getTextInputValue('user_id');
            const exists = db.prepare('SELECT 1 FROM whitelist WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
            if (exists) {
                db.prepare('DELETE FROM whitelist WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
                responseMessage = getTranslation(guildId, 'antinuke.messages.whitelist_removed', { user: `<@${userId}>` });
            } else {
                db.prepare('INSERT INTO whitelist (guild_id, user_id) VALUES (?, ?)').run(guildId, userId);
                responseMessage = getTranslation(guildId, 'antinuke.messages.whitelist_added', { user: `<@${userId}>` });
            }
        }

        if (interaction.customId === 'audit_modal') {
            const channelId = interaction.fields.getTextInputValue('channel_id');
            db.prepare('INSERT INTO guild_settings (guild_id, log_channel_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = ?').run(guildId, channelId, channelId);
            responseMessage = getTranslation(guildId, 'antinuke.messages.audit_set', { channel: `<#${channelId}>` });
        }

        if (interaction.customId === 'ban_role_modal') {
            const roleId = interaction.fields.getTextInputValue('role_id');
            db.prepare('INSERT INTO guild_settings (guild_id, quarantine_role_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET quarantine_role_id = ?').run(guildId, roleId, roleId);
            responseMessage = getTranslation(guildId, 'antinuke.messages.ban_role_set', { role: `<@&${roleId}>` });
        }

        if (interaction.customId === 'warnings_modal') {
            const count = parseInt(interaction.fields.getTextInputValue('warnings_count'));
            if (!isNaN(count) && count > 0 && count <= 10) {
                db.prepare('INSERT INTO guild_settings (guild_id, max_warnings) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET max_warnings = ?').run(guildId, count, count);
                responseMessage = getTranslation(guildId, 'antinuke.messages.warnings_set', { count: count.toString() });
            } else {
                responseMessage = getTranslation(guildId, 'antinuke.messages.invalid_input');
            }
        }

        if (interaction.customId === 'groups_modal') {
            const roleId = interaction.fields.getTextInputValue('role_id');
            const exists = db.prepare('SELECT 1 FROM groups WHERE guild_id = ? AND role_id = ?').get(guildId, roleId);
            if (exists) {
                db.prepare('DELETE FROM groups WHERE guild_id = ? AND role_id = ?').run(guildId, roleId);
                responseMessage = getTranslation(guildId, 'antinuke.messages.group_removed', { role: `<@&${roleId}>` });
            } else {
                db.prepare('INSERT INTO groups (guild_id, role_id) VALUES (?, ?)').run(guildId, roleId);
                responseMessage = getTranslation(guildId, 'antinuke.messages.group_added', { role: `<@&${roleId}>` });
            }
        }

        // Update the original message with the new embed status
        const refreshed = createAntinukeEmbed(interaction.guild!);
        await interaction.reply({ content: responseMessage, ephemeral: true });
        await interaction.message?.edit(refreshed);
    }

    if (interaction.isButton()) {
        const guildId = interaction.guildId!;
        if (interaction.customId === 'toggle_antinuke') {
            const settings = db.prepare('SELECT enabled FROM guild_settings WHERE guild_id = ?').get(guildId) as any || { enabled: 1 };
            const nextStatus = settings.enabled ? 0 : 1;
            db.prepare('INSERT INTO guild_settings (guild_id, enabled) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET enabled = ?').run(guildId, nextStatus, nextStatus);

            const refreshed = createAntinukeEmbed(interaction.guild!);
            await interaction.update(refreshed);
        }

        if (interaction.customId === 'back_to_protection') {
            const menu = createProtectionMenu(interaction.guild!);
            await interaction.reply({ ...menu, ephemeral: true });
        }
    }
});

client.login(config.token);
