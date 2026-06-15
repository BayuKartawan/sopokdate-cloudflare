import fs from "fs";
import https from "https";
import path from "path";

const qrCodes = [
  {
    name: "qr-admin.png",
    data: "bayu2kali@my.my|bayU*Saya",
  },
  {
    name: "qr-guru.png",
    data: "guru@haha.wkwk|haha_haha",
  },
];

const publicDir = path.resolve("public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log("Generating QR Code images...");

qrCodes.forEach((qr) => {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr.data)}`;
  const filePath = path.join(publicDir, qr.name);
  const file = fs.createWriteStream(filePath);

  https
    .get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`Saved QR code to: ${filePath}`);
      });
    })
    .on("error", (err) => {
      fs.unlink(filePath, () => {});
      console.error(`Error saving ${qr.name}:`, err.message);
    });
});
