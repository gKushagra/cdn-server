# Open File Server

File server implemented using [Node.js](https://nodejs.org/en/) for personal use. Currently supports uploading and downloading a file.

### Upload a file using CURL

```
CURL 
-X POST
-H "Content-Type: multipart/form-data"
-F "data=@/path/to/file"
http://localhost:port/file/upload/:id
```

Every user can have a root directory. __id__ is root directory name.

### Download a file using CURL

```
CURL 
-X POST
-H "Content-Type: application/json"
-d '{"filePath":"public/:id/filename.ext"}'
http://localhost:port/file/upload/:id
-o filename.ext
```

### Run Locally

Clone the repository and

```
npm install
npm run dev OR npm start
```

### Build and Deploy

```
npm run build
```

### Dependencies

- [Express.js](https://expressjs.com/)
- [Formidable](https://www.npmjs.com/package/formidable)
