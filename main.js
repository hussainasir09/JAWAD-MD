process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import path, { join, dirname as pathDirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import 'ws';
import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxError from 'syntax-error';
import { tmpdir } from 'os';
import { format } from 'util';
import { makeWASocket, protoType, serialize } from './lib/jawadx.js';
import { Low, JSONFile } from 'lowdb';
import pino from 'pino';
import cloudDBAdapter from './lib/cloudDBAdapter.js';
import { MongoDB } from './lib/mongoDB.js';
import { PostgresDB } from './lib/postgresDB.js';
import store from './lib/store.js';
import { Boom } from '@hapi/boom';
import 'moment-timezone';
import NodeCache from 'node-cache';
import readline from 'readline';
import fs from 'fs';
import jawadSession from './lib/jawadsession.js';

const {
  DisconnectReason,
  useMultiFileAuthState,
  MessageRetryMap,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  proto,
  delay,
  jidNormalizedUser,
  PHONENUMBER_MCC,
  Browsers
} = await (await import("@whiskeysockets/baileys")).default;

dotenv.config();

async function main() {
  const sessionId = process.env.SESSION_ID;
  if (!sessionId) {
    console.error("SESSION_ID variable not found.");
    return;
  }
  try {
    await jawadSession(sessionId);
    console.log("jawadSessionSavedCredentials completed...✅");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
await delay(10000);

const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

protoType();
serialize();

global.__filename = function filename(url = import.meta.url, isUnix = platform !== "win32") {
  return isUnix ? /file:\/\/\//.test(url) ? fileURLToPath(url) : url : pathToFileURL(url).toString();
};

global.__dirname = function dirname(path) {
  return pathDirname(global.__filename(path, true));
};

global.__require = function require(url = import.meta.url) {
  return createRequire(url);
};

global.API = (apiName, endpoint = '/', query = {}, apiKeyName) => 
  (apiName in global.APIs ? global.APIs[apiName] : apiName) + endpoint + 
  (query || apiKeyName ? '?' + new URLSearchParams(Object.entries({
    ...query,
    ...(apiKeyName ? {
      [apiKeyName]: global.APIKeys[apiName in global.APIs ? global.APIs[apiName] : apiName]
    } : {})
  })) : '');

global.timestamp = {
  start: new Date()
};

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[' + (process.env.PREFIX || "‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-").replace(/[|\\{}()[\]^$+*?.\-\^]/g, "\\$&") + ']');

global.opts.db = process.env.DATABASE_URL;
global.db = new Low(
  /https?:\/\//.test(opts.db || '') ? new cloudDBAdapter(opts.db) : 
  /mongodb(\+srv)?:\/\//i.test(opts.db) ? new MongoDB(opts.db) : 
  /postgresql:\/\/|postgres:\/\//i.test(opts.db) ? new PostgresDB(opts.db) : 
  new JSONFile((opts._[0] ? opts._[0] + '_' : '') + 'database.json')
);

global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise(resolve => setInterval(async function () {
      if (!global.db.READ) {
        clearInterval(this);
        resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
      }
    }, 1000));
  }
  if (global.db.data !== null) return;
  
  global.db.READ = true;
  await global.db.read().catch(console.error);
  global.db.READ = null;
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {})
  };
  global.db.chain = chain(global.db.data);
};

loadDatabase();

global.authFile = 'sessions';
const { state, saveCreds } = await useMultiFileAuthState(global.authFile);

const cacheConfig = {
  stdTTL: 0,
  checkperiod: 0
};

const msgRetryCounterCache = new NodeCache(cacheConfig);
const userDevicesCache = new NodeCache(cacheConfig);

let phoneNumber = global.botNumber?.[0];
const methodCodeQR = process.argv.includes('qr');
const methodCode = !!phoneNumber || process.argv.includes("code");
const MethodMobile = process.argv.includes("mobile");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
let option;

if (methodCodeQR) {
  option = '1';
}

