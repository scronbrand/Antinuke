import { GuildMember } from 'discord.js';
import db from '../database/index.js';

export async function checkAutorole(member: GuildMember) {
    if (member.user.bot) return;

    const settings = db.prepare('SELECT enabled, role_id FROM autorole_settings WHERE guild_id = ?').get(member.guild.id) as any;

    if (!settings || !settings.enabled || !settings.role_id) return;

    try {
        const role = await member.guild.roles.fetch(settings.role_id).catch(() => null);
        if (role) {
            await member.roles.add(role).catch(err => {
                console.error(`Failed to assign autorole in guild ${member.guild.id}:`, err);
            });
        }
    } catch (error) {
        console.error('Error in autrole logic:', error);
    }
}
