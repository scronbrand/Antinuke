import { Message } from 'discord.js';
import db from '../database/index.js';

const messageTimestamps = new Map<string, number[]>();

export async function checkSpam(message: Message) {
    if (message.author.bot || !message.guild) return;

    const settings = db.prepare('SELECT enabled, max_messages, time_window, action, mute_duration, log_channel_id FROM antispam_settings WHERE guild_id = ?').get(message.guild.id) as any;

    if (!settings || settings.enabled === 0) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}-${userId}`;
    const now = Date.now();
    const timeWindow = settings.time_window * 1000;

    // Get user's message timestamps
    if (!messageTimestamps.has(key)) {
        messageTimestamps.set(key, []);
    }

    const timestamps = messageTimestamps.get(key)!;
    timestamps.push(now);

    // Filter out old timestamps
    const recentTimestamps = timestamps.filter(t => now - t < timeWindow);
    messageTimestamps.set(key, recentTimestamps);

    // Check if threshold exceeded
    if (recentTimestamps.length > settings.max_messages) {
        // Take action
        if (settings.action === 'delete') {
            await message.delete().catch(console.error);
        }

        if (settings.action === 'mute' || settings.action === 'kick') {
            const member = message.member;
            if (member) {
                if (settings.action === 'mute') {
                    await member.timeout(settings.mute_duration * 1000, 'Anti-Spam: Message flooding').catch(console.error);
                    if (message.channel.isTextBased() && 'send' in message.channel) {
                        const warning = await message.channel.send(`🔇 ${message.author} был заглушен за спам!`).catch(() => null);
                        setTimeout(() => warning?.delete().catch(() => { }), 5000);
                    }
                } else {
                    await member.kick('Anti-Spam: Message flooding').catch(console.error);
                }
            }
        }

        // Clear timestamps for this user
        messageTimestamps.delete(key);

        // Log
        if (settings.log_channel_id) {
            const logChannel = await message.guild.channels.fetch(settings.log_channel_id).catch(() => null);
            if (logChannel?.isTextBased()) {
                logChannel.send(`💬 **Anti-Spam**: ${message.author.tag} был наказан за спам (${recentTimestamps.length} сообщений за ${settings.time_window}с).`);
            }
        }
    }
}
