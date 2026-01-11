import { Guild, User, AuditLogEvent, GuildAuditLogsEntry } from 'discord.js';
import db from '../database/index.js';

export async function checkAction(guild: Guild, user: User, action: AuditLogEvent) {
    // Skip if user is owner or whitelisted
    if (guild.ownerId === user.id) return;

    const whitelisted = db.prepare('SELECT 1 FROM whitelist WHERE guild_id = ? AND user_id = ?').get(guild.id, user.id);
    if (whitelisted) return;

    // Get settings
    const settings = db.prepare('SELECT quarantine_role_id, max_warnings, log_channel_id, enabled FROM guild_settings WHERE guild_id = ?').get(guild.id) as any;
    if (!settings || settings.enabled === 0) return;

    // Increment warnings
    db.prepare('INSERT INTO warnings (guild_id, user_id, count) VALUES (?, ?, 1) ON CONFLICT(guild_id, user_id) DO UPDATE SET count = count + 1').run(guild.id, user.id);

    const currentWarnings = db.prepare('SELECT count FROM warnings WHERE guild_id = ? AND user_id = ?').get(guild.id, user.id) as { count: number };

    // Log action
    if (settings.log_channel_id) {
        const logChannel = await guild.channels.fetch(settings.log_channel_id).catch(() => null);
        if (logChannel?.isTextBased()) {
            logChannel.send(`⚠️ Пользователь ${user.tag} совершил подозрительное действие: ${AuditLogEvent[action]}. Предупреждений: ${currentWarnings.count}/${settings.max_warnings}`);
        }
    }

    // Quarantine if max warnings reached
    if (currentWarnings.count >= settings.max_warnings && settings.quarantine_role_id) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (member) {
            // Remove all roles and add quarantine role
            const rolesToRemove = member.roles.cache.filter(role => role.id !== guild.id && role.id !== settings.quarantine_role_id);
            await member.roles.remove(rolesToRemove).catch(console.error);
            await member.roles.add(settings.quarantine_role_id).catch(console.error);

            if (settings.log_channel_id) {
                const logChannel = await guild.channels.fetch(settings.log_channel_id).catch(() => null);
                if (logChannel?.isTextBased()) {
                    logChannel.send(`🚨 Пользователь ${user.tag} был отправлен в карантин за превышение лимита предупреждений.`);
                }
            }
        }
    }
}
