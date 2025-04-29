import fs from 'fs';

let handler = async (m, { conn }) => {
  const audioPath = './assets/JawadOP.m4a';
  const thumbnailPath = './assets/jawadmd.png';

  let message = {
    audio: { url: audioPath },
    mimetype: 'audio/mp4',
    ptt: true,
    waveform: [100, 0, 100, 0, 100, 0, 100],
    fileName: 'JawadOP',
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: "JAWAD-MD",
        body: "JAWAD MD IS ALIVE 24/7 🖤",
        thumbnail: fs.readFileSync(thumbnailPath),
        sourceUrl: 'https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  };

  await conn.sendMessage(m.chat, message);
};

handler.help = ['alive'];
handler.tags = ['main'];
handler.command = /^(alive)$/i;

export default handler;