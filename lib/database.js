const mysql = require("mysql");
const util = require('util');

class Database {
    constructor(dbName) {
        this.dbName = dbName;
        this.query;
    }
    connect() {
        console.log("Connecting to DB");
        this.connection = mysql.createConnection({
            host: "localhost",
            port: 3306,
            user: "siavash",
            password: "",
            database: this.dbName
        });
        this.query = util.promisify(this.connection.query).bind(this.connection);
    }
    async executeQuery(textQuery) {
        const rows = await this.query(textQuery);
        return rows;
    }
    disconnect() {
        console.log("Disconnecting DB");
        this.connection.end();
    }
}

module.exports = Database;