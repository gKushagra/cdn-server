require('dotenv').config();
var express = require('express');
var http = require('http');
var path = require('path');
var cors = require('cors');
var formidable = require('formidable');
var fs = require('fs');
var indexRouter = require('./routes/index');

var port = process.env.PORT;
var cStorageDir = path.resolve(__dirname + process.env.C_STORAGE);
var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'files')));
app.use(cors());

/* GET home page. */
app.get('/', function (req, res, next) {
    res.status(200).send('Hello! This is Open File Server!');
});

/** POST upload a file */
app.post('/file/upload/:id/:dir?', function (req, res, next) {
    let rootDir = `${cStorageDir}/${req.params.id}`;
    // check if root exists
    try {
        if (!fs.existsSync(rootDir)) {
            fs.mkdirSync(rootDir)
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
    let dirPath = rootDir;
    let searchDir = req.params.dir;
    // if there is specific upload directory, get path
    if (searchDir !== "null") {
        let root = new TreeNode(rootDir);
        let stack = [root];

        while (stack.length) {
            let currentNode = stack.pop();

            if (currentNode) {
                let children = fs.readdirSync(currentNode.path);

                for (let child of children) {
                    let childPath = `${currentNode.path}/${child}`;
                    if (child === searchDir) dirPath = childPath;
                    let file = {};
                    let childNode = new TreeNode(childPath, file);
                    currentNode.children.push(childNode);

                    if (fs.statSync(childNode.path).isDirectory()) {
                        stack.push(childNode);
                    }
                }
                if (dirPath !== rootDir)
                    break;
            }
        }
    }
    // formidable options
    let options = {
        uploadDir: dirPath,
        keepExtensions: true,
        maxFileSize: 1024 * 1024 * 1024,
        allowEmptyFiles: true,
        multiples: true,
    }
    // save file
    let form = new formidable.IncomingForm(options);
    form.on('file', function (field, file) {
        //rename the incoming file to the file's name
        fs.renameSync(file.path, dirPath + "/" + file.name);
    });
    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        }
        res.json({ fields, files });
    });
});

/** POST download a file */
app.post('/file/download', function (req, res, next) {
    let data = req.body;
    // console.log(data);
    try {
        res.download(data.filePath);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

/** POST delete a file */
app.post('/file/delete', function (req, res, next) {
    let data = req.body;
    // console.log(data);
    try {
        fs.unlinkSync(data.filePath);
        res.status(200).json("deleted");
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

var server = http.createServer(app);

server.listen(port, () => {
    console.log(`CDN server listening on port ${port}`)
});

/** To Store Directory Tree */
class TreeNode {
    path;
    file;
    children;

    constructor(path, file) {
        this.path = path;
        this.file = file;
        this.children = new Array();
    }
}