import { Guild, AuditLogEvent, EmbedBuilder } from 'discord.js';
import db from '../database/index.js';

export async function checkWebhook(guild: Guild, channelId: string) {
    const settings = db.prepare('SELECT enabled, log_channel_id FROM antiwebhook_settings WHERE guild_id = ?').get(guild.id) as any;

    if (!settings || settings.enabled === 0) return;

    // Fetch audit logs to find who created the webhook
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.WebhookCreate }).catch(() => null);
    if (!auditLogs) return;

    const webhookLog = auditLogs.entries.first();
    if (!webhookLog || !webhookLog.executorId) return;

    // Check if user is whitelisted
    const whitelisted = db.prepare('SELECT 1 FROM antiwebhook_whitelist WHERE guild_id = ? AND user_id = ?').get(guild.id, webhookLog.executorId);
    if (whitelisted) return;

    // Delete all webhooks in the channel
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (channel?.isTextBased() && 'fetchWebhooks' in channel) {
        const webhooks = await channel.fetchWebhooks().catch(() => null);
        if (webhooks) {
            for (const webhook of webhooks.values()) {
                await webhook.delete('Anti-Webhook: Unauthorized webhook creation').catch(console.error);

                // Log
                if (settings.log_channel_id) {
                    const logChannel = await guild.channels.fetch(settings.log_channel_id).catch(() => null);
                    if (logChannel?.isTextBased()) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('— • Anti-Webhook')
                            .setDescription('Неавторизованный вебхук был удален')
                            .addFields(
                                { name: 'Вебхук', value: webhook.name || 'Без имени', inline: true },
                                { name: 'Канал', value: `<#${channelId}>`, inline: true },
                                { name: 'Создатель', value: `<@${webhookLog.executorId}>`, inline: true }
                            )
                            .setColor(0xff0000)
                            .setTimestamp();
                        logChannel.send({ embeds: [logEmbed] });
                    }
                }
            }
        }
    }
}
