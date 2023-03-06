require('dotenv').config();
var express = require('express');
var http = require('http');
var path = require('path');
var cors = require('cors');
var formidable = require('formidable');
var fs = require('fs');
var axios = require('axios').default;
var mime = require('mime-types');

var port = process.env.PORT;
var rootDir = path.resolve(__dirname + process.env.FILE_DIR);
var redirectUri = process.env.REDIRECT_URI;
var singleSignOn = process.env.SINGLE_SIGN_ON;
var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'www')));
app.use(express.static(path.join(__dirname, 'files')));
app.use(cors());

function checkAuth(req, res, next) {
    const token = req.headers.authorization;
    if (token && token !== '') {
        axios.post(singleSignOn + '/verify?redirectUri=' + redirectUri)
            .then(response => {
                if (response.status === 401) { res.status(401).json("Unauthorized"); }
                else { next(); }
            })
            .catch(err => res.sendStatus(500));
    } else {
        res.status(401).json("Unauthorized");
    }
}

if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir);
}

/* GET home page. */
app.get('/', function (req, res, next) {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.get('/portal', function (req, res, next) {
    res.sendFile(path.join(__dirname, 'www', 'portal.html'));
});

/** POST upload a file */
app.post('/files', function (req, res, next) {
    // formidable options
    let options = {
        uploadDir: rootDir,
        keepExtensions: true,
        maxFileSize: 1024 * 1024 * 1024,
        allowEmptyFiles: true,
        multiples: false,
    }
    // save file
    let form = new formidable.IncomingForm(options);
    form.on('file', function (field, file) {
        //rename the incoming file to the file's name
        fs.renameSync(file.path, rootDir + "/" + file.name);
    });
    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }
        res.json({ fields, files });
    });
});

/** POST download a file */
app.get('/files/:filename', function (req, res, next) {
    let filePath = `${rootDir}/${req.params.filename}`;
    try {
        res.download(filePath);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

/** POST delete a file */
app.delete('/files/:filename', function (req, res, next) {
    let filePath = `${rootDir}/${req.params.filename}`;
    try {
        fs.unlinkSync(filePath);
        res.status(200).json("deleted");
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

/** GET directory tree */
app.get('/directory', function (req, res, next) {
    let root = new TreeNode(rootDir);
    let stack = [root];
    while (stack.length) {
        let currentNode = stack.pop();

        if (currentNode) {
            let children = fs.readdirSync(currentNode.path);

            for (let child of children) {
                let childPath = `${currentNode.path}/${child}`;
                let file = {};
                file.name = path.basename(childPath);
                file.type = mime.lookup(childPath);
                file.lastModified = fs.statSync(childPath).mtime;
                file.size = fs.statSync(childPath).size;
                let childNode = new TreeNode(childPath, file);
                currentNode.children.push(childNode);

                if (fs.statSync(childNode.path).isDirectory()) {
                    stack.push(childNode);
                }
            }
        }
    }
    res.status(200).json(root);
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