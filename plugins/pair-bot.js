const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageRetryMap,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  PHONENUMBER_MCC
} = await import("@whiskeysockets/baileys");
import 'moment-timezone';
import PhoneNumber from 'awesome-phonenumber';
import NodeCache from 'node-cache';
import 'readline';
import 'qrcode';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import 'path';
import pino from 'pino';
import 'ws';
import '@hapi/boom';
import { makeWASocket } from '../lib/simple.js';

const defaultDB = {
  data: {}
};

if (!global.db) {
  global.db = defaultDB;
}

const defaultSettings = {
  settings: {}
};

if (!global.db.data) {
  global.db.data = defaultSettings;
}

if (global.conns instanceof Array) {
  console.log();
} else {
  global.conns = [];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, '../package.json');
const { name, author, version: versionSB, description } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

let handler = async (m, { conn, args, usedPrefix, command, isOwner, text }) => {
  let targetConn = args[0] && args[0] == 'plz' ? conn : await global.conn;
  text = (text ? text : args[0] ? args[0] : '').toLowerCase();
  
  let errorMsg = "*You can use this command only in the main bot, you can go to it via* \n *Click on the link*\n\nwa.me/" + global.conn.user.jid.split('@')[0] + "?text=*" + usedPrefix + "jadu*";
  
  if (!(args[0] && args[0] == 'plz' || (await global.conn).user.jid == conn.user.jid) && !m.fromMe) {
    const message = {
      text: errorMsg
    };
    return conn.sendMessage(m.chat, message, {
      quoted: m
    });
  }

  let sessionId = crypto.randomBytes(10).toString('hex').slice(0, 8);

  async function initializeBot() {
    if (!fs.existsSync("./assets/xjawadik/" + sessionId)) {
      const options = {
        recursive: true
      };
      fs.mkdirSync("./assets/xjawadik/" + sessionId, options);
    }

    if (args[0]) {
      fs.writeFileSync("./assets/xjawadik/" + sessionId + "/creds.json", JSON.stringify(JSON.parse(Buffer.from(args[0], 'base64').toString("utf-8")), null, "\t"));
    }

    const { state, saveState, saveCreds } = await useMultiFileAuthState("./assets/xjawadik/" + sessionId);
    
    const msgRetryMap = () => {};
    const msgRetryCache = new NodeCache();
    
    const { version } = await fetchLatestBaileysVersion();
    
    let senderNumber = m.sender.split('@')[0];
    const useQR = text.includes('qr') || false;
    const useMobile = process.argv.includes("mobile");
    
    const socketOptions = {
      logger: pino({
        level: "silent"
      }),
      printQRInTerminal: !!useQR,
      mobile: useMobile,
      browser: ["Ubuntu", "Edge", "110.0.1587.56"],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({
          level: "fatal"
        }).child({
          level: "fatal"
        }))
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => {
        let jid = jidNormalizedUser(key.remoteJid);
        let msg = await store.loadMessage(jid, key.id);
        return msg?.message || '';
      },
      msgRetryCounterCache: msgRetryCache,
      msgRetryCounterMap: msgRetryMap,
      defaultQueryTimeoutMs: undefined,
      version: version
    };

    let subBot = makeWASocket(socketOptions);
    subBot.isInit = false;
    let isInitialized = true;
    let cleanNumber = senderNumber.replace(/[^0-9]/g, '');
    let instructions = '';

    if (!fs.existsSync("./assets/xjawadik/" + sessionId + "/creds.json")) {
      instructions = "*JAWAD-MD BOT CLONER*\n\n1-𝘊𝘰𝘱𝘺 𝘵𝘩𝘦 𝘣𝘦𝘭𝘰𝘸 𝘤𝘰𝘥𝘦\n2-𝘠𝘰𝘶 𝘸𝘪𝘭𝘭 𝘳𝘦𝘤𝘦𝘪𝘷𝘦 𝘢 𝘯𝘰𝘵𝘪𝘧𝘪𝘤𝘢𝘵𝘪𝘰𝘯, 𝘤𝘭𝘪𝘤𝘬 𝘰𝘯 𝘪𝘵, 𝘵𝘩𝘦𝘯 𝘦𝘯𝘵𝘦𝘳 𝘵𝘩𝘦 𝘤𝘰𝘥𝘦 𝘵𝘩𝘦𝘳𝘦\n3- 𝘪𝘵 𝘸𝘪𝘭𝘭 𝘣𝘦𝘤𝘰𝘮𝘦 𝘣𝘰𝘵\nJawad ᴍᴅ 𝘪𝘴 𝘴𝘵𝘪𝘭𝘭 𝘢 𝘣𝘰𝘵 𝘥𝘰𝘯'𝘵 𝘸𝘰𝘳𝘳𝘺😊";
      
      let instructionMsg;
      let codeMsg;
      
      setTimeout(async () => {
        let pairingCode = await subBot.requestPairingCode(cleanNumber);
        pairingCode = pairingCode?.match(/.{1,4}/g)?.join('-') || pairingCode;
        
        instructionMsg = await targetConn.sendMessage(m.chat, {
          text: instructions.trim(),
          mentions: [m.sender]
        }, {
          quoted: m
        });

        const codeMessage = {
          text: pairingCode
        };
        
        codeMsg = await targetConn.sendMessage(m.chat, codeMessage, {
          quoted: m
        });
      }, 2000);

      setTimeout(() => {
        const deleteInstruction = {
          delete: instructionMsg.key
        };
        targetConn.sendMessage(m.chat, deleteInstruction);
        
        const deleteCode = {
          delete: codeMsg.key
        };
        targetConn.sendMessage(m.chat, deleteCode);
      }, 60000);
    }

    async function connectionUpdate(update) {
      const { connection, lastDisconnect, isNewLogin, qr } = update;
      
      if (isNewLogin) {
        subBot.isInit = true;
      }
      
      global.db.data.settings.lastConnection = connection;
      
      const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
      
      if (statusCode && statusCode !== DisconnectReason.loggedOut && subBot?.ws?.socket == null) {
        let botIndex = global.conns.indexOf(subBot);
        if (botIndex < 0) {
          console.log(await reloadHandler(true).catch(console.error));
        }
        delete global.conns[botIndex];
        global.conns.splice(botIndex, 1);
        
        if (statusCode !== DisconnectReason.connectionClosed) {
          const successMsg = {
            text: "*Connected successfully* ✅\n*Your number has now become a JAWAD MD clone 🖤*"
          };
          targetConn.sendMessage(m.chat, successMsg, {
            quoted: m
          });
        } else {
          const errorMsg = {
            text: "*An error occurred while connecting, try trying again 😊*"
          };
          targetConn.sendMessage(m.chat, errorMsg, {
            quoted: m
          });
        }
      }
      
      if (global.db.data == null) {
        loadDatabase();
      }
      
      if (!global.db.data.settings) {
        global.db.data.settings = {};
      }
      
      if (connection == "open") {
        subBot.isInit = true;
        global.conns.push(subBot);
        global.db;
        global.db.data.settings.lastConnection = "open";
        global.db.data.settings.lastSuccess = Date.now();
        saveDatabase();
        
        const connectedMsg = {
          text: args[0] ? "*✅ Successfully connected!*" : "*✅ Connected with WhatsApp*\n\n♻️ *Commands related to Sub Bot:*\n» *#stop* _(Pause sub bot)_\n\n» *#serbot [long text]* _(Resume bot if paused or stopped working)_\n\n*Thanks for using ❤️" + name + "*\n\n📢 *Get informed about the latest updates on our official channel:*\nhttps://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j"
        };
        
        await targetConn.sendMessage(m.chat, connectedMsg, {
          quoted: m
        });
        
        const repoMsg = {
          text: "*If you like this bot give star to my repo*\nhttps://github.com/JawadTechXD/JAWAD-MD\nhttps://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j"
        };
        
        await targetConn.sendMessage(m.chat, repoMsg, {
          quoted: m
        });
        
        if (args[0]) {
          console.log("*Sub Bot user reconnecting: " + PhoneNumber('+' + (subBot.user?.jid).replace("@s.whatsapp.net", '')).getNumber("international") + " (" + subBot.getName(subBot.user.jid) + ')*');
        } else {
          console.log("*New user connected as Sub Bot: " + PhoneNumber('+' + (subBot.user?.jid).replace("@s.whatsapp.net", '')).getNumber("international") + " (" + subBot.getName(subBot.user.jid) + ')*');
        }
        
        await sleep(5000);
        
        if (args[0]) {
          return;
        }
        
        const reconnectMsg = {
          text: "*If the sub bot is paused or after the task is finished, send this message to try to reconnect*"
        };
        
        const options = {
          quoted: m
        };
        
        await targetConn.sendMessage(subBot.user.jid, reconnectMsg, options);
        
        await targetConn.sendMessage(subBot.user.jid, {
          text: usedPrefix + command + " " + Buffer.from(fs.readFileSync("./assets/xjawadik/" + sessionId + "/creds.json"), "utf-8").toString('base64')
        }, options);
      }
    }

    function saveDatabase() {
      fs.writeFileSync("./database.json", JSON.stringify(global.db, null, 2));
      console.log("Database saved!");
    }

    setInterval(async () => {
      if (!subBot.user) {
        try {
          subBot.ws.close();
        } catch {}
        
        subBot.ev.removeAllListeners();
        let botIndex = global.conns.indexOf(subBot);
        if (botIndex < 0) return;
        
        delete global.conns[botIndex];
        global.conns.splice(botIndex, 1);
      }
    }, 60000);

    let handlerModule = await import("../handler.js");
    
    let reloadHandler = async function (reset) {
      try {
        const newHandler = await import('../handler.js?update=' + Date.now()).catch(console.error);
        if (Object.keys(newHandler || {}).length) {
          handlerModule = newHandler;
        }
      } catch (error) {
        console.error(error);
      }
      
      if (reset) {
        try {
          subBot.ws.close();
        } catch {}
        
        subBot.ev.removeAllListeners();
        subBot = makeWASocket(socketOptions);
        isInitialized = true;
      }
      
      if (!isInitialized) {
        subBot.ev.off('messages.upsert', subBot.handler);
        subBot.ev.off("connection.update", subBot.connectionUpdate);
        subBot.ev.off("creds.update", subBot.credsUpdate);
      }
      
      subBot.handler = handlerModule.handler.bind(subBot);
      subBot.connectionUpdate = connectionUpdate.bind(subBot);
      subBot.credsUpdate = saveCreds.bind(subBot, true);
      
      subBot.ev.on("messages.upsert", subBot.handler);
      subBot.ev.on("connection.update", subBot.connectionUpdate);
      subBot.ev.on("creds.update", subBot.credsUpdate);
      
      isInitialized = false;
      return true;
    };

    reloadHandler(false);
  }

  initializeBot();
};

handler.help = ['jadu'];
handler.tags = ['bebot'];
handler.command = ["jadu", 'botclone', "rentbot", "jadi"];
export default handler;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isBase64(str) {
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (str.length % 4 === 0 && base64Regex.test(str)) {
    const decoded = Buffer.from(str, 'base64').toString("base64");
    return decoded === str;
  }
  return false;
}

function fileExists(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (error) {
    return false;
  }
}