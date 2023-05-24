import db from "../utils/db";
import encrypt from "../utils/encryption";

async function dbTest() {
    const getDbVal = await db.getDb()
    console.log("getDbVal =>", getDbVal);

    
}

dbTest();