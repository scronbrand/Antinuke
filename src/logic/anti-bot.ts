import { Guild, GuildMember } from 'discord.js';
import db from '../database/index.js';

export async function checkBotAddition(member: GuildMember) {
    if (!member.user.bot) return;

    const guild = member.guild;
    const settings = db.prepare('SELECT enabled, action, log_channel_id FROM antibot_settings WHERE guild_id = ?').get(guild.id) as any;

    if (!settings || settings.enabled === 0) return;

    // Check if bot is whitelisted
    const whitelisted = db.prepare('SELECT 1 FROM antibot_whitelist WHERE guild_id = ? AND bot_id = ?').get(guild.id, member.id);
    if (whitelisted) return;

    // Take action
    if (settings.action === 'kick') {
        await member.kick('Anti-Bot: Unauthorized bot addition').catch(console.error);
    } else if (settings.action === 'ban') {
        await member.ban({ reason: 'Anti-Bot: Unauthorized bot addition' }).catch(console.error);
    }

    // Log
    if (settings.log_channel_id) {
        const logChannel = await guild.channels.fetch(settings.log_channel_id).catch(() => null);
        if (logChannel?.isTextBased()) {
            logChannel.send(`🤖 **Anti-Bot**: Бот ${member.user.tag} был удален с сервера (не в белом списке).`);
        }
    }
}
