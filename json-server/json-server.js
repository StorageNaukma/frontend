const jsonServer = require('json-server');
const server = jsonServer.create();
const axios = require("axios");
const router = jsonServer.router('json-server/db.json');
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 3000;
const fs = require("fs");

server.use(middlewares);

server.use(jsonServer.rewriter({
    "/groups/*": "/groups/$1?_embed=items",
    "/groups": "/groups?_embed=items"
}));

server.use(jsonServer.bodyParser);

server.use(async (req, res, next) => {
    if (req.method === "PATCH") {
        if (req.body.hasOwnProperty("name")) {
            if (req.url.includes("/items/")) {
                const db = JSON.parse(fs.readFileSync('json-server/db.json', 'utf-8'));
                const result = db.items.find((item) => {
                    return item.name.toLowerCase() === req.body.name.toLowerCase();
                });
                if (result) {
                    res.status(400).json({
                        message: "Товар з таким іменем вже існує."
                    });
                    return;
                }
            } else if (req.url.includes("/groups/")) {
                const db = JSON.parse(fs.readFileSync('json-server/db.json', 'utf-8'));
                const result = db.groups.find((group) => {
                    return group.name.toLowerCase() === req.body.name.toLowerCase();
                });
                if (result) {
                    res.status(400).json({
                        message: "Група з таким іменем вже існує."
                    });
                    return;
                }
            }
        } else if (req.body.hasOwnProperty("label")) {
            if (req.body.label.length > 10) {
                res.status(400).json({
                   message: "Максимальна довжина підпису — 10 символів."
                });
                return;
            }
        } else if (req.body.hasOwnProperty("increase")) {
            const patchingItem = await axios.get(`http://localhost:${port}${req.url}`);
            const result = await axios.patch(`http://localhost:${port}${req.url}`, {
               quantity: parseFloat((parseFloat(patchingItem.data.quantity) + parseFloat(req.body.increase)).toFixed(2))
            });

            res.status(200).json(result.data);
            return;
        } else if (req.body.hasOwnProperty("decrease")) {
            const patchingItem = await axios.get(`http://localhost:${port}${req.url}`);

            if (parseFloat(patchingItem.data.quantity) - parseFloat(req.body.decrease) < 0) {
                res.status(400).json({
                    message: "Кількість товару не може бути від'ємною."
                });
                return;
            }

            const result = await axios.patch(`http://localhost:${port}${req.url}`, {
                quantity: parseFloat((parseFloat(patchingItem.data.quantity) - parseFloat(req.body.decrease)).toFixed(2))
            });

            res.status(200).json(result.data);
            return;
        }
    }

    next();
});

server.post("/groups", (req, res, next) => {
    const db = JSON.parse(fs.readFileSync('json-server/db.json', 'utf-8'));
    require('./db.json');
    const result = db.groups.find((group) => {
        return group.name.toLowerCase() === req.body.name.toLowerCase();
    });
    if (result) {
        res.status(400).json({
            message: "Група з таким іменем вже існує."
        });
    } else {
        next();
    }
});

server.delete(async (req, res, next) => {
   if (req.url.contains("/groups/")) {
       let group = await axios.get(`http://localhost:${port}${req.url}`);
       group = group.data;

       group.items.forEach((item) => {
          axios.delete(`https://localhost:${port}/items/${item.id}`);
       });
   }

   next();
});

server.post("/items", (req, res, next) => {
    const db = JSON.parse(fs.readFileSync('json-server/db.json', 'utf-8'));
    const result = db.items.find((item) => {
        return item.name.toLowerCase() === req.body.name.toLowerCase();
    });
    if (result) {
        res.status(400).json({
            "message": "Товар з таким іменем вже існує."
        });
    } else {
        next();
    }
});

server.get("/search", async (req, res) => {
    const searchQuery = req.query.request;
    let items;
    try {
        const uri = encodeURI(`http://localhost:${port}/items?name_like=${searchQuery}`)
        items = await axios.get(uri);
        items = items.data;
    } catch (error) {
        console.log(error);
    }

    const itemGroupedByGroupId = items.reduce((objectsByKeyValue, obj) => {
        const value = obj.groupId;
        objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
        return objectsByKeyValue;
    }, {});

    const result = {};

    for (const [key, value] of Object.entries(itemGroupedByGroupId)) {
        const group = await axios.get(`http://localhost:${port}/groups/${key}`);
        result[group.data.name] = value;
    }

    res.status(200).json(result);
});

server.use(router);

server.listen(port);
