import { Message, EmbedBuilder, DiscordAPIError } from 'discord.js';
import db from '../database/index.js';

const messageTimestamps = new Map<string, number[]>();
const punishmentLocks = new Set<string>();

export async function checkSpam(message: Message) {
    if (message.author.bot || !message.guild) return;

    const settings = db.prepare('SELECT enabled, max_messages, time_window, action, mute_duration, log_channel_id FROM antispam_settings WHERE guild_id = ?').get(message.guild.id) as any;

    if (!settings || settings.enabled === 0) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}-${userId}`;
    const now = Date.now();
    const timeWindow = settings.time_window * 1000;

    // Check if user is already being punished
    if (punishmentLocks.has(key)) {
        // Just try to delete the message if it's spam, but don't trigger punishment again
        await message.delete().catch(err => {
            if (err.code !== 10008) console.error('Error deleting spam message during lock:', err);
        });
        return;
    }

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
        punishmentLocks.add(key);

        // Delete all spam messages from this user
        try {
            // Delete the current message
            await message.delete().catch(err => {
                if (err.code !== 10008) console.error('Error deleting current spam message:', err);
            });

            // Fetch recent messages and delete all from this user within the spam window
            const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
            const userSpamMessages = fetchedMessages.filter(msg =>
                msg.author.id === message.author.id &&
                Date.now() - msg.createdTimestamp < settings.time_window * 1000
            );

            // Bulk delete if possible (messages must be less than 14 days old)
            if (userSpamMessages.size > 1 && message.channel.isTextBased() && 'bulkDelete' in message.channel) {
                await message.channel.bulkDelete(userSpamMessages, true).catch(() => {
                    // If bulk delete fails, delete individually
                    userSpamMessages.forEach(msg => msg.delete().catch(err => {
                        if (err.code !== 10008) console.error('Error individually deleting spam message:', err);
                    }));
                });
            } else {
                // Delete individually
                userSpamMessages.forEach(msg => msg.delete().catch(err => {
                    if (err.code !== 10008) console.error('Error individually deleting spam message:', err);
                }));
            }
        } catch (error) {
            console.error('Error deleting spam messages:', error);
        }

        // Take action
        if (settings.action === 'mute' || settings.action === 'kick') {
            const member = message.member;
            if (member) {
                if (settings.action === 'mute') {
                    await member.timeout(30 * 60 * 1000, 'Anti-Spam: Message flooding').catch(console.error);
                    if (message.channel.isTextBased() && 'send' in message.channel) {
                        const warningEmbed = new EmbedBuilder()
                            .setTitle('— • Авто заглушения antinuke')
                            .setDescription(`${message.author} был заглушен за спам!`)
                            .setColor(0xff0000)
                            .setTimestamp();
                        const warning = await message.channel.send({ embeds: [warningEmbed] }).catch(() => null);
                        setTimeout(() => warning?.delete().catch(() => { }), 60000);
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
                const logEmbed = new EmbedBuilder()
                    .setTitle('— • Anti-Spam')
                    .setDescription(`${message.author.tag} был наказан за спам`)
                    .addFields(
                        { name: 'Пользователь', value: `<@${message.author.id}>`, inline: true },
                        { name: 'Канал', value: `<#${message.channel.id}>`, inline: true },
                        { name: 'Сообщений', value: `${recentTimestamps.length} за ${settings.time_window}с`, inline: true }
                    )
                    .setColor(0xff0000)
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }
        }

        // Release lock after a short delay to allow for propagation/cleanup
        setTimeout(() => {
            punishmentLocks.delete(key);
        }, 5000);
    }
}
