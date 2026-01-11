import { Message, EmbedBuilder } from 'discord.js';
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
            await message.delete().catch(err => {
                if (err.code !== 10008) console.error(err);
            });
        }

        if (settings.action === 'warn' || settings.action === 'mute') {
            if (message.channel.isTextBased() && 'send' in message.channel) {
                const warningEmbed = new EmbedBuilder()
                    .setTitle('— • Авто заглушения antinuke')
                    .setDescription(`${message.author}, ссылки запрещены на этом сервере!`)
                    .setColor(0xff0000)
                    .setTimestamp();
                const warning = await message.channel.send({ embeds: [warningEmbed] }).catch(() => null);
                setTimeout(() => warning?.delete().catch(() => { }), 60000);
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
                const linkType = hasInvite ? 'Discord-приглашение' : 'ссылку';
                const logEmbed = new EmbedBuilder()
                    .setTitle('— • Anti-Link')
                    .setDescription(`${message.author.tag} отправил ${linkType}`)
                    .addFields(
                        { name: 'Пользователь', value: `<@${message.author.id}>`, inline: true },
                        { name: 'Канал', value: `<#${message.channel.id}>`, inline: true },
                        { name: 'Сообщение', value: message.content.substring(0, 100), inline: false }
                    )
                    .setColor(0xff0000)
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }
        }
    }
}
