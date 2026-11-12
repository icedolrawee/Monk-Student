
'use strict';

const dbConfig = require('../../config/db/dbconfigpool');
const ControllPool = {
    async initPool(req, res) {
        try {
            // Create a connection pool which will later be accessed via the
            // pool cache as the 'default' pool.
            await dbConfig.init();
            //console.log('Connection pool started');

            // Now the pool is running, it can be used
            // await dostuff(req, res);

        } catch (err) {
            console.error('init() error: ' + err.message);
        } /* finally {
        await oracledb.getPool().close(0);
        await closePoolAndExit();
    } */
    },

    async closePoolAndExit(req, res, next) {
        //console.log('\nTerminating');
        try {

            await dbConfig.close(10);
            //console.log('Pool closed');
            return res.status(200).json({ "success": true, "messege": 'Disconnect pool.' }) //&& process.exit(0);
            //process.exit(0);
        } catch (err) {
            // console.error(err.message);
            return res.status(403 || 500).json({ "success": false, "messege": err.message }) //&& process.exit(1);
            // process.exit(1);
        }
    }
}

module.exports = ControllPool;