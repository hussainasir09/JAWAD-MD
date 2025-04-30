import fs from 'fs';
import os from 'os';

let handler = async function (m, { conn, usedPrefix }) {
  try {
    await m.react('⏳');
    
    const mode = process.env.MODE || 'default';
    const uptime = process.uptime();
    const formattedUptime = formatUptime(uptime);
    
    // Main menu structure
    const mainMenu = `
╭━━━〔 *✨ JAWAD-MD ✨* 〕━━━┈⊷
┃★╭──────────────
┃★│ 👑 Owner : *JawadTechX*
┃★│ 🙋‍♂️ User : *${m.pushName || 'User'}*
┃★│ 📡 Baileys : *Multi Device*
┃★│ 🛠️ Type : *NodeJs*
┃★│ ⚙️ Mode : *${mode}*
┃★│ 💻 Platform : *${os.platform()}*
┃★│ 🧭 Prefix : *${usedPrefix}*
┃★│ ⏱️ Uptime : *${formattedUptime}*
┃★│ 🧩 Version : *1.1.0*
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷ 

*╭────⬡ MENU LIST ⬡────*
*├▢* 🕋 ${usedPrefix}quranmenu - Quran Menu
*├▢* 🤖 ${usedPrefix}aimenu - AI Menu
*├▢* 📚 ${usedPrefix}studymenu - Study Menu
*├▢* 📥 ${usedPrefix}dlmenu - Downloader Menu
*├▢* 🧩 ${usedPrefix}stickermenu - Sticker Menu
*├▢* 🧰 ${usedPrefix}toolsmenu - Tools Menu
*├▢* 🎨 ${usedPrefix}makermenu - Maker Menu
*├▢* 🎮 ${usedPrefix}gamemenu - Game Menu
*├▢* 🎉 ${usedPrefix}funmenu - Fun Menu
*├▢* 👑 ${usedPrefix}ownermenu - Owner Menu
*├▢* 👥 ${usedPrefix}groupmenu - Group Menu
*╰▢* 📜 ${usedPrefix}menu2 - Full Menu
`;

    // Downloader Menu
    const dlMenu = `
*╭────⬡ DOWNLOADER MENU ⬡────*
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
`;

    // Group Menu
    const groupMenu = `
*╭────⬡ GROUP MENU ⬡────*
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
`;

    // Owner Menu
    const ownerMenu = `
*╭────⬡ OWNER MENU ⬡────*
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
`;

    // Fun Menu
    const funMenu = `
*╭────⬡ FUN MENU ⬡────*
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
`;

    // Game Menu
    const gameMenu = `
*╭────⬡ GAME MENU ⬡────*
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
`;

    // Maker Menu
    const makerMenu = `
*╭────⬡ MAKER MENU ⬡────*
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
`;

    // Sticker Menu
    const stickerMenu = `
*╭────⬡ STICKER MENU ⬡────*
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
`;

    // Tools Menu
    const toolsMenu = `
*╭────⬡ TOOLS MENU ⬡────*
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
`;

    // AI Menu
    const aiMenu = `
*╭────⬡ AI MENU ⬡────*
*├▢* ${usedPrefix}bing
*├▢* ${usedPrefix}dalle
*├▢* ${usedPrefix}gpt
*├▢* ${usedPrefix}toanime
*├▢* ${usedPrefix}tocartoon
*├▢* ${usedPrefix}ai
*├▢* ${usedPrefix}bard
*╰▢* ${usedPrefix}alexa
`;

    // Study Menu (including Quran)
    const studyMenu = `
*╭────⬡ STUDY MENU ⬡────*
*├▢* ${usedPrefix}quranmenu - Quran Commands
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

    // Quran Menu
    const quranMenu = `
*╭────⬡ QURAN MENU ⬡────*
*├▢* ${usedPrefix}surah <number> - Get a surah (1-114)
*├▢* ${usedPrefix}ayatulkursi - Ayatul Kursi
*├▢* ${usedPrefix}listSurah - List all surahs
*├▢* ${usedPrefix}tafsir <surah number> - Get tafsir
*├▢* ${usedPrefix}randomAyat - Random verse
*├▢* ${usedPrefix}searchAyat <keyword> - Search verses
*╰▢* ${usedPrefix}juz <number> - Get juz (1-30)
`;

    // Determine which menu to show based on command
    let menuToSend = mainMenu;
    const command = m.text.toLowerCase().split(' ')[0].replace(usedPrefix, '');
    
    switch(command) {
      case 'menu2':
        menuToSend = mainMenu;
        break;
      case 'dlmenu':
        menuToSend = dlMenu;
        break;
      case 'groupmenu':
        menuToSend = groupMenu;
        break;
      case 'ownermenu':
        menuToSend = ownerMenu;
        break;
      case 'funmenu':
        menuToSend = funMenu;
        break;
      case 'gamemenu':
        menuToSend = gameMenu;
        break;
      case 'makermenu':
        menuToSend = makerMenu;
        break;
      case 'stickermenu':
        menuToSend = stickerMenu;
        break;
      case 'toolsmenu':
        menuToSend = toolsMenu;
        break;
      case 'aimenu':
        menuToSend = aiMenu;
        break;
      case 'studymenu':
        menuToSend = studyMenu;
        break;
      case 'quranmenu':
        menuToSend = quranMenu;
        break;
    }

    // Using relative path for the thumbnail
    const thumbnailPath = './assets/jawadmd.png';
    
    try {
      if (fs.existsSync(thumbnailPath)) {
        const imageBuffer = fs.readFileSync(thumbnailPath);
        await conn.reply(m.chat, {
          image: imageBuffer,
          caption: menuToSend,
          mentions: [m.sender]
        }, m);
      } else {
        await conn.reply(m.chat, menuToSend, m);
        console.warn('Thumbnail not found at:', thumbnailPath);
      }
      await m.react('✅');
    } catch (sendError) {
      console.error('Error sending message:', sendError);
      await m.react('❌');
      await conn.reply(m.chat, menuToSend, m);
    }

  } catch (err) {
    console.error('Menu error:', err);
    await m.react('❌');
    await conn.reply(m.chat, '❌ Error displaying menu. Please try again later.', m);
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

handler.help = ["menu", "dlmenu", "groupmenu", "ownermenu", "funmenu", "gamemenu", "makermenu", "stickermenu", "toolsmenu", "aimenu", "studymenu", "quranmenu"];
handler.tags = ["main"];
handler.command = ['menu', 'dlmenu', 'groupmenu', 'ownermenu', 'funmenu', 'gamemenu', 'makermenu', 'stickermenu', 'toolsmenu', 'aimenu', 'studymenu', 'quranmenu'];

export default handler;
