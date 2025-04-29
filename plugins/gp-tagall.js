let handler = async (m, { conn, text, participants, isAdmin, isOwner, groupMetadata }) => {
    const botNumber = conn.user.jid;
    const users = participants.map(u => u.id).filter(v => v !== conn.user.jid);

    if (m.sender !== botNumber && !isOwner && !isAdmin) {
        m.reply("🛡️ This command is only for Group Admins.");
        return;
    }

    const messageText = text || "Attention Everyone ❤️";

    const groupInfo = `┃💗⊹ GROUP : ${groupMetadata.subject}\n\n`;
    const membersInfo = `┃💗⊹ MEMBERS : ${participants.length}\n┃💗⊹ MESSAGE : ${messageText}\n`;
    const mentions = users.map(v => '┃💗⊹ @' + v.replace(/@.+/, '')).join`\n`;
    const footer = '\n└──✪⚡JAWAD┃MD ✪──';

    const tagAllMessage = `${groupInfo}${membersInfo}\n\n┌───⊷ MENTIONS\n${mentions}${footer}`;

    m.reply(tagAllMessage, null, { mentions: users });
};

handler.help = ['tagall'];
handler.tags = ['group'];
handler.command = ['tagall', 'invo'];
handler.admin = false;
handler.group = true;

export default handler;