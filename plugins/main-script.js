import axios from 'axios';
import fs from 'fs';

let handler = async function (m, { conn }) {
  try {
    await m.react('⏳');

    const owner = 'JawadTechXD';
    const repo = 'JAWAD-MD';
    const { data: repoData } = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);

    const formattedInfo = `*BOT NAME:*\n> ${repoData.name}\n\n*OWNER NAME:*\n> ${repoData.owner.login}\n\n*STARS:*\n> ${repoData.stargazers_count}\n\n*FORKS:*\n> ${repoData.forks_count}\n\n*GITHUB LINK:*\n> ${repoData.html_url}\n\n*DESCRIPTION:*\n> ${repoData.description || 'No description'}\n\n*Don't Forget To Star and Fork Repository*\n\n> *© Powered By JawadTechX 🖤*`;

    // Using relative path for the thumbnail
    const thumbnailPath = './assets/jawadmd.png';
    
    if (fs.existsSync(thumbnailPath)) {
      // Read the image file synchronously
      const imageBuffer = fs.readFileSync(thumbnailPath);
      
      // Send image with caption using the buffer
      await conn.sendMessage(m.chat, {
        image: imageBuffer,
        caption: formattedInfo,
        mentions: [m.sender]
      }, { quoted: m });
    } else {
      // Fallback to text if image not found
      await conn.sendMessage(m.chat, { text: formattedInfo }, { quoted: m });
      console.warn('Thumbnail not found at:', thumbnailPath);
    }

    await m.react('✅');

  } catch (err) {
    console.error(err);
    await m.react('❌');
    await m.reply('❌ *Error fetching repository information*');
  }
};

handler.help = ["script"];
handler.tags = ["main"];
handler.command = ['sc', 'repo', 'script', 'git', 'github'];

export default handler;