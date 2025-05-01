import path from 'path';
import { toAudio } from './converter.js';
import chalk from 'chalk';
import fetch from 'node-fetch';
import PhoneNumber from 'awesome-phonenumber';
import fs from 'fs';
import util from 'util';
import { fileTypeFromBuffer } from 'file-type';
import { format } from 'util';
import { fileURLToPath } from 'url';
import store from './store.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const {
  default: makeWaSocket,
  makeWALegacySocket,
  proto,
  downloadContentFromMessage,
  jidDecode,
  areJidsSameUser,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  WAMessageStubType,
  extractMessageContent,
  prepareWAMessageMedia
} = (await import("@whiskeysockets/baileys"))["default"];
export function makeWASocket(connectionOptions, additionalOptions = {}) {
  let connection = (global.opts.legacy ? makeWALegacySocket : makeWaSocket)(connectionOptions);
  let socket = Object.defineProperties(connection, {
    'chats': {
      'value': {
        ...(additionalOptions.chats || {})
      },
      'writable': true
    },
    'decodeJid': {
      'value'(jid) {
        if (!jid || typeof jid !== "string") {
          return !!(jid !== null && jid !== undefined) && jid || null;
        }
        return jid.decodeJid();
      }
    },
    'logger': {
      'get'() {
        return {
          'info'(...args) {
            console.log(chalk.bold.bgRgb(51, 204, 51)("INFO "), '[' + chalk.rgb(255, 255, 255)(new Date().toUTCString()) + ']:', chalk.cyan(format(...args)));
          },
          'error'(...args) {
            console.log(chalk.bold.bgRgb(247, 38, 33)("ERROR "), '[' + chalk.rgb(255, 255, 255)(new Date().toUTCString()) + ']:', chalk.rgb(255, 38, 0)(format(...args)));
          },
          'warn'(...args) {
            console.log(chalk.bold.bgRgb(255, 153, 0)("WARNING "), '[' + chalk.rgb(255, 255, 255)(new Date().toUTCString()) + ']:', chalk.redBright(format(...args)));
          },
          'trace'(...args) {
            console.log(chalk.grey("TRACE "), '[' + chalk.rgb(255, 255, 255)(new Date().toUTCString()) + ']:', chalk.white(format(...args)));
          },
          'debug'(...args) {
            console.log(chalk.bold.bgRgb(66, 167, 245)("DEBUG "), '[' + chalk.rgb(255, 255, 255)(new Date().toUTCString()) + ']:', chalk.white(format(...args)));
          }
        };
      },
      'enumerable': true
    },
    'getFile': {
      async 'value'(input, saveToFile = false) {
        let response;
        let filePath;
        const buffer = Buffer.isBuffer(input) ? input : input instanceof ArrayBuffer ? input.toBuffer() : /^data:.*?\/.*?;base64,/i.test(input) ? Buffer.from(input.split`,`[1], 'base64') : /^https?:\/\//.test(input) ? await (response = await fetch(input)).buffer() : fs.existsSync(input) ? (filePath = input, fs.readFileSync(input)) : typeof input === 'string' ? input : Buffer.alloc(0);
        if (!Buffer.isBuffer(buffer)) {
          throw new TypeError("Result is not a buffer");
        }
        const fileInfo = (await fileTypeFromBuffer(buffer)) || {
          'mime': "application/octet-stream",
          'ext': '.bin'
        };
        if (buffer && saveToFile && !filePath) {
          filePath = path.join(__dirname, '../tmp/' + new Date() * 1 + '.' + fileInfo.ext);
          await fs.promises.writeFile(filePath, buffer);
        }
        return {
          'res': response,
          'filename': filePath,
          ...fileInfo,
          'data': buffer,
          'deleteFile'() {
            return filePath && fs.promises.unlink(filePath);
          }
        };
      },
      'enumerable': true
    },
    'waitEvent': {
      'value'(eventName, condition = () => true, maxTries = 25) {
        return new Promise((resolve, reject) => {
          let tries = 0;
          let handler = (...args) => {
            if (++tries > maxTries) {
              reject("Max tries reached");
            } else if (condition()) {
              connection.ev.off(eventName, handler);
              resolve(...args);
            }
          };
          connection.ev.on(eventName, handler);
        });
      }
    },
'sendFile': {
  async 'value'(jid, file, caption = '', quotedText = '', quotedMsg, asDocument = false, options = {}) {
    let fileData = await connection.getFile(file, true);
    let {
      res: response,
      data: fileBuffer,
      filename: filePath
    } = fileData;
    if (response && response.status !== 200 || fileBuffer.length <= 65536) {
      try {
        throw {
          'json': JSON.parse(fileBuffer.toString())
        };
      } catch (error) {
        if (error.json) {
          throw error.json;
        }
      }
    }
    const fileSize = fs.statSync(filePath).size / 1024 / 1024;
    if (fileSize >= 20000) {
      throw new Error(" ✳️  El tamaño del archivo es demasiado grande\n\n");
    }
    let messageOptions = {};
    if (quotedMsg) {
      messageOptions.quoted = quotedMsg;
    }
    if (!fileData) {
      options.asDocument = true;
    }
    let fileType = '';
    let mimeType = options.mimetype || fileData.mime;
    let audioData;
    if (/webp/.test(fileData.mime) || /image/.test(fileData.mime) && options.asSticker) {
      fileType = "sticker";
    } else {
      if (/image/.test(fileData.mime) || /webp/.test(fileData.mime) && options.asImage) {
        fileType = "image";
      } else {
        if (/video/.test(fileData.mime)) {
          fileType = "video";
        } else {
          if (/audio/.test(fileData.mime)) {
            audioData = await toAudio(fileBuffer, fileData.ext);
            fileBuffer = audioData.data;
            filePath = audioData.filename;
            fileType = 'audio';
            mimeType = options.mimetype || "audio/ogg; codecs=opus";
          } else {
            fileType = "document";
          }
        }
      }
    }
    if (options.asDocument) {
      fileType = "document";
    }
    delete options.asSticker;
    delete options.asLocation;
    delete options.asVideo;
    delete options.asDocument;
    delete options.asImage;
    let messageContent = {
      ...options,
      'caption': quotedText,
      'ptt': asDocument,
      [fileType]: {
        'url': filePath
      },
      'mimetype': mimeType,
      'fileName': caption || filePath.split('/').pop()
    };
    let result;
    try {
      result = await connection.sendMessage(jid, messageContent, {
        ...messageOptions,
        ...options
      });
    } catch (error) {
      console.error(error);
      result = null;
    } finally {
      if (!result) {
        result = await connection.sendMessage(jid, {
          ...messageContent,
          [fileType]: fileBuffer
        }, {
          ...messageOptions,
          ...options
        });
      }
      fileBuffer = null;
      return result;
    }
  },
  'enumerable': true
},
'sendContact': {
  async 'value'(jid, contacts, quotedMsg, options) {
    if (!Array.isArray(contacts[0]) && typeof contacts[0] === "string") {
      contacts = [contacts];
    }
    let vcards = [];
    for (let [number, name, id, email, website, label] of contacts) {
      number = number.replace(/[^0-9]/g, '');
      let vcard = ("\nBEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:" + name + "\nitem.ORG:Creator Bot\nitem1.TEL;waid=" + id + ':' + id + "@s.whatsapp.net\nitem1.X-ABLabel:" + label + "\nitem2.EMAIL;type=INTERNET:" + email + "\nitem2.X-ABLabel:Email\nitem5.URL:" + website + "\nitem5.X-ABLabel:Website\nEND:VCARD\n            ").trim();
      vcards.push({
        'vcard': vcard,
        'displayName': name
      });
    }
    return await connection.sendMessage(jid, {
      ...options,
      'contacts': {
        ...options,
        'displayName': vcards.length >= 2 ? vcards.length + " contactos" : vcards[0].displayName || null,
        'contacts': vcards
      }
    }, {
      'quoted': quotedMsg,
      ...options
    });
  },
  'enumerable': true
},    
'reply': {
  async 'value'(jid, content = '', quotedMsg, options) {
    if (Buffer.isBuffer(content)) {
      return connection.sendFile(jid, content, "file", '', quotedMsg, false, options);
    } else {
      let newsletterIds = ['120363417971954983@newsletter', '120363354023106228@newsletter'];
      let newsletterNames = ['JawadTechX 🇵🇰', 'JawadTechX 🇵🇸'];
      async function getRandomNewsletter() {
        let randomIndex = Math.floor(Math.random() * newsletterIds.length);
        let id = newsletterIds[randomIndex];
        let name = newsletterNames[randomIndex];
        return {
          'id': id,
          'nombre': name
        };
      }
      let newsletter = await getRandomNewsletter();
      const contextInfo = {
        'mentionedJid': await connection.parseMention(content),
        'isForwarded': true,
        'forwardingScore': 1,
        'forwardedNewsletterMessageInfo': {
          'newsletterJid': newsletter.id,
          'newsletterName': newsletter.nombre,
          'serverMessageId': 100
        }
      };
      const messageContent = {
        ...options,
        'text': content,
        'contextInfo': contextInfo
      };
      return connection.sendMessage(jid, messageContent, {
        'quoted': quotedMsg,
        ...options
      });
    }
  }
},
'sendButton': {
  async 'value'(jid, text = '', footer = '', buttons, buttonTexts, quotedMsg, options) {
    if (Array.isArray(buttons)) {
      options = quotedMsg;
      quotedMsg = buttonTexts;
      buttonTexts = buttons;
      buttons = null;
    }
    if (!Array.isArray(buttonTexts[0]) && typeof buttonTexts[0] === 'string') {
      buttonTexts = [buttonTexts];
    }
    if (!options) {
      options = {};
    }
    let buttonObjects = buttonTexts.map(button => ({
      'buttonId': button[1] || button[0],
      'buttonText': {
        'displayText': button[0] || ''
      },
      'type': 1
    }));
    let messageContent = {
      [buttons ? "caption" : "text"]: text || '',
      'footer': footer,
      'buttons': buttonObjects,
      'headerType': 4,
      'viewOnce': true,
      ...options,
      ...(buttons ? {
        'image': {
          'url': typeof buttons === "string" ? buttons : undefined
        }
      } : {})
    };
    return await connection.sendMessage(jid, messageContent, {
      'quoted': quotedMsg,
      'upload': connection.waUploadToServer,
      ...options
    });
  },
  'enumerable': true
},
'sendButton2': {
  async 'value'(jid, text = '', footer = '', media, buttons, copyCode, urls, quotedMsg, options) {
    let imageData;
    let videoData;
    if (/^https?:\/\//i.test(media)) {
      try {
        const response = await fetch(media);
        const contentType = response.headers.get("content-type");
        if (/^image\//i.test(contentType)) {
          imageData = await prepareWAMessageMedia({
            'image': {
              'url': media
            }
          }, {
            'upload': connection.waUploadToServer
          });
        } else if (/^video\//i.test(contentType)) {
          videoData = await prepareWAMessageMedia({
            'video': {
              'url': media
            }
          }, {
            'upload': connection.waUploadToServer
          });
        } else {
          console.error("Tipo MIME no compatible:", contentType);
        }
      } catch (error) {
        console.error("Error al obtener el tipo MIME:", error);
      }
    } else {
      try {
        const fileData = await connection.getFile(media);
        if (/^image\//i.test(fileData.mime)) {
          imageData = await prepareWAMessageMedia({
            'image': {
              'url': media
            }
          }, {
            'upload': connection.waUploadToServer
          });
        } else if (/^video\//i.test(fileData.mime)) {
          videoData = await prepareWAMessageMedia({
            'video': {
              'url': media
            }
          }, {
            'upload': connection.waUploadToServer
          });
        }
      } catch (error) {
        console.error("Error al obtener el tipo de archivo:", error);
      }
    }
    const quickReplies = buttons.map(button => ({
      'name': "quick_reply",
      'buttonParamsJson': JSON.stringify({
        'display_text': button[0],
        'id': button[1]
      })
    }));
    if (copyCode && (typeof copyCode === "string" || typeof copyCode === "number")) {
      quickReplies.push({
        'name': "cta_copy",
        'buttonParamsJson': JSON.stringify({
          'display_text': "Copy",
          'copy_code': copyCode
        })
      });
    }
    if (urls && Array.isArray(urls)) {
      urls.forEach(url => {
        quickReplies.push({
          'name': 'cta_url',
          'buttonParamsJson': JSON.stringify({
            'display_text': url[0],
            'url': url[1],
            'merchant_url': url[1]
          })
        });
      });
    }
    const interactiveMessage = {
      'body': {
        'text': text
      },
      'footer': {
        'text': footer
      },
      'header': {
        'hasMediaAttachment': false,
        'imageMessage': imageData ? imageData.imageMessage : null,
        'videoMessage': videoData ? videoData.videoMessage : null
      },
      'nativeFlowMessage': {
        'buttons': quickReplies,
        'messageParamsJson': ''
      }
    };
    let message = generateWAMessageFromContent(jid, {
      'viewOnceMessage': {
        'message': {
          'interactiveMessage': interactiveMessage
        }
      }
    }, {
      'userJid': connection.user.jid,
      'quoted': quotedMsg
    });
    connection.relayMessage(jid, message.message, {
      'messageId': message.key.id,
      ...options
    });
  }
},
'sendList': {
  async 'value'(jid, title, description, buttonText, media, sections, quotedMsg, options = {}) {
    let imageData;
    let videoData;
    if (/^https?:\/\//i.test(media)) {
      try {
        const response = await fetch(media);
        const contentType = response.headers.get("content-type");
        if (/^image\//i.test(contentType)) {
          imageData = await prepareWAMessageMedia({
            'image': {
              'url': media
            }
          }, {
            'upload': connection.waUploadToServer
          });
        } else if (/^video\//i.test(contentType)) {
          videoData = await prepareWAMessageMedia({
            'video': {
              'url': media
            }
          }, {
            'upload': connection.waUploadToServer
          });
        } else {
          console.error("Tipo MIME no compatible:", contentType);
        }
      } catch (error) {
        console.error("Error al obtener el tipo MIME:", error);
      }
    } else {
      try {
        const fileData = await connection.getFile(media);
        if (/^image\//i.test(fileData.mime)) {
          imageData = await prepareWAMessageMedia({
            'image': {
              'url': media
            }
          }, {
            'upload': connection.waUploadToServer
          });
        } else if (/^video\//i.test(fileData.mime)) {
          videoData = await prepareWAMessageMedia({
            'video': {
              'url': media
            }
          }, {
            'upload': connection.waUploadToServer
          });
        }
      } catch (error) {
        console.error("Error al obtener el tipo de archivo:", error);
      }
    }
    const sectionsList = [...sections];
    const interactiveMessage = {
      'interactiveMessage': {
        'header': {
          'title': title,
          'hasMediaAttachment': false,
          'imageMessage': imageData ? imageData.imageMessage : null,
          'videoMessage': videoData ? videoData.videoMessage : null
        },
        'body': {
          'text': description
        },
        'nativeFlowMessage': {
          'buttons': [{
            'name': "single_select",
            'buttonParamsJson': JSON.stringify({
              'title': buttonText,
              'sections': sectionsList
            })
          }],
          'messageParamsJson': ''
        }
      }
    };
    let message = generateWAMessageFromContent(jid, {
      'viewOnceMessage': {
        'message': interactiveMessage
      }
    }, {
      'userJid': connection.user.jid,
      'quoted': quotedMsg
    });
    connection.relayMessage(jid, message.message, {
      'messageId': message.key.id,
      ...options
    });
  }
},
'sendListM': {
  async 'value'(jid, listInfo, rows, quotedMsg, options = {}) {
    const sections = [{
      'title': listInfo.title,
      'rows': [...rows]
    }];
    const messageContent = {
      'text': listInfo.description,
      'footer': listInfo.footerText,
      'mentions': await connection.parseMention(listInfo.description),
      'title': '',
      'buttonText': listInfo.buttonText,
      'sections': sections
    };
    connection.sendMessage(jid, messageContent, {
      'quoted': quotedMsg
    });
  }
},
'updateProfileStatus': {
  async 'value'(status) {
    return connection.query({
      'tag': 'iq',
      'attrs': {
        'to': "s.whatsapp.net",
        'type': "set",
        'xmlns': "status"
      },
      'content': [{
        'tag': "status",
        'attrs': {},
        'content': Buffer.from(status, "utf-8")
      }]
    });
  }
},
'sendPayment': {
  async 'value'(jid, amount, currency = '', note = '', requestFrom, options) {
    const paymentData = {
      'amount': {
        'currencyCode': currency || "USD",
        'offset': 0,
        'value': amount || 9.99
      },
      'expiryTimestamp': 0,
      'amount1000': (amount || 9.99) * 1000,
      'currencyCodeIso4217': currency || 'USD',
      'requestFrom': requestFrom || "0@s.whatsapp.net",
      'noteMessage': {
        'extendedTextMessage': {
          'text': note || "Example Payment Message"
        }
      }
    };
    return connection.relayMessage(jid, {
      'requestPaymentMessage': paymentData
    }, {
      ...options
    });
  }
},

'sendPoll': {
  async 'value'(jid, name = '', options, additionalOptions) {
    if (!Array.isArray(options[0]) && typeof options[0] === 'string') {
      options = [options];
    }
    if (!additionalOptions) {
      additionalOptions = {};
    }
    const pollData = {
      'name': name,
      'options': options.map(option => ({
        'optionName': !!(option[0] !== null && option[0] !== undefined) && option[0] || ''
      })),
      'selectableOptionsCount': 1
    };
    return connection.relayMessage(jid, {
      'pollCreationMessage': pollData
    }, {
      ...additionalOptions
    });
  }
},
'loadingMsg': {
  async 'value'(jid, initialText, finalText, loadingMessages, quotedMsg, options) {
    let {
      key: messageKey
    } = await connection.sendMessage(jid, {
      'text': initialText,
      ...options
    }, {
      'quoted': quotedMsg
    });
    for (let i = 0; i < loadingMessages.length; i++) {
      await connection.sendMessage(jid, {
        'text': loadingMessages[i],
        'edit': messageKey,
        ...options
      }, {
        'quoted': quotedMsg
      });
    }
    await connection.sendMessage(jid, {
      'text': finalText,
      'edit': messageKey,
      ...options
    }, {
      'quoted': quotedMsg
    });
  }
},
'sendHydrated': {
  async 'value'(jid, text = '', footer = '', media, urlButtons, urlTexts, callButtons, callTexts, quickReplyButtons, quotedMsg, options) {
    let fileData;
    if (media) {
      try {
        fileData = await connection.getFile(media);
        media = fileData.data;
      } catch {
        media = media;
      }
    }
    if (media && !Buffer.isBuffer(media) && (typeof media === "string" || Array.isArray(media))) {
      options = quotedMsg;
      quotedMsg = quickReplyButtons;
      quickReplyButtons = callTexts;
      callTexts = callButtons;
      callButtons = urlTexts;
      urlTexts = urlButtons;
      urlButtons = media;
      media = null;
    }
    if (!options) {
      options = {};
    }
    let templateButtons = [];
    if (urlButtons || urlTexts) {
      if (!Array.isArray(urlButtons)) {
        urlButtons = [urlButtons];
      }
      if (!Array.isArray(urlTexts)) {
        urlTexts = [urlTexts];
      }
      templateButtons.push(...(urlButtons.map((button, index) => [button, urlTexts[index]]).map(([url, text], i) => ({
        'index': templateButtons.length + i + 1,
        'urlButton': {
          'displayText': !!(text !== null && text !== undefined) && text || !!(url !== null && url !== undefined) && url || '',
          'url': !!(url !== null && url !== undefined) && url || !!(text !== null && text !== undefined) && text || ''
        }
      })) || []));
    }
    if (callButtons || callTexts) {
      if (!Array.isArray(callButtons)) {
        callButtons = [callButtons];
      }
      if (!Array.isArray(callTexts)) {
        callTexts = [callTexts];
      }
      templateButtons.push(...(callButtons.map((button, index) => [button, callTexts[index]]).map(([number, text], i) => ({
        'index': templateButtons.length + i + 1,
        'callButton': {
          'displayText': !!(text !== null && text !== undefined) && text || !!(number !== null && number !== undefined) && number || '',
          'phoneNumber': !!(number !== null && number !== undefined) && number || !!(text !== null && text !== undefined) && text || ''
        }
      })) || []));
    }
    if (quickReplyButtons.length) {
      if (!Array.isArray(quickReplyButtons[0])) {
        quickReplyButtons = [quickReplyButtons];
      }
      templateButtons.push(...(quickReplyButtons.map(([displayText, id], i) => ({
        'index': templateButtons.length + i + 1,
        'quickReplyButton': {
          'displayText': !!(displayText !== null && displayText !== undefined) && displayText || !!(id !== null && id !== undefined) && id || '',
          'id': !!(id !== null && id !== undefined) && id || !!(displayText !== null && displayText !== undefined) && displayText || ''
        }
      })) || []));
    }
    let messageContent = {
      ...options,
      [media ? "caption" : "text"]: text || '',
      'footer': footer,
      'templateButtons': templateButtons,
      ...(media ? options.asLocation && /image/.test(fileData.mime) ? {
        'location': {
          ...options,
          'jpegThumbnail': media
        }
      } : {
        [/video/.test(fileData.mime) ? "video" : /image/.test(fileData.mime) ? "image" : "document"]: media
      } : {})
    };
    return await connection.sendMessage(jid, messageContent, {
      'quoted': quotedMsg,
      'upload': connection.waUploadToServer,
      ...options
    });
  },
  'enumerable': true
},

'sendHydrated2': {
  async 'value'(jid, text = '', footer = '', media, urlButtons, urlTexts, callButtons, callTexts, quickReplyButtons, quotedMsg, options) {
    let fileData;
    if (media) {
      try {
        fileData = await connection.getFile(media);
        media = fileData.data;
      } catch {
        media = media;
      }
    }
    if (media && !Buffer.isBuffer(media) && (typeof media === "string" || Array.isArray(media))) {
      options = quotedMsg;
      quotedMsg = quickReplyButtons;
      quickReplyButtons = callTexts;
      callTexts = callButtons;
      callButtons = urlTexts;
      urlTexts = urlButtons;
      urlButtons = media;
      media = null;
    }
    if (!options) {
      options = {};
    }
    let templateButtons = [];
    if (urlButtons || urlTexts) {
      if (!Array.isArray(urlButtons)) {
        urlButtons = [urlButtons];
      }
      if (!Array.isArray(urlTexts)) {
        urlTexts = [urlTexts];
      }
      templateButtons.push(...(urlButtons.map((button, index) => [button, urlTexts[index]]).map(([url, text], i) => ({
        'index': templateButtons.length + i + 1,
        'urlButton': {
          'displayText': !!(text !== null && text !== undefined) && text || !!(url !== null && url !== undefined) && url || '',
          'url': !!(url !== null && url !== undefined) && url || !!(text !== null && text !== undefined) && text || ''
        }
      })) || []));
    }
    if (callButtons || callTexts) {
      if (!Array.isArray(callButtons)) {
        callButtons = [callButtons];
      }
      if (!Array.isArray(callTexts)) {
        callTexts = [callTexts];
      }
      templateButtons.push(...(callButtons.map((button, index) => [button, callTexts[index]]).map(([number, text], i) => ({
        'index': templateButtons.length + i + 1,
        'callButton': {
          'displayText': !!(text !== null && text !== undefined) && text || !!(number !== null && number !== undefined) && number || '',
          'phoneNumber': !!(number !== null && number !== undefined) && number || !!(text !== null && text !== undefined) && text || ''
        }
      })) || []));
    }
    if (quickReplyButtons.length) {
      if (!Array.isArray(quickReplyButtons[0])) {
        quickReplyButtons = [quickReplyButtons];
      }
      templateButtons.push(...(quickReplyButtons.map(([displayText, id], i) => ({
        'index': templateButtons.length + i + 1,
        'quickReplyButton': {
          'displayText': !!(displayText !== null && displayText !== undefined) && displayText || !!(id !== null && id !== undefined) && id || '',
          'id': !!(id !== null && id !== undefined) && id || !!(displayText !== null && displayText !== undefined) && displayText || ''
        }
      })) || []));
    }
    let messageContent = {
      ...options,
      [media ? "caption" : "text"]: text || '',
      'footer': footer,
      'templateButtons': templateButtons,
      ...(media ? options.asLocation && /image/.test(fileData.mime) ? {
        'location': {
          ...options,
          'jpegThumbnail': media
        }
      } : {
        [/video/.test(fileData.mime) ? "video" : /image/.test(fileData.mime) ? 'image' : 'document']: media
      } : {})
    };
    return await connection.sendMessage(jid, messageContent, {
      'quoted': quotedMsg,
      'upload': connection.waUploadToServer,
      ...options
    });
  },
  'enumerable': true
},
'cMod': {
  'value'(jid, message, newText = '', sender = connection.user.jid, options = {}) {
    if (options.mentions && !Array.isArray(options.mentions)) {
      options.mentions = [options.mentions];
    }
    let messageCopy = message.toJSON();
    delete messageCopy.message.messageContextInfo;
    delete messageCopy.message.senderKeyDistributionMessage;
    let messageType = Object.keys(messageCopy.message)[0];
    let messageContent = messageCopy.message;
    let content = messageContent[messageType];
    if (typeof content === "string") {
      messageContent[messageType] = newText || content;
    } else {
      if (content.caption) {
        content.caption = newText || content.caption;
      } else {
        if (content.text) {
          content.text = newText || content.text;
        }
      }
    }
    if (typeof content !== "string") {
      messageContent[messageType] = {
        ...content,
        ...options
      };
      messageContent[messageType].contextInfo = {
        ...(content.contextInfo || {}),
        'mentionedJid': options.mentions || content.contextInfo?.["mentionedJid"] || []
      };
    }
    if (messageCopy.participant) {
      sender = messageCopy.participant = sender || messageCopy.participant;
    } else {
      if (messageCopy.key.participant) {
        sender = messageCopy.key.participant = sender || messageCopy.key.participant;
      }
    }
    if (messageCopy.key.remoteJid.includes('@s.whatsapp.net')) {
      sender = sender || messageCopy.key.remoteJid;
    } else {
      if (messageCopy.key.remoteJid.includes("@broadcast")) {
        sender = sender || messageCopy.key.remoteJid;
      }
    }
    messageCopy.key.remoteJid = jid;
    messageCopy.key.fromMe = areJidsSameUser(sender, connection.user.id) || false;
    return proto.WebMessageInfo.fromObject(messageCopy);
  },
  'enumerable': true
},
'copyNForward': {
  async 'value'(jid, message, forward = true, options = {}) {
    let messageType;
    if (options.readViewOnce && message.message.viewOnceMessage?.["message"]) {
      messageType = Object.keys(message.message.viewOnceMessage.message)[0];
      delete message.message.viewOnceMessage.message[messageType].viewOnce;
      message.message = proto.Message.fromObject(JSON.parse(JSON.stringify(message.message.viewOnceMessage.message)));
      message.message[messageType].contextInfo = message.message.viewOnceMessage.contextInfo;
    }
    let messageKey = Object.keys(message.message)[0];
    let forwardContent = generateForwardMessageContent(message, !!forward);
    let contentKey = Object.keys(forwardContent)[0];
    if (forward && typeof forward === "number" && forward > 1) {
      forwardContent[contentKey].contextInfo.forwardingScore += forward;
    }
    forwardContent[contentKey].contextInfo = {
      ...(message.message[messageKey].contextInfo || {}),
      ...(forwardContent[contentKey].contextInfo || {})
    };
    forwardContent = generateWAMessageFromContent(jid, forwardContent, {
      ...options,
      'userJid': connection.user.jid
    });
    await connection.relayMessage(jid, forwardContent.message, {
      'messageId': forwardContent.key.id,
      'additionalAttributes': {
        ...options
      }
    });
    return forwardContent;
  },
  'enumerable': true
},

'fakeReply': {
  'value'(jid, text = '', sender = this.user.jid, fakeText = '', remoteJid, options) {
    return connection.reply(jid, text, {
      'key': {
        'fromMe': areJidsSameUser(sender, connection.user.id),
        'participant': sender,
        ...(remoteJid ? {
          'remoteJid': remoteJid
        } : {})
      },
      'message': {
        'conversation': fakeText
      },
      ...options
    });
  }
},
'downloadM': {
  async 'value'(message, type, saveToFile) {
    let filename;
    if (!message || !(message.url || message.directPath)) {
      return Buffer.alloc(0);
    }
    const downloadStream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of downloadStream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    if (saveToFile) {
      ({
        filename: filename
      } = await connection.getFile(buffer, true));
    }
    return saveToFile && fs.existsSync(filename) ? filename : buffer;
  },
  'enumerable': true
},
'parseMention': {
  'value'(text = '') {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(match => match[1] + '@s.whatsapp.net');
  },
  'enumerable': true
},
'getName': {
  'value'(jid = '', withoutContact = false) {
    jid = connection.decodeJid(jid);
    withoutContact = connection.withoutContact || withoutContact;
    let chat;
    if (jid.endsWith("@g.us")) {
      return new Promise(async resolve => {
        chat = connection.chats[jid] || {};
        if (!(chat.name || chat.subject)) {
          chat = (await connection.groupMetadata(jid)) || {};
        }
        resolve(chat.name || chat.subject || PhoneNumber('+' + jid.replace("@s.whatsapp.net", '')).getNumber('international'));
      });
    } else {
      chat = jid === '0@s.whatsapp.net' ? {
        'jid': jid,
        'vname': 'WhatsApp'
      } : areJidsSameUser(jid, connection.user.id) ? connection.user : connection.chats[jid] || {};
    }
    return (withoutContact ? '' : chat.name) || chat.subject || chat.vname || chat.notify || chat.verifiedName || PhoneNumber('+' + jid.replace("@s.whatsapp.net", '')).getNumber("international");
  },
  'enumerable': true
},

'loadMessage': {
  'value'(messageId) {
    return Object.entries(connection.chats)
      .filter(([_, { messages }]) => typeof messages === 'object')
      .find(([_, { messages }]) => 
        Object.entries(messages).find(([id, msg]) => 
          id === messageId || msg.key?.id === messageId
        )
      )?.[1].messages?.[messageId];
  },
  'enumerable': true
},
'sendGroupV4Invite': {
  async 'value'(groupId, to, inviteCode, expireTime, subject = "unknown subject", caption = "Invitation to join my WhatsApp group", thumbnail, options = {}) {
    const inviteMessage = proto.Message.fromObject({
      'groupInviteMessage': proto.GroupInviteMessage.fromObject({
        'inviteCode': inviteCode,
        'inviteExpiration': parseInt(expireTime) || +new Date(new Date() + 259200000),
        'groupJid': groupId,
        'groupName': (subject ? subject : await connection.getName(groupId)) || null,
        'jpegThumbnail': Buffer.isBuffer(thumbnail) ? thumbnail : null,
        'caption': caption
      })
    });
    const message = generateWAMessageFromContent(to, inviteMessage, options);
    await connection.relayMessage(to, message.message, {
      'messageId': message.key.id,
      'additionalAttributes': {
        ...options
      }
    });
    return message;
  },
  'enumerable': true
},
'processMessageStubType': {
  async 'value'(message) {
    if (!message.messageStubType) return;
    
    const groupId = connection.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '');
    if (!groupId || groupId === "status@broadcast") return;

    const updateGroup = (update) => {
      ev.emit('groups.update', [{
        'id': groupId,
        ...update
      }]);
    };

    switch (message.messageStubType) {
      case WAMessageStubType.REVOKE:
      case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
        updateGroup({
          'revoke': message.messageStubParameters[0]
        });
        break;
      case WAMessageStubType.GROUP_CHANGE_ICON:
        updateGroup({
          'icon': message.messageStubParameters[0]
        });
        break;
      default:
        console.log({
          'messageStubType': message.messageStubType,
          'messageStubParameters': message.messageStubParameters,
          'type': WAMessageStubType[message.messageStubType]
        });
        break;
    }

    const isGroup = groupId.endsWith("@g.us");
    if (!isGroup) return;

    let chat = connection.chats[groupId];
    if (!chat) {
      chat = connection.chats[groupId] = {
        'id': groupId
      };
    }
    chat.isChats = true;

    const metadata = await connection.groupMetadata(groupId).catch(_ => null);
    if (!metadata) return;
    
    chat.subject = metadata.subject;
    chat.metadata = metadata;
  }
},
'insertAllGroup': {
  async 'value'() {
    const groups = (await connection.groupFetchAllParticipating().catch(_ => null)) || {};
    for (const id in groups) {
      connection.chats[id] = {
        ...(connection.chats[id] || {}),
        'id': id,
        'subject': groups[id].subject,
        'isChats': true,
        'metadata': groups[id]
      };
    }
    return connection.chats;
  }
},
'pushMessage': {
  async 'value'(messages) {
    if (!messages) return;
    if (!Array.isArray(messages)) messages = [messages];

    for (const message of messages) {
      try {
        if (!message) continue;

        // Process message stub types
        if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) {
          connection.processMessageStubType(message).catch(console.error);
        }

        const messageKeys = Object.keys(message.message || {});
        const messageType = !["senderKeyDistributionMessage", "messageContextInfo"].includes(messageKeys[0]) && messageKeys[0] || 
                          messageKeys.length >= 3 && messageKeys[1] !== "messageContextInfo" && messageKeys[1] || 
                          messageKeys[messageKeys.length - 1];

        const chatId = connection.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '');

        // Process quoted messages
        if (message.message?.[messageType]?.contextInfo?.quotedMessage) {
          const contextInfo = message.message[messageType].contextInfo;
          const participant = connection.decodeJid(contextInfo.participant);
          const quotedChatId = connection.decodeJid(contextInfo.remoteJid || participant);
          let quotedMessage = message.message[messageType].contextInfo.quotedMessage;

          if (quotedChatId && quotedChatId !== 'status@broadcast' && quotedMessage) {
            let quotedType = Object.keys(quotedMessage)[0];
            
            // Convert conversation to extendedTextMessage if needed
            if (quotedType == "conversation") {
              quotedMessage.extendedTextMessage = {
                'text': quotedMessage[quotedType]
              };
              delete quotedMessage.conversation;
              quotedType = 'extendedTextMessage';
            }

            // Ensure contextInfo exists
            if (!quotedMessage[quotedType].contextInfo) {
              quotedMessage[quotedType].contextInfo = {};
            }

            // Add mentioned jids
            quotedMessage[quotedType].contextInfo.mentionedJid = 
              contextInfo.mentionedJid || quotedMessage[quotedType].contextInfo.mentionedJid || [];

            const isGroupQuoted = quotedChatId.endsWith("g.us");
            const sender = isGroupQuoted && !participant ? quotedChatId : participant;

            const quotedMsgObj = {
              'key': {
                'remoteJid': quotedChatId,
                'fromMe': areJidsSameUser(connection.user.jid, quotedChatId),
                'id': contextInfo.stanzaId,
                'participant': sender
              },
              'message': JSON.parse(JSON.stringify(quotedMessage)),
              ...(isGroupQuoted ? { 'participant': sender } : {})
            };

            // Store quoted message
            let quotedChat = connection.chats[sender];
            if (!quotedChat) {
              quotedChat = connection.chats[sender] = {
                'id': sender,
                'isChats': !isGroupQuoted
              };
            }

            if (!quotedChat.messages) {
              quotedChat.messages = {};
            }

            if (!quotedChat.messages[contextInfo.stanzaId] && !quotedMsgObj.key.fromMe) {
              quotedChat.messages[contextInfo.stanzaId] = quotedMsgObj;
            }

            // Limit stored messages
            if (Object.entries(quotedChat.messages).length > 40) {
              quotedChat.messages = Object.fromEntries(
                Object.entries(quotedChat.messages).slice(30)
              );
            }
          }
        }

        if (!chatId || chatId === "status@broadcast") continue;

        const isGroup = chatId.endsWith("@g.us");
        let chat = connection.chats[chatId];

        if (!chat) {
          if (isGroup) {
            await connection.insertAllGroup().catch(console.error);
          }
          chat = connection.chats[chatId] = {
            'id': chatId,
            'isChats': true,
            ...(connection.chats[chatId] || {})
          };
        }

        let metadata;
        let sender;

        if (isGroup) {
          if (!chat.subject || !chat.metadata) {
            metadata = (await connection.groupMetadata(chatId).catch(_ => ({}))) || {};
            if (!chat.subject) chat.subject = metadata.subject || '';
            if (!chat.metadata) chat.metadata = metadata;
          }

          sender = connection.decodeJid(
            message.key?.fromMe && connection.user.id || 
            message.participant || 
            message.key?.participant || 
            chatId || ''
          );

          if (sender !== chatId) {
            let senderChat = connection.chats[sender];
            if (!senderChat) {
              senderChat = connection.chats[sender] = {
                'id': sender
              };
            }
            if (!senderChat.name) {
              senderChat.name = message.pushName || senderChat.name || '';
            }
          }
        } else {
          if (!chat.name) {
            chat.name = message.pushName || chat.name || '';
          }
        }

        if (['senderKeyDistributionMessage', "messageContextInfo"].includes(messageType)) {
          continue;
        }

        chat.isChats = true;

        if (!chat.messages) {
          chat.messages = {};
        }

        const isFromMe = message.key.fromMe || areJidsSameUser(sender || chatId, connection.user.id);

        if (!["protocolMessage"].includes(messageType) && 
            !isFromMe && 
            message.messageStubType != WAMessageStubType.CIPHERTEXT && 
            message.message) {
          
          // Clean up message
          delete message.message.messageContextInfo;
          delete message.message.senderKeyDistributionMessage;

          // Store message
          chat.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2));

          // Limit stored messages
          if (Object.entries(chat.messages).length > 40) {
            chat.messages = Object.fromEntries(
              Object.entries(chat.messages).slice(30)
            );
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}

    'serializeM': {
      'value'(message) {
        return smsg(connection, message);
      }
    },
    ...(typeof connection.chatRead !== "function" ? {
      'chatRead': {
        'value'(jid, participant = connection.user.jid, messageId) {
          return connection.sendReadReceipt(jid, participant, [messageId]);
        },
        'enumerable': true
      }
    } : {}),
    ...(typeof connection.setStatus !== "function" ? {
      'setStatus': {
        'value'(status) {
          return connection.query({
            'tag': 'iq',
            'attrs': {
              'to': S_WHATSAPP_NET,
              'type': "set",
              'xmlns': "status"
            },
            'content': [{
              'tag': 'status',
              'attrs': {},
              'content': Buffer.from(status, "utf-8")
            }]
          });
        },
        'enumerable': true
      }
    } : {})
  });

  if (connection.user?.id) {
    connection.user.jid = connection.decodeJid(connection.user.id);
  }
  store.bind(connection);
  return connection;
}

