import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sql = require("/Users/pongsathornsornkhom/sql-runner/node_modules/mssql");
const bcrypt = require("bcryptjs");

const config = {
  server: "localhost",
  user: "sa",
  password: "Boss18_#",
  database: "Amber_DB",
  options: { encrypt: false, trustServerCertificate: true },
};

async function main() {
  const pool = await sql.connect(config);
  console.log("Connected to Amber_DB");

  // 1. Seed Amenities
  const amenities = [
    ["สัตว์เลี้ยง", "Pet-Friendly", "paw-print"],
    ["ร้านสะดวกซื้อ", "Convenience Store", "store"],
    ["Co-working Space", "Co-working Space", "laptop"],
    ["ที่ชาร์จ EV", "EV Charger", "zap"],
    ["สวน", "Garden", "trees"],
    ["สระว่ายน้ำ", "Swimming Pool", "waves"],
    ["ที่จอดรถ", "Parking", "car"],
    ["ซาวน่า", "Sauna", "flame"],
    ["สนามเด็กเล่น", "Playground", "baby"],
    ["ห้องสมุด", "Library", "book-open"],
    ["รักษาความปลอดภัย 24 ชม.", "24/7 Security", "shield"],
    ["ห้องคาราโอเกะ", "Karaoke Room", "mic"],
    ["ห้องประชุม", "Meeting Room", "presentation"],
    ["ฟิตเนส/ยิม", "Fitness/Gym", "dumbbell"],
    ["คลับเฮาส์", "Clubhouse", "home"],
    ["โต๊ะสนุกเกอร์", "Snooker Table", "circle"],
    ["สนามบาสเก็ตบอล", "Basketball Court", "circle-dot"],
    ["สนามแบดมินตัน", "Badminton Court", "activity"],
  ];

  const existingAmenities = await pool.request().query("SELECT COUNT(*) as cnt FROM Amenity");
  if (existingAmenities.recordset[0].cnt === 0) {
    for (const [nameTh, nameEn, icon] of amenities) {
      await pool
        .request()
        .input("nameTh", sql.NVarChar, nameTh)
        .input("nameEn", sql.NVarChar, nameEn)
        .input("icon", sql.NVarChar, icon)
        .query("INSERT INTO Amenity (nameTh, nameEn, icon) VALUES (@nameTh, @nameEn, @icon)");
    }
    console.log(`Seeded ${amenities.length} amenities`);
  } else {
    console.log("Amenities already exist, skipping");
  }

  // 2. Seed Admin User
  const existingAdmin = await pool
    .request()
    .input("email", sql.NVarChar, "admin@npb-property.com")
    .query("SELECT COUNT(*) as cnt FROM [User] WHERE email = @email");

  if (existingAdmin.recordset[0].cnt === 0) {
    const hash = await bcrypt.hash("Admin123!", 12);
    await pool
      .request()
      .input("email", sql.NVarChar, "admin@npb-property.com")
      .input("passwordHash", sql.NVarChar, hash)
      .input("firstName", sql.NVarChar, "Admin")
      .input("lastName", sql.NVarChar, "NPB")
      .input("phone", sql.NVarChar, "0812345678")
      .input("role", sql.NVarChar, "ADMIN")
      .input("language", sql.NVarChar, "th")
      .input("isActive", sql.Bit, 1)
      .query(
        `INSERT INTO [User] (email, passwordHash, firstName, lastName, phone, role, language, isActive, createdAt, updatedAt)
         VALUES (@email, @passwordHash, @firstName, @lastName, @phone, @role, @language, @isActive, GETDATE(), GETDATE())`
      );
    console.log("Seeded admin: admin@npb-property.com / Admin123!");
  } else {
    console.log("Admin user already exists, skipping");
  }

  // 3. Seed Article Categories
  const categories = [
    ["อสังหาริมทรัพย์", "Real Estate", "real-estate"],
    ["ข่าวสาร", "News", "news"],
    ["เทคนิค", "Tips & Tricks", "tips"],
  ];

  const existingCats = await pool.request().query("SELECT COUNT(*) as cnt FROM ArticleCategory");
  if (existingCats.recordset[0].cnt === 0) {
    for (const [nameTh, nameEn, slug] of categories) {
      await pool
        .request()
        .input("nameTh", sql.NVarChar, nameTh)
        .input("nameEn", sql.NVarChar, nameEn)
        .input("slug", sql.NVarChar, slug)
        .query("INSERT INTO ArticleCategory (nameTh, nameEn, slug) VALUES (@nameTh, @nameEn, @slug)");
    }
    console.log(`Seeded ${categories.length} article categories`);
  } else {
    console.log("Article categories already exist, skipping");
  }

  // 4. Seed Social Media Links
  const existingSocial = await pool.request().query("SELECT COUNT(*) as cnt FROM SocialMediaLink");
  if (existingSocial.recordset[0].cnt === 0) {
    const socials = [
      ["Facebook", "https://facebook.com/npbproperty"],
      ["LINE", "https://line.me/R/ti/p/@cfx5958x"],
      ["Instagram", "https://instagram.com/npbproperty"],
    ];
    for (const [platform, url] of socials) {
      await pool
        .request()
        .input("platform", sql.NVarChar, platform)
        .input("url", sql.NVarChar, url)
        .input("isActive", sql.Bit, 1)
        .query("INSERT INTO SocialMediaLink (platform, url, isActive) VALUES (@platform, @url, @isActive)");
    }
    console.log("Seeded social media links");
  } else {
    console.log("Social links already exist, skipping");
  }

  console.log("Seed completed!");
  await sql.close();
}

main().catch((e) => {
  console.error(e);
  sql.close();
  process.exit(1);
});
