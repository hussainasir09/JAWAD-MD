import now from 'performance-now';
import { exec } from 'child_process';

let handler = async (m, { conn }) => {
  let startTime = now();
  let pingTime = now() - startTime;
  
  // Different emoji sets for message and reactions
  let pingEmojis = ['⚡', '🚀', '🤯', '✨', '🌪️', '✨', '🎯', '🔌', '📶'];
  let reactEmojis = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '🔥', '⭐', '🌈'];
  
  let randomPingEmoji = pingEmojis[Math.floor(Math.random() * pingEmojis.length)];
  let randomReactEmoji = reactEmojis[Math.floor(Math.random() * reactEmojis.length)];

  exec("neofetch --stdout", async (error, stdout, stderr) => {
    try {
      let sentMsg = await m.reply(`${randomPingEmoji} *Ping* : ${pingTime.toFixed(4)} *Milliseconds (ms)*`);
      
      // React with a different emoji
      if (sentMsg && sentMsg.key) {
        await conn.sendMessage(sentMsg.key.remoteJid, {
          react: {
            text: randomReactEmoji,
            key: sentMsg.key
          }
        });
      }
    } catch (err) {
      console.error("Failed to react:", err);
    }
  });
};

handler.help = ['ping'];
handler.tags = ['main'];
handler.command = ['ping', 'speed'];

export default handler;