export function smsg(conn, message, options) {
  if (!message) return message;

  let MessageInfo = proto.WebMessageInfo;
  message = MessageInfo.fromObject(message);
  message.conn = conn;

  let key;
  if (message.message) {
    if (message.mtype == "protocolMessage" && message.msg.key) {
      key = message.msg.key;
      if (key == 'status@broadcast') {
        key.remoteJid = message.chat;
      }
      if (!key.participant || key.participant == 'status_me') {
        key.participant = message.sender;
      }
      key.fromMe = conn.decodeJid(key.participant) === conn.decodeJid(conn.user.id);
      if (!key.fromMe && key.remoteJid === conn.decodeJid(conn.user.id)) {
        key.remoteJid = message.sender;
      }
    }
    if (message.quoted && !message.quoted.mediaMessage) {
      delete message.quoted.download;
    }
  }
  if (!message.mediaMessage) {
    delete message.download;
  }

  try {
    if (key && message.mtype == "protocolMessage") {
      conn.ev.emit("message.delete", key);
    }
  } catch (error) {
    console.error(error);
  }

  return message;
}

export function serialize() {
  const mediaTypes = ["imageMessage", 'videoMessage', "audioMessage", 'stickerMessage', "documentMessage"];
  
  return Object.defineProperties(proto.WebMessageInfo.prototype, {
    'conn': {
      'value': undefined,
      'enumerable': false,
      'writable': true
    },
    'id': {
      'get'() {
        return this.key?.id;
      }
    },
    'isBaileys': {
      'get'() {
        return this.id?.length === 16 || 
               (this.id?.startsWith('3EB0') && this.id?.length === 12) || 
               false;
      }
    },
    'chat': {
      'get'() {
        const groupId = this.message?.senderKeyDistributionMessage?.groupId;
        return (this.key?.remoteJid || (groupId && groupId !== "status@broadcast") || '').decodeJid();
      }
    },
    'isGroup': {
      'get'() {
        return this.chat.endsWith("@g.us");
      },
      'enumerable': true
    },
    'sender': {
      'get'() {
        return this.conn?.decodeJid(
          this.key?.fromMe && this.conn?.user.id || 
          this.participant || 
          this.key.participant || 
          this.chat || ''
        );
      },
      'enumerable': true
    },
    'fromMe': {
      'get'() {
        return this.key?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender) || false;
      }
    },
    'mtype': {
      'get'() {
        if (!this.message) return '';
        const messageKeys = Object.keys(this.message);
        return !["senderKeyDistributionMessage", "messageContextInfo"].includes(messageKeys[0]) && messageKeys[0] || 
               messageKeys.length >= 3 && messageKeys[1] !== 'messageContextInfo' && messageKeys[1] || 
               messageKeys[messageKeys.length - 1];
      },
      'enumerable': true
    },
    'msg': {
      'get'() {
        if (!this.message) return null;
        return this.message[this.mtype];
      }
    },
    'mediaMessage': {
      'get'() {
        if (!this.message) return null;
        const content = (this.msg?.url || this.msg?.directPath ? 
          {...this.message} : 
          extractMessageContent(this.message)) || null;
        if (!content) return null;
        const type = Object.keys(content)[0];
        return mediaTypes.includes(type) ? content : null;
      },
      'enumerable': true
    },
    'mediaType': {
      'get'() {
        let media;
        if (!(media = this.mediaMessage)) return null;
        return Object.keys(media)[0];
      },
      'enumerable': true
    },
    'quoted': {
      'get'() {
        const self = this;
        const msg = self.msg;
        const contextInfo = msg?.contextInfo;
        const quotedMsg = contextInfo?.quotedMessage;
        
        if (!msg || !contextInfo || !quotedMsg) return null;

        const quotedType = Object.keys(quotedMsg)[0];
        let quotedContent = quotedMsg[quotedType];
        const quotedText = typeof quotedContent === 'string' ? quotedContent : quotedContent.text;

        return Object.defineProperties(JSON.parse(JSON.stringify(
          typeof quotedContent === "string" ? {'text': quotedContent} : quotedContent
        )), {
          'mtype': {
            'get'() { return quotedType; },
            'enumerable': true
          },
          'mediaMessage': {
            'get'() {
              const content = (quotedContent.url || quotedContent.directPath ? 
                {...quotedMsg} : 
                extractMessageContent(quotedMsg)) || null;
              if (!content) return null;
              const type = Object.keys(content)[0];
              return mediaTypes.includes(type) ? content : null;
            },
            'enumerable': true
          },
          'mediaType': {
            'get'() {
              let media;
              if (!(media = this.mediaMessage)) return null;
              return Object.keys(media)[0];
            },
            'enumerable': true
          },
          'id': {
            'get'() { return contextInfo.stanzaId; },
            'enumerable': true
          },
          'chat': {
            'get'() { return contextInfo.remoteJid || self.chat; },
            'enumerable': true
          },
          'isBaileys': {
            'get'() {
              return this.id?.length === 16 || 
                     (this.id?.startsWith("3EB0") && this.id.length === 12) || 
                     false;
            },
            'enumerable': true
          },
          'sender': {
            'get'() {
              return (contextInfo.participant || this.chat || '').decodeJid();
            },
            'enumerable': true
          },
          'fromMe': {
            'get'() {
              return areJidsSameUser(this.sender, self.conn?.user.jid);
            },
            'enumerable': true
          },
          'text': {
            'get'() {
              return quotedText || this.caption || this.contentText || this.selectedDisplayText || '';
            },
            'enumerable': true
          },
          'mentionedJid': {
            'get'() {
              return quotedContent.contextInfo?.mentionedJid || 
                     self.getQuotedObj()?.mentionedJid || [];
            },
            'enumerable': true
          },
          'name': {
            'get'() {
              const sender = this.sender;
              return sender ? self.conn?.getName(sender) : null;
            },
            'enumerable': true
          },
          'vM': {
            'get'() {
              return proto.WebMessageInfo.fromObject({
                'key': {
                  'fromMe': this.fromMe,
                  'remoteJid': this.chat,
                  'id': this.id
                },
                'message': quotedMsg,
                ...(self.isGroup ? {'participant': this.sender} : {})
              });
            }
          },
          'fakeObj': {
            'get'() { return this.vM; }
          },
          'download': {
            'value'(saveToFile = false) {
              const type = this.mediaType;
              return self.conn?.downloadM(this.mediaMessage[type], type.replace(/message/i, ''), saveToFile);
            },
            'enumerable': true,
            'configurable': true
          },
          'reply': {
            'value'(text, jid, options) {
              return self.conn?.reply(jid ? jid : this.chat, text, this.vM, options);
            },
            'enumerable': true
          },
          'copy': {
            'value'() {
              const MessageInfo = proto.WebMessageInfo;
              return smsg(conn, MessageInfo.fromObject(MessageInfo.toObject(this.vM)));
            },
            'enumerable': true
          },
          'forward': {
            'value'(jid, force = false, options) {
              return self.conn?.sendMessage(jid, {
                'forward': this.vM,
                'force': force,
                ...options
              }, {...options});
            },
            'enumerable': true
          },
          'copyNForward': {
            'value'(jid, force = false, options) {
              return self.conn?.copyNForward(jid, this.vM, force, options);
            },
            'enumerable': true
          },
          'cMod': {
            'value'(jid, text = '', sender = this.sender, options = {}) {
              return self.conn?.cMod(jid, this.vM, text, sender, options);
            },
            'enumerable': true
          },
          'delete': {
            'value'() {
              return self.conn?.sendMessage(this.chat, {'delete': this.vM.key});
            },
            'enumerable': true
          },
          'react': {
            'value'(reaction) {
              return self.conn?.sendMessage(this.chat, {
                'react': {
                  'text': reaction,
                  'key': this.vM.key
                }
              });
            },
            'enumerable': true
          }
        });
      },
      'enumerable': true
    },
    '_text': {
      'value': null,
      'writable': true
    },
    'text': {
      'get'() {
        const msg = this.msg;
        const text = (typeof msg === "string" ? msg : msg?.text) || 
                    msg?.caption || 
                    msg?.contentText || '';
        return typeof this._text === "string" ? this._text : '' || 
               (typeof text === 'string' ? text : 
                text?.selectedDisplayText || 
                text?.hydratedTemplate?.hydratedContentText || 
                text) || '';
      },
      'set'(text) {
        return this._text = text;
      },
      'enumerable': true
    },
    'mentionedJid': {
      'get'() {
        return this.msg?.contextInfo?.mentionedJid?.length && 
               this.msg.contextInfo.mentionedJid || [];
      },
      'enumerable': true
    },
    'name': {
      'get'() {
        return !!this.pushName || this.conn?.getName(this.sender);
      },
      'enumerable': true
    },
    'download': {
      'value'(saveToFile = false) {
        const type = this.mediaType;
        return this.conn?.downloadM(this.mediaMessage[type], type.replace(/message/i, ''), saveToFile);
      },
      'enumerable': true,
      'configurable': true
    },
    'reply': {
      'value'(text, jid, options) {
        return this.conn?.reply(jid ? jid : this.chat, text, this, options);
      }
    },
    'copy': {
      'value'() {
        const MessageInfo = proto.WebMessageInfo;
        return smsg(this.conn, MessageInfo.fromObject(MessageInfo.toObject(this)));
      },
      'enumerable': true
    },
    'forward': {
      'value'(jid, force = false, options = {}) {
        return this.conn?.sendMessage(jid, {
          'forward': this,
          'force': force,
          ...options
        }, {...options});
      },
      'enumerable': true
    },
    'copyNForward': {
      'value'(jid, force = false, options = {}) {
        return this.conn?.copyNForward(jid, this, force, options);
      },
      'enumerable': true
    },
    'cMod': {
      'value'(jid, text = '', sender = this.sender, options = {}) {
        return this.conn?.cMod(jid, this, text, sender, options);
      },
      'enumerable': true
    },
    'getQuotedObj': {
      'value'() {
        if (!this.quoted.id) return null;
        const quotedMsg = proto.WebMessageInfo.fromObject(
          this.conn?.loadMessage(this.quoted.id) || this.quoted.vM
        );
        return smsg(this.conn, quotedMsg);
      },
      'enumerable': true
    },
    'getQuotedMessage': {
      'get'() { return this.getQuotedObj; }
    },
    'delete': {
      'value'() {
        return this.conn?.sendMessage(this.chat, {'delete': this.key});
      },
      'enumerable': true
    },
    'react': {
      'value'(reaction) {
        return this.conn?.sendMessage(this.chat, {
          'react': {
            'text': reaction,
            'key': this.key
          }
        });
      },
      'enumerable': true
    }
  });
}