if (!methodCodeQR && !methodCode && !fs.existsSync('./' + global.authFile + '/creds.json')) {
  do {
    option = await question("\n\n\n✳️ Enter the connection method\n\n\n🔺 1 : per QR code\n🔺 2 : per 8-digit CODE\n\n\n\n");
    if (!/^[1-2]$/.test(option)) {
      console.log("\n\n🔴 Enter only one option \n\n 1 or 2\n\n");
    }
  } while (option !== '1' && option !== '2' || fs.existsSync('./' + global.authFile + "/creds.json"));
}

console.info = () => {};

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: option === '1' || methodCodeQR,
  mobile: MethodMobile,
  browser: option === '1' ? ["JAWAD-MD", "Safari", '2.0.0'] : methodCodeQR ? ["JAWAD-MD", "Safari", "2.0.0"] : ['Ubuntu', 'Chrome', "20.0.04"],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  getMessage: async (key) => {
    let normalizedJid = jidNormalizedUser(key.remoteJid);
    let message = await store.loadMessage(normalizedJid, key.id);
    return message?.message || '';
  },
  msgRetryCounterCache,
  defaultQueryTimeoutMs: undefined,
  version: [2, 3000, 1015901307]
};

global.conn = makeWASocket(connectionOptions);

if (!fs.existsSync('./' + global.authFile + "/creds.json")) {
  if (option === '2' || methodCode) {
    option = '2';
    if (!conn.authState.creds.registered) {
      if (MethodMobile) throw new Error("⚠️ Mobile API Error Occurred");
      
      let phoneNumberToAdd;
      if (!!phoneNumber) {
        phoneNumberToAdd = phoneNumber.replace(/[^0-9]/g, '');
        if (!Object.keys(PHONENUMBER_MCC).some(countryCode => phoneNumberToAdd.startsWith(countryCode))) {
          console.log(chalk.bgBlack(chalk.bold.redBright("\n\n✴️ Your number must start with the country code")));
          process.exit(0);
        }
      } else {
        while (true) {
          phoneNumberToAdd = await question(chalk.bgBlack(chalk.bold.greenBright("\n\n✳️ Enter your number\n\nExample: 92310xxxx\n\n")));
          phoneNumberToAdd = phoneNumberToAdd.replace(/[^0-9]/g, '');
          if (phoneNumberToAdd.match(/^\d+$/) && Object.keys(PHONENUMBER_MCC).some(countryCode => phoneNumberToAdd.startsWith(countryCode))) {
            break;
          } else {
            console.log(chalk.bgBlack(chalk.bold.redBright("\n\n✴️ Make sure to add the country code")));
          }
        }
        rl.close();
      }
      
      setTimeout(async () => {
        let pairingCode = await conn.requestPairingCode(phoneNumberToAdd);
        pairingCode = pairingCode?.match(/.{1,4}/g)?.join('-') || pairingCode;
        console.log(chalk.yellow("\n\n🍏 enter the code in WhatsApp."));
        console.log(chalk.black(chalk.bgGreen("\n🟣  Its Code is: ")), chalk.black(chalk.red(pairingCode)));
      }, 3000);
    }
  }
}

conn.isInit = false;

if (!opts.test) {
  setInterval(async () => {
    if (global.db.data) await global.db.write().catch(console.error);
    if (opts.autocleartmp) await clearTmp().catch(console.error);
  }, 60000);
}

if (opts.server) {
  (await import("./server.js")).default(global.conn, PORT);
}

