let handler = async m => m.reply(`*Thanks for using JAWAD-MD!*\n\nJoin our official support & update channel for latest features, bug fixes, and help:\n\n👉 *Official Channel:* https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j\n\nStay connected for more!`.trim())
handler.help = ['support']
handler.tags = ['main']
handler.command = ['support', 'ch', 'channel', 'sup'] 

export default handler