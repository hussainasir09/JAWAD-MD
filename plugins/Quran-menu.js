let handler = async (m, { conn, usedPrefix, command }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
  if (!(who in global.db.data.users)) throw `✳️ The user is not found in my database`;

  let pp = 'https://files.catbox.moe/8fy6up.jpg';
  let more = String.fromCharCode(8206);
  let readMore = more.repeat(850);

  let lkr = `
╭─❍ *『 𝐐𝐔𝐑𝐀𝐍 𝐌𝐄𝐍𝐔 』* ❍─╮
│
│  ﷽ *In the name of Allah, the Most Gracious, the Most Merciful*
│
│ *Surah List (1-114)*
│
│ 1. 🕌 Al-Fatiha (The Opening) - الفاتحہ
│ 2. 🐄 Al-Baqarah (The Cow) - البقرہ
│ 3. 🏠 Aali Imran (The Family of Imran) - آل عمران
│ 4. 👩 An-Nisa' (The Women) - النساء
│ 5. 🍽️ Al-Ma'idah (The Table Spread) - المائدہ
│ 6. 🐪 Al-An'am (The Cattle) - الانعام
│ 7. ⛰️ Al-A'raf (The Heights) - الأعراف
│ 8. ⚔️ Al-Anfal (The Spoils of War) - الانفال
│ 9. 🙏 At-Tawbah (The Repentance) - التوبہ
│10. 🐟 Yunus (Jonah) - یونس
│11. 🌩️ Hud (Hud) - ہود
│12. 👶 Yusuf (Joseph) - یوسف
│13. ⚡ Ar-Rad (The Thunder) - الرعد
│14. 🕊️ Ibrahim (Abraham) - ابراہیم
│15. 🪨 Al-Hijr (The Rocky Tract) - الحجر
│16. 🐝 An-Nahl (The Bee) - النحل
│17. 🌙 Al-Isra' (The Night Journey) - الإسراء
│18. 🕳️ Al-Kahf (The Cave) - الکہف
│19. 👩‍🍼 Maryam (Mary) - مریم
│20. 📜 Ta-Ha (Ta-Ha) - طٰہٰ
│21. 📖 Al-Anbiya' (The Prophets) - الانبیاء
│22. 🕋 Al-Hajj (The Pilgrimage) - الحج
│23. 🙌 Al-Mu'minun (The Believers) - المؤمنون
│24. 💡 An-Nur (The Light) - النور
│25. ⚖️ Al-Furqan (The Criterion) - الفرقان
│26. 🎤 Ash-Shu'ara' (The Poets) - الشعراء
│27. 🐜 An-Naml (The Ant) - النمل
│28. 📚 Al-Qasas (The Stories) - القصص
│29. 🕷️ Al-Ankabut (The Spider) - العنکبوت
│30. 🏛️ Ar-Rum (The Romans) - الروم
│31. 📖 Luqman (Luqman) - لقمان
│32. 🙇 As-Sajda (The Prostration) - السجدہ
│33. ⚔️ Al-Ahzab (The Combined Forces) - الاحزاب
│34. 🌸 Saba' (Sheba) - سبا
│35. 🛠️ Fatir (The Originator) - فاطر
│36. 📖 Ya-Sin (Ya-Sin) - یس
│37. 🛡️ As-Saffat (Those who set the Ranks) - الصافات
│38. 🅱️ Sad (The Letter Sad) - ص
│39. 🪖 Az-Zumar (The Troops) - الزمر
│40. 🤲 Ghafir (The Forgiver) - غافر
│41. 📜 Fussilat (Explained in Detail) - فصلت
│42. 🗣️ Ash-Shura (Consultation) - الشوری
│43. 💰 Az-Zukhruf (The Gold Adornments) - الزخرف
│44. 💨 Ad-Dukhan (The Smoke) - الدخان
│45. 🐊 Al-Jathiyah (The Crouching) - الجاثیہ
│46. 🌪️ Al-Ahqaf (The Wind-Curved Sandhills) - الأحقاف
│47. 🕋 Muhammad (Muhammad) - محمد
│48. 🏆 Al-Fath (The Victory) - الفتح
│49. 🏠 Al-Hujurat (The Rooms) - الحجرات
│50. 🔤 Qaf (The Letter Qaf) - ق
│51. 🌬️ Adh-Dhariyat (The Winnowing Winds) - الذاریات
│52. ⛰️ At-Tur (The Mount) - الطور
│53. 🌟 An-Najm (The Star) - النجم
│54. 🌙 Al-Qamar (The Moon) - القمر
│55. 💖 Ar-Rahman (The Beneficent) - الرحمن
│56. 🌌 Al-Waqi'a (The Inevitable) - الواقعہ
│57. 🔩 Al-Hadid (The Iron) - الحدید
│58. 👩‍⚖️ Al-Mujadila (The Pleading Woman) - المجادلہ
│59. 🏴 Al-Hashr (The Exile) - الحشر
│60. 🔍 Al-Mumtahanah (She that is to be examined) - الممتحنہ
│61. 📊 As-Saff (The Ranks) - الصف
│62. 🕌 Al-Jumu'ah (Friday) - الجمعة
│63. 🤥 Al-Munafiqun (The Hypocrites) - المنافقون
│64. 🌪️ At-Taghabun (Mutual Disillusion) - التغابن
│65. 💔 At-Talaq (The Divorce) - الطلاق
│66. 🚫 At-Tahrim (The Prohibition) - التحریم
│67. 👑 Al-Mulk (The Sovereignty) - الملک
│68. 🖋️ Al-Qalam (The Pen) - القلم
│69. 🔍 Al-Haqqah (The Reality) - الحاقہ
│70. ⬆️ Al-Ma'arij (The Ascending Stairways) - المعارج
│71. 🌊 Nuh (Noah) - نوح
│72. 👻 Al-Jinn (The Jinn) - الجن
│73. 🕵️‍♂️ Al-Muzzammil (The Enshrouded One) - المزمل
│74. 🧕 Al-Muddathir (The Cloaked One) - المدثر
│75. 🌅 Al-Qiyamah (The Resurrection) - القیامۃ
│76. 🧑‍🤝‍🧑 Al-Insan (Man) - الانسان
│77. ✉️ Al-Mursalat (The Emissaries) - المرسلات
│78. 📣 An-Naba' (The Tidings) - النبأ
│79. 🪤 An-Nazi'at (Those who drag forth) - النازعات
│80. 😠 Abasa (He frowned) - عبس
│81. 💥 At-Takwir (The Overthrowing) - التکویر
│82. 💔 Al-Infitar (The Cleaving) - الانفطار
│83. ⚖️ Al-Mutaffifin (Defrauding) - المطففین
│84. 🌀 Al-Inshiqaq (The Splitting Open) - الانشقاق
│85. 🌌 Al-Buruj (The Mansions of the Stars) - البروج
│86. 🌠 At-Tariq (The Morning Star) - الطارق
│87. 🌍 Al-Ala (The Most High) - الأعلی
│88. 🌊 Al-Ghashiyah (The Overwhelming) - الغاشیۃ
│89. 🌅 Al-Fajr (The Dawn) - الفجر
│90. 🏙️ Al-Balad (The City) - البلد
│91. ☀️ Ash-Shams (The Sun) - الشمس
│92. 🌜 Al-Lail (The Night) - اللیل
│93. 🌅 Ad-Duha (The Morning Hours) - الضحی
│94. 📖 Ash-Sharh (The Relief) - الشرح
│95. 🍈 At-Tin (The Fig) - التین
│96. 💧 Al-Alaq (The Clot) - العلق
│97. ⚡ Al-Qadr (The Power) - القدر
│98. 📜 Al-Bayyinah (The Clear Proof) - البینۃ
│99. 🌍 Az-Zalzalah (The Earthquake) - الزلزالۃ
│100. 🐎 Al-Adiyat (The Chargers) - العادیات
│101. ⚡ Al-Qari'ah (The Calamity) - القارعۃ
│102. 💰 At-Takathur (The Abundance of Wealth) - التکاثر
│103. ⏳ Al-Asr (The Time) - العصر
│104. 😠 Al-Humazah (The Scandal-Monger) - الہمزۃ
│105. 🐘 Al-Fil (The Elephant) - الفیل
│106. 🕌 Quraysh (Quraysh) - قریش
│107. 🤲 Al-Ma'un (Acts of Kindness) - الماعون
│108. 🍇 Al-Kawthar (The Abundance) - الکوثر
│109. ❌ Al-Kafirun (The Disbelievers) - الکافرون
│110. 🛡️ An-Nasr (The Help) - النصر
│111. 🔥 Al-Lahab (The Flame) - المسد
│112. ❤️ Al-Ikhlas (The Sincerity) - الإخلاص
│113. 🌅 Al-Falaq (The Daybreak) - الفلق
│114. 🌐 An-Nas (Mankind) - الناس
│
│ *Usage:* 
│ ${usedPrefix}surah [number]
│ ${usedPrefix}ayah [surah]:[ayah]
│
╰──────❍ *May Allah bless your recitation* ❍──────╯`.trim();

  conn.sendFile(m.chat, pp, 'quranmenu.jpg', lkr + readMore, m, false, { mentions: [who] });
  m.react('📖');
};

handler.help = ['quranfull', 'surahlist'];
handler.tags = ['islamic'];
handler.command = ['quranfull', 'surahlist', 'allquran'];

export default handler;