async function clearTmp() {
  const tmpDirs = [tmpdir(), join(__dirname, './tmp')];
  const tmpFiles = [];
  
  tmpDirs.forEach(dir => {
    if (existsSync(dir)) {
      readdirSync(dir).forEach(file => {
        tmpFiles.push(join(dir, file));
      });
    }
  });
  
  return tmpFiles.map(filePath => {
    try {
      const stats = statSync(filePath);
      if (stats.isFile() && Date.now() - stats.mtimeMs >= 60000) {
        unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing tmp file:', error);
      return false;
    }
  });
}

setInterval(async () => {
  await clearTmp();
}, 60000);

global.botlive = process.env.MODE;

async function connectionUpdate(update) {
  const { connection: status, lastDisconnect, isNewLogin } = update;

  if (isNewLogin) conn.isInit = true;

  const statusCode = lastDisconnect?.error?.output?.statusCode || 
                    lastDisconnect?.error?.output?.payload?.statusCode;

  if (statusCode && statusCode !== DisconnectReason.loggedOut && conn?.ws?.socket == null) {
    console.log(await global.reloadHandler(true).catch(console.error));
    global.timestamp.connect = new Date();
  }

  if (global.db.data == null) loadDatabase();

  if (status === 'open') {
    const { jid } = conn.user;
    const welcomeMsg = `*Hello there JAWAD-MD User! 👋🏻*\n\n` +
      `> Simple, Straight Forward But Loaded With Features 🎊, Meet JAWAD-MD WhatsApp Bot.\n\n` +
      `*Thanks for using JAWAD-MD 🚩*\n\n` +
      `Bot Prefix \`${prefix}\`\n\n` +
      `> Join WhatsApp Channel :- ⤵️\n\n` +
      `https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j\n\n` +
      `Don't forget to give star to repo ⬇️\n\n` +
      `https://github.com/JawadTechXD/JAWAD-MD\n\n` +
      `> © Powered BY JawadTechX 🖤`;

    await conn.sendMessage(jid, { 
      image: { url: 'https://files.catbox.moe/vz20kf.jpg' },
      caption: welcomeMsg,
      mentions: [jid]
    }, { quoted: null });
    
    console.log(chalk.bold.greenBright("☛ Successfully Connected to WhatsApp. ✅"));
  }

  const disconnectStatusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
  
  if (disconnectStatusCode == 405) {
    await fs.promises.unlink(`./${global.authFile}/creds.json`).catch(() => {});
    console.log(chalk.bold.redBright("[ ⚠ ] Connection replaced, Please wait a moment I'm going to restart...\nIf error appears start again with : npm start"));
    process.send?.("reset");
  }

  if (status === "close") {
    switch (disconnectStatusCode) {
      case DisconnectReason.badSession:
        conn.logger.error(`[ ⚠ ] Session error, please change the session by ${global.authFile} pairing again.`);
        break;
      case DisconnectReason.connectionClosed:
      case DisconnectReason.connectionLost:
      case DisconnectReason.timedOut:
        conn.logger.warn("[ ⚠ ] Connection issue, reconnecting...");
        await global.reloadHandler(true).catch(console.error);
        break;
      case DisconnectReason.connectionReplaced:
        conn.logger.error("[ ⚠ ] Connection replaced, another new session opened. Please log out first.");
        break;
      case DisconnectReason.loggedOut:
        conn.logger.error(`[ ⚠ ] Closed connection, Please change the session ${global.authFile} use jawad pair site or .getpair command`);
        break;
      case DisconnectReason.restartRequired:
        conn.logger.info("[ ⚠ ] Restart required, restarting...");
        await global.reloadHandler(true).catch(console.error);
        break;
      default:
        conn.logger.warn(`[ ⚠ ] Unknown disconnect reason: ${disconnectStatusCode || 'unknown'}`);
        await global.reloadHandler(true).catch(console.error);
    }
  }
}

process.on("uncaughtException", console.error);

let isInit = true;
let handler = await import('./handler.js');

global.reloadHandler = async function (restartConn) {
  try {
    const newHandler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
    if (Object.keys(newHandler || {}).length) handler = newHandler;
  } catch (error) {
    console.error(error);
  }

  if (restartConn) {
    const oldChats = global.conn.chats;
    try {
      global.conn.ws.close();
    } catch {}
    
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions, { chats: oldChats });
    isInit = true;
  }

  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler);
    conn.ev.off('group-participants.update', conn.participantsUpdate);
    conn.ev.off('groups.update', conn.groupsUpdate);
    conn.ev.off("message.delete", conn.onDelete);
    conn.ev.off('connection.update', conn.connectionUpdate);
    conn.ev.off("creds.update", conn.credsUpdate);
  }

  conn.welcome = "Hello @user\nWelcome to @group";
  conn.bye = "Goodbye @user";
  conn.spromote = "@user Now he is an administrator";
  conn.sdemote = "@user he is no longer an administrator";
  conn.sDesc = "The description has been changed to \n@desc";
  conn.sSubject = "The name of the group has been changed to \n@group";
  conn.sIcon = "The group icon has been changed";
  conn.sRevoke = "The group link has been changed to \n@revoke";

  conn.handler = handler.handler.bind(global.conn);
  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn);
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn);
  conn.onDelete = handler.deleteUpdate.bind(global.conn);
  conn.connectionUpdate = connectionUpdate.bind(global.conn);
  conn.credsUpdate = saveCreds.bind(global.conn, true);

  conn.ev.on("messages.upsert", conn.handler);
  conn.ev.on('group-participants.update', conn.participantsUpdate);
  conn.ev.on('groups.update', conn.groupsUpdate);
  conn.ev.on("message.delete", conn.onDelete);
  conn.ev.on('connection.update', conn.connectionUpdate);
  conn.ev.on("creds.update", conn.credsUpdate);

  isInit = false;
  return true;
};

