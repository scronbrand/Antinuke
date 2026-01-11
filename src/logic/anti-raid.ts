import { GuildMember, EmbedBuilder } from 'discord.js';
import db from '../database/index.js';

const joinTimestamps = new Map<string, number[]>();

export async function checkRaid(member: GuildMember) {
    const guild = member.guild;
    const settings = db.prepare('SELECT enabled, join_threshold, time_window, action, log_channel_id FROM antiraid_settings WHERE guild_id = ?').get(guild.id) as any;

    if (!settings || settings.enabled === 0) return;

    const guildId = guild.id;
    const now = Date.now();
    const timeWindow = settings.time_window * 1000;

    // Get join timestamps
    if (!joinTimestamps.has(guildId)) {
        joinTimestamps.set(guildId, []);
    }

    const timestamps = joinTimestamps.get(guildId)!;
    timestamps.push(now);

    // Filter out old timestamps
    const recentJoins = timestamps.filter(t => now - t < timeWindow);
    joinTimestamps.set(guildId, recentJoins);

    // Check if threshold exceeded
    if (recentJoins.length >= settings.join_threshold) {
        // Take action on current member
        if (settings.action === 'kick') {
            await member.kick('Anti-Raid: Potential raid detected').catch(console.error);
        } else if (settings.action === 'ban') {
            await member.ban({ reason: 'Anti-Raid: Potential raid detected' }).catch(console.error);
        }

        // Log
        if (settings.log_channel_id) {
            const logChannel = await member.guild.channels.fetch(settings.log_channel_id).catch(() => null);
            if (logChannel?.isTextBased()) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('— • Anti-Raid')
                    .setDescription('Обнаружен рейд! Применены защитные меры')
                    .addFields(
                        { name: 'Входов', value: `${recentJoins.length} за ${settings.time_window}с`, inline: true },
                        { name: 'Действие', value: settings.action === 'kick' ? 'Кик' : 'Бан', inline: true }
                    )
                    .setColor(0xff0000)
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }
        }
    }
}
