import { Message } from 'discord.js';
import db from '../database/index.js';

const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/gi;
const urlRegex = /(https?:\/\/[^\s]+)/gi;

export async function checkMessage(message: Message) {
    if (message.author.bot || !message.guild) return;

    const settings = db.prepare('SELECT enabled, action, log_channel_id FROM antilink_settings WHERE guild_id = ?').get(message.guild.id) as any;

    if (!settings || settings.enabled === 0) return;

    // Check if channel is whitelisted
    const whitelisted = db.prepare('SELECT 1 FROM antilink_whitelist_channels WHERE guild_id = ? AND channel_id = ?').get(message.guild.id, message.channel.id);
    if (whitelisted) return;

    // Check for invites or links
    const hasInvite = inviteRegex.test(message.content);
    const hasLink = urlRegex.test(message.content);

    if (hasInvite || hasLink) {
        // Take action
        if (settings.action === 'delete' || settings.action === 'warn') {
            await message.delete().catch(console.error);
        }

        if (settings.action === 'warn' || settings.action === 'mute') {
            if (message.channel.isTextBased() && 'send' in message.channel) {
                const warning = await message.channel.send(`⚠️ ${message.author}, ссылки запрещены на этом сервере!`).catch(() => null);
                setTimeout(() => warning?.delete().catch(() => { }), 5000);
            }
        }

        if (settings.action === 'mute') {
            const member = message.member;
            if (member) {
                await member.timeout(5 * 60 * 1000, 'Anti-Link: Posted forbidden link').catch(console.error);
            }
        }

        // Log
        if (settings.log_channel_id) {
            const logChannel = await message.guild.channels.fetch(settings.log_channel_id).catch(() => null);
            if (logChannel?.isTextBased()) {
                logChannel.send(`🔗 **Anti-Link**: ${message.author.tag} отправил ссылку в ${message.channel}.`);
            }
        }
    }
}