export function logic(input, inputArr, outputArr) {
  if (inputArr.length !== outputArr.length) {
    throw new Error("Input and Output must have same length");
  }
  for (let i in inputArr) {
    if (util.isDeepStrictEqual(input, inputArr[i])) {
      return outputArr[i];
    }
  }
  return null;
}

export function protoType() {
  Buffer.prototype.toArrayBuffer = function() {
    const buffer = new ArrayBuffer(this.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < this.length; ++i) {
      view[i] = this[i];
    }
    return buffer;
  };

  Buffer.prototype.toArrayBufferV2 = function() {
    return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength);
  };

  ArrayBuffer.prototype.toBuffer = function() {
    return Buffer.from(new Uint8Array(this));
  };

  Uint8Array.prototype.getFileType = 
  ArrayBuffer.prototype.getFileType = 
  Buffer.prototype.getFileType = async function() {
    return await fileTypeFromBuffer(this);
  };

  String.prototype.isNumber = 
  Number.prototype.isNumber = isNumber;

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1, this.length);
  };

  String.prototype.capitalizeV2 = function() {
    const words = this.split(" ");
    return words.map(word => word.capitalize()).join(" ");
  };

  String.prototype.decodeJid = function() {
    if (/:\d+@/gi.test(this)) {
      const decoded = jidDecode(this) || {};
      return (decoded.user && decoded.server && 
             decoded.user + '@' + decoded.server || this).trim();
    } else {
      return this.trim();
    }
  };

  Number.prototype.toTimeString = function() {
    const seconds = Math.floor(this / 1000 % 60);
    const minutes = Math.floor(this / 60000 % 60);
    const hours = Math.floor(this / 3600000 % 24);
    const days = Math.floor(this / 86400000);
    return ((days ? days + " day(s) " : '') + 
            (hours ? hours + " hour(s) " : '') + 
            (minutes ? minutes + " minute(s) " : '') + 
            (seconds ? seconds + " second(s)" : '')).trim();
  };

  Number.prototype.getRandom = 
  String.prototype.getRandom = 
  Array.prototype.getRandom = getRandom;
}

function isNumber() {
  const num = parseInt(this);
  return typeof num === "number" && !isNaN(num);
}

function getRandom() {
  if (Array.isArray(this) || this instanceof String) {
    return this[Math.floor(Math.random() * this.length)];
  }
  return Math.floor(Math.random() * this);
}

function nullish(value) {
  return !(value !== null && value !== undefined);
}
