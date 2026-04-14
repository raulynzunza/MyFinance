const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.all("PRAGMA table_info(Transactions)", (err, rows) => {
    console.log("Transactions table schema:");
    console.table(rows);
  });

  db.all("SELECT * FROM Categories", (err, rows) => {
    console.log("Categories data:");
    console.table(rows);
  });
});

db.close();
