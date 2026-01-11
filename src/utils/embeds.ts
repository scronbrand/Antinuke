import { EmbedBuilder } from 'discord.js';

export function createSuccessEmbed(title: string, description: string) {
    return new EmbedBuilder()
        .setTitle(`— • ${title}`)
        .setDescription(description)
        .setColor(0x00ff00)
        .setTimestamp();
}

export function createErrorEmbed(title: string, description: string) {
    return new EmbedBuilder()
        .setTitle(`— • ${title}`)
        .setDescription(description)
        .setColor(0xff0000)
        .setTimestamp();
}

export function createInfoEmbed(title: string, description: string) {
    return new EmbedBuilder()
        .setTitle(`— • ${title}`)
        .setDescription(description)
        .setColor(0x2b2d31)
        .setTimestamp();
}

export function createActionEmbed(title: string, fields: { name: string, value: string }[]) {
    const embed = new EmbedBuilder()
        .setTitle(`— • ${title}`)
        .setColor(0x2b2d31)
        .setTimestamp();

    for (const field of fields) {
        embed.addFields({ name: field.name, value: field.value, inline: false });
    }

    return embed;
}
