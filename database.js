const sqlite3 = require('sqlite3').verbose();

const onayDb = new sqlite3.Database('./onayBekleyen.db', (err) => {
    if (err) {
        console.error('Veritabanı açılırken hata oluştu:', err.message);
    } else {
        console.log('Veritabanı bağlantısı başarılı.');
    }
});

const paraDb = new sqlite3.Database('./para.db', (err) => {
    if (err) {
        console.error('paraDb Veritabanı açılırken hata oluştu:', err.message);
    } else {
        console.log('paraDb Veritabanı bağlantısı başarılı.');
    }
});

onayDb.serialize(() => {
    onayDb.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        globalName TEXT NOT NULL,
        para TEXT NOT NULL,
        paraSs TEXT NOT NULL,
        userAvatar TEXT NOT NULL,
        time TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Tablo oluşturulurken hata oluştu:', err.message);
        }
    });
});

paraDb.serialize(() => {

    paraDb.run(`CREATE TABLE IF NOT EXISTS Users (
        udc_id TEXT PRIMARY KEY
        )`, (err) => {
            if (err) {
                console.error('Users tablosu oluşturulurken hata oluştu:', err.message);
            }
        }
    );

    paraDb.run(`CREATE TABLE IF NOT EXISTS Admins (
        adc_id TEXT PRIMARY KEY
        )`, (err) => {
            if (err) {
                console.error('Admins tablosu oluşturulurken hata oluştu:', err.message);
            }
        }
    );

    paraDb.run(`CREATE TABLE IF NOT EXISTS Transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        udc_id TEXT NOT NULL,
        adc_id TEXT NOT NULL,
        para INTEGER NOT NULL,
        adminNot TEXT,
        paraSs TEXT NOT NULL,
        talepZaman TEXT NOT NULL,
        talepKabulZaman TEXT NOT NULL,
        FOREIGN KEY (udc_id) REFERENCES Users(udc_id),
        FOREIGN KEY (adc_id) REFERENCES Admins(adc_id)
        )`, (err) => {
            if (err) {
                console.error('Transactions tablosu oluşturulurken hata oluştu:', err.message);
            }
        }
    );
});

module.exports = {
    onayDb,
    paraDb
};