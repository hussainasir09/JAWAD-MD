import fs from 'fs';
import os from 'os';

let handler = async function (m, { conn, usedPrefix }) {
  try {
    await m.react('⏳');

    // Get current hour for pushwish
    let hours = new Date().getHours();
    let pushwish = '';
    if (hours >= 0 && hours < 4) {
      pushwish = 'Late night🌠';
    } else if (hours >= 4 && hours < 6) {
      pushwish = 'Early morning🌥️';
    } else if (hours >= 6 && hours < 12) {
      pushwish = 'Good morning 🌅';
    } else if (hours >= 12 && hours < 16) {
      pushwish = 'Good afternoon 🌩️';
    } else if (hours >= 16 && hours < 19) {
      pushwish = 'Good evening 🌆';
    } else if (hours >= 19 && hours <= 23) {
      pushwish = 'Good night 🌃';
    } else {
      pushwish = 'Hello';
    }

    const mode = process.env.MODE || 'default';
    const uptime = process.uptime();
    const formattedUptime = formatUptime(uptime);

    // Bot info header
    const botInfo = `
╭━━━〔 *JAWAD-MD* 〕━━━┈⊷
┃★╭──────────────
┃★│ Owner : *JawadTechX*
┃★│ User : *${m.pushName || 'User'}*
┃★│ Baileys : *Multi Device*
┃★│ Type : *NodeJs*
┃★│ Mode : *${mode}*
┃★│ Platform : *${os.platform()}*
┃★│ Prefix :  ${usedPrefix} 
┃★│ UPTIME: *${formattedUptime}*
┃★│ Version : *1.1.0*
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷ 
> ${pushwish} ${m.pushName || 'User'}

*╭────⬡ DOWNLOADER ⬡────*
*├▢* ${usedPrefix}facebook <url>
*├▢* ${usedPrefix}gdrive <url>
*├▢* ${usedPrefix}gitclone <url>
*├▢* ${usedPrefix}igstalk
*├▢* ${usedPrefix}instagram
*├▢* ${usedPrefix}mediafire <url>
*├▢* ${usedPrefix}mega
*├▢* ${usedPrefix}modapk
*├▢* ${usedPrefix}play <query>
*├▢* ${usedPrefix}playy <text>
*├▢* ${usedPrefix}video <text>
*├▢* ${usedPrefix}tiktok <url>
*├▢* ${usedPrefix}tiktokstalk
*├▢* ${usedPrefix}twitter <url>
*├▢* ${usedPrefix}yta <url>
*├▢* ${usedPrefix}ytdl <url>
*├▢* ${usedPrefix}ytv <url>
*├▢* ${usedPrefix}ytmp3 <url>
*├▢* ${usedPrefix}ytsearch <query>
*╰▢* ${usedPrefix}wallpaper <query>

*╭────⬡ GROUP ⬡────*
*├▢* ${usedPrefix}getbio <@tag/reply>
*├▢* ${usedPrefix}setdesc <text>
*├▢* ${usedPrefix}setname <text>
*├▢* ${usedPrefix}add
*├▢* ${usedPrefix}delete
*├▢* ${usedPrefix}delwarn @user
*├▢* ${usedPrefix}demote (@tag)
*├▢* ${usedPrefix}infogp
*├▢* ${usedPrefix}hidetag
*├▢* ${usedPrefix}invite <923xxx>
*├▢* ${usedPrefix}kick @user
*├▢* ${usedPrefix}link
*├▢* ${usedPrefix}poll question|option|option
*├▢* ${usedPrefix}profile
*├▢* ${usedPrefix}promote
*├▢* ${usedPrefix}resetlink
*├▢* ${usedPrefix}setbye <text>
*├▢* ${usedPrefix}group *open/close*
*├▢* ${usedPrefix}setwelcome <text>
*├▢* ${usedPrefix}simulate <event> @user
*├▢* ${usedPrefix}staff
*├▢* ${usedPrefix}tagall
*├▢* ${usedPrefix}totag
*├▢* ${usedPrefix}warn @user
*├▢* ${usedPrefix}warns
*╰▢* ${usedPrefix}main

*╭────⬡ OWNER ⬡────*
*├▢* ${usedPrefix}addprem <@tag>
*├▢* ${usedPrefix}addowner @user
*├▢* ${usedPrefix}allow <@tag>
*├▢* ${usedPrefix}heroku
*├▢* ${usedPrefix}ban @user
*├▢* ${usedPrefix}banchat
*├▢* ${usedPrefix}tx
*├▢* ${usedPrefix}broadcastgroup <text>
*├▢* ${usedPrefix}bcgc <text>
*├▢* ${usedPrefix}cleartmp
*├▢* ${usedPrefix}delexpired
*├▢* ${usedPrefix}delprem @user
*├▢* ${usedPrefix}removeowner @user
*├▢* ${usedPrefix}setppbotfull
*├▢* ${usedPrefix}getplugin <name file>
*├▢* ${usedPrefix}getfile <name file>
*├▢* ${usedPrefix}join <chat.whatsapp.com> <dias>
*├▢* ${usedPrefix}reset <54xxx>
*├▢* ${usedPrefix}resetprefix
*├▢* ${usedPrefix}restart
*├▢* ${usedPrefix}setprefix
*├▢* ${usedPrefix}setprefix [symbol]
*├▢* ${usedPrefix}unban @user
*├▢* ${usedPrefix}unbanchat
*├▢* ${usedPrefix}update
*├▢* ${usedPrefix}config
*├▢* ${usedPrefix}listban
*╰▢* ${usedPrefix}deleteplugin <name>

*╭────⬡ FUN ⬡────*
*├▢* ${usedPrefix}afk <reason>
*├▢* ${usedPrefix}tomp3
*├▢* ${usedPrefix}toav
*├▢* ${usedPrefix}bot
*├▢* ${usedPrefix}character @tag
*├▢* ${usedPrefix}dare
*├▢* ${usedPrefix}flirt
*├▢* ${usedPrefix}gay @user
*├▢* ${usedPrefix}pickupline
*├▢* ${usedPrefix}question
*├▢* ${usedPrefix}shayari
*├▢* ${usedPrefix}ship
*├▢* ${usedPrefix}yomamajoke
*├▢* ${usedPrefix}truth
*├▢* ${usedPrefix}waste @user
*├▢* ${usedPrefix}image
*├▢* ${usedPrefix}meme
*╰▢* ${usedPrefix}quote

*╭────⬡ GAME ⬡────*
*├▢* ${usedPrefix}slot <amount>
*├▢* ${usedPrefix}chess [from to]
*├▢* ${usedPrefix}chess delete
*├▢* ${usedPrefix}chess join
*├▢* ${usedPrefix}chess start
*├▢* ${usedPrefix}delt
*├▢* ${usedPrefix}guessflag
*├▢* ${usedPrefix}maths <modes>
*├▢* ${usedPrefix}ppt <rock/paper/scissors>
*╰▢* ${usedPrefix}tictactoe <tag number>

*╭────⬡ MAKER ⬡────*
*├▢* ${usedPrefix}blur
*├▢* ${usedPrefix}hornycard
*├▢* ${usedPrefix}hornylicense
*├▢* ${usedPrefix}gfx1
*├▢* ${usedPrefix}gfx2
*├▢* ${usedPrefix}gfx3
*├▢* ${usedPrefix}gfx4
*├▢* ${usedPrefix}gfx5
*├▢* ${usedPrefix}gfx6
*├▢* ${usedPrefix}gfx7
*├▢* ${usedPrefix}gfx8
*├▢* ${usedPrefix}gfx9
*├▢* ${usedPrefix}gfx10
*├▢* ${usedPrefix}gfx11
*├▢* ${usedPrefix}gfx12
*├▢* ${usedPrefix}simpcard
*├▢* ${usedPrefix}itssostupid
*├▢* ${usedPrefix}iss
*├▢* ${usedPrefix}stupid
*├▢* ${usedPrefix}tweet <comment>
*╰▢* ${usedPrefix}ytcomment <comment>

*╭────⬡ STICKER ⬡────*
*├▢* ${usedPrefix}emojimix <emoji+emoji>
*├▢* ${usedPrefix}getsticker
*├▢* ${usedPrefix}smaker
*├▢* ${usedPrefix}stickerwithmeme (caption|reply media)
*├▢* ${usedPrefix}swmeme <url>
*├▢* ${usedPrefix}sfull
*├▢* ${usedPrefix}toimg <sticker>
*├▢* ${usedPrefix}tovid
*├▢* ${usedPrefix}trigger <@user>
*├▢* ${usedPrefix}ttp
*├▢* ${usedPrefix}ttp2
*├▢* ${usedPrefix}ttp3
*├▢* ${usedPrefix}ttp4
*├▢* ${usedPrefix}ttp5
*├▢* ${usedPrefix}attp
*├▢* ${usedPrefix}attp2
*╰▢* ${usedPrefix}attp3

*╭────⬡ TOOLS ⬡────*
*├▢* ${usedPrefix}qr <text>
*├▢* ${usedPrefix}qrcode <text>
*├▢* ${usedPrefix}style <key> <text>
*├▢* ${usedPrefix}weather *<place>*
*├▢* ${usedPrefix}dehaze
*├▢* ${usedPrefix}recolor
*├▢* ${usedPrefix}hdr
*├▢* ${usedPrefix}length <amount>
*├▢* ${usedPrefix}tinyurl <link>
*├▢* ${usedPrefix}shorten <link>
*├▢* ${usedPrefix}tempmail
*├▢* ${usedPrefix}shazam
*├▢* ${usedPrefix}cal <equation>
*├▢* ${usedPrefix}carbon <code>
*├▢* ${usedPrefix}define <word>
*├▢* ${usedPrefix}element
*├▢* ${usedPrefix}google
*├▢* ${usedPrefix}itunes
*├▢* ${usedPrefix}lyrics
*├▢* ${usedPrefix}imdb
*├▢* ${usedPrefix}course
*├▢* ${usedPrefix}randomcourse
*├▢* ${usedPrefix}readmore <text1>|<text2>
*├▢* ${usedPrefix}readvo
*├▢* ${usedPrefix}removebg
*├▢* ${usedPrefix}ss <url>
*├▢* ${usedPrefix}ssf <url>
*├▢* ${usedPrefix}subreddit
*├▢* ${usedPrefix}telesticker
*├▢* ${usedPrefix}tourl
*├▢* ${usedPrefix}translate <lang> <text>
*├▢* ${usedPrefix}true
*├▢* ${usedPrefix}tts <lang> <task>
*├▢* ${usedPrefix}wa
*╰▢* ${usedPrefix}wikipedia

*╭────⬡ AI ⬡────*
*├▢* ${usedPrefix}bing
*├▢* ${usedPrefix}dalle
*├▢* ${usedPrefix}gpt
*├▢* ${usedPrefix}toanime
*├▢* ${usedPrefix}tocartoon
*├▢* ${usedPrefix}ai
*├▢* ${usedPrefix}bard
*╰▢* ${usedPrefix}alexa

*╭────⬡ STUDY ⬡────*
*├▢* ${usedPrefix}quranmenu
*├▢* ${usedPrefix}surah 36
*├▢* ${usedPrefix}gpt
*├▢* ${usedPrefix}gpt2
*├▢* ${usedPrefix}bing
*├▢* ${usedPrefix}bard
*├▢* ${usedPrefix}quote
*├▢* ${usedPrefix}aise
*├▢* ${usedPrefix}define
*╰▢* ${usedPrefix}element
`;

    // Using relative path for the thumbnail
    const thumbnailPath = './assets/jawadmd.png';
    
    try {
      if (fs.existsSync(thumbnailPath)) {
        // Read the image file synchronously
        const imageBuffer = fs.readFileSync(thumbnailPath);
        
        // Send image with caption using the buffer
        await conn.sendMessage(m.chat, {
          image: imageBuffer,
          caption: botInfo,
          mentions: [m.sender]
        }, { quoted: m });
      } else {
        // Fallback to text if image not found
        await conn.sendMessage(m.chat, { text: botInfo }, { quoted: m });
        console.warn('Thumbnail not found at:', thumbnailPath);
      }

      await m.react('✅');
    } catch (sendError) {
      console.error('Error sending message:', sendError);
      await m.react('❌');
      // Try sending just text if image send fails
      await conn.sendMessage(m.chat, { text: botInfo }, { quoted: m });
    }

  } catch (err) {
    console.error('Menu error:', err);
    await m.react('❌');
    await m.reply('❌ Error displaying menu. Please try again later.');
  }
};

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let uptimeString = '';
  if (days > 0) uptimeString += `${days}d `;
  if (hours > 0) uptimeString += `${hours}h `;
  if (minutes > 0) uptimeString += `${minutes}m `;
  uptimeString += `${secs}s`;

  return uptimeString;
}

handler.help = ["menu", "fullmenu", "list"];
handler.tags = ["main"];
handler.command = ['menu', 'fullmenu', 'list'];

export default handler;
