const express = require('express');
const router = express.Router();
const version = require('../../../package.json');

router.get('/', (req, res, next) => {
    res.status(200).send({
        title: '🔒 Rype API Auth Service Online',
        version: version.version
    });
})

module.exports = router;