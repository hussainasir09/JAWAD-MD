let handler = async (m, { conn, text, usedPrefix, command }) => {
  
  m.reply(`
✨ **JAWAD MD All Gist Plugins for Installation** ✨
  
📂 **Installation**  
**.install** _<paste gist link>_

**📜 Plugins List:**
1️⃣ **All GP JIDs Plugin**  

   🔗 Soon Available ⤵️ 
   
2️⃣ **Soon more will be added!**  
   🌟 _Or you can create your own._

3️⃣ **Placeholder Plugin (Coming Soon)**  
  `)
  
}

handler.help = ['listplugins']
handler.tags = ['owner']
handler.command = /^(listplugin|plugins|pluginslist)$/i
handler.rowner = false

export default handler