const pluginFolder = global.__dirname(join(__dirname, "./plugins/index"));
const pluginFilter = filename => /\.js$/.test(filename);

global.plugins = {};

async function filesInit() {
  for (let filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      let file = global.__filename(join(pluginFolder, filename));
      let module = await import(file);
      global.plugins[filename] = module.default || module;
    } catch (error) {
      conn.logger.error(error);
      delete global.plugins[filename];
    }
  }
}

filesInit()
  .then(() => console.log(Object.keys(global.plugins)))
  .catch(console.error);

global.reload = async (event, filename) => {
  if (pluginFilter(filename)) {
    let file = global.__filename(join(pluginFolder, filename), true);
    if (filename in global.plugins) {
      if (existsSync(file)) {
        conn.logger.info(`🌟 Updated Plugin - '${filename}'`);
      } else {
        conn.logger.warn(`🗑️ Plugin Removed - '${filename}'`);
        return delete global.plugins[filename];
      }
    } else {
      conn.logger.info(`✨ New plugin - '${filename}'`);
    }

    const err = syntaxError(readFileSync(file), filename, {
      sourceType: "module",
      allowAwaitOutsideFunction: true
    });
    
    if (err) {
      conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`);
    } else {
      try {
        const module = await import(`${global.__filename(file)}?update=${Date.now()}`);
        global.plugins[filename] = module.default || module;
      } catch (error) {
        conn.logger.error(`error loading plugin '${filename}'\n${format(error)}`);
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        );
      }
    }
  }
};

Object.freeze(global.reload);
watch(pluginFolder, global.reload);
await global.reloadHandler();

async function _quickTest() {
  const test = await Promise.all([
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version'])
  ].map(cmd => {
    return Promise.race([
      new Promise(resolve => {
        cmd.on('close', code => {
          resolve(code !== 127);
        });
      }),
      new Promise(resolve => {
        cmd.on('error', () => resolve(false));
      })
    ]);
  }));

  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
  global.support = {
    ffmpeg,
    ffprobe,
    ffmpegWebp,
    convert,
    magick,
    gm,
    find
  };
  Object.freeze(global.support);

  if (!global.support.ffmpeg) {
    conn.logger.warn("Please install ffmpeg for sending videos (pkg install ffmpeg)");
  }
  
  if (global.support.ffmpeg && !global.support.ffmpegWebp) {
    conn.logger.warn("Stickers may not be animated without libwebp on ffmpeg (--enable-libwebp while compiling ffmpeg)");
  }
  
  if (!global.support.convert && !global.support.magick && !global.support.gm) {
    conn.logger.warn("Stickers may not work without imagemagick if libwebp on ffmpeg isn't installed (pkg install imagemagick)");
  }
}

_quickTest()
  .then(() => conn.logger.info("✅ BOT MAIN FILE LOADED"))
  .catch(console.error);
