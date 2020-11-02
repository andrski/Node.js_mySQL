const mysql = require('mysql')  // insert image!!!!!!!!!!!!!!
const express = require('express')
const {static} = require('express')
const multer = require('multer')
const upload = multer({dest: 'uploads/images/'});
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const convertPdf = require('html-pdf')
const bodyParser = require('body-parser')
const urlencodedParser = bodyParser.urlencoded({extended: false})
const app = express()

const PORT = process.env.PORT || 3000;

const conn = mysql.createConnection({
    host: '127.0.0.1',  // choose your host
    user: 'root',  // chose your user
   // database: 'user',
    password: 'password', // password
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({extended: true}));  //middleware for parsing body from client
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', async (req, res)=>{// make render index page
    res.sendFile(__dirname + '/index.html')
})

app.get('/delete', async (req, res)=>{ 
    
    //delete DB
    await conn.query('DROP DATABASE user', (err, result)=>{
        if(err) console.log(err)
         else {
             console.log("БД удалена")
         }
    })

    await res.redirect('/index.html')
})

app.post('/add', cors(), urlencodedParser,upload.single("image"),  (req, res)=>{
    
    // use multer for add file
    let filedata = req.file
        
    if(!filedata){
        res.json({message : "file not upload"})
    }
    else  {
       // res.send("Файл загружен");
        console.log('file has been upload')
    }
    
    let imgFile = fs.readFileSync(filedata.path,  (err, data)=>{
        if(err){
            throw new Error(err)
        }
        else{
            console.log(`file was read`)
        } 
    })   
    
    const queryAdd =   "INSERT INTO user.users (firstName, secondName, image) VALUES (?,?,?)"

    const firstName = req.body.firstName
    const secondName = req.body.secondName
        
          //add table fields
    conn.query(queryAdd, [firstName, secondName, imgFile, ],(err, result)=>{
        if(err){
            console.log(err)
        }
        else{
            console.log("Поля добавлены")
            //console.log(result)
            }
        })
    res.redirect('create.html')
})

// find and return user
app.post('/find', async (req, res)=>{
    const user = req.body.user

    const queryUser = `SELECT * FROM user.users WHERE firstName LIKE '${user}'`
    conn.query(queryUser, (err, result, fields)=>{
        if(err){
            console.log(err)
        }
        else{
            //console.log(fields)
           // console.log(result[0].image)
            //res.json({message: result})
           
            var buffer =  Buffer.from( result[0].image )
            var bufferBase64 = buffer.toString('base64')
            
           //res.set({"headers" :{  'Content-Type': 'application/json;charset=utf-8'  }})
            res.write(`<p>${result[0].firstName}</p><br><p>${result[0].secondName}</p><br><img style='display:block; width:100px;height:100px;' src="data:image/jpeg,image/png;base64,${bufferBase64}" alt="no load" />`)  
        }
    })
    
    // create PDF
    let html = fs.readFileSync('./create.html', 'utf8')
    var options = { format: 'Letter' }
    convertPdf.create(html, options).toFile('./uploads/pdf/page.pdf', function(err, result) {
        if (err) return console.log(err);
        console.log('pdf file created'); 
       // console.log(result) // filename: 'E:\\myDEV\\nodeJS\\test_Yury_Ivashin_BE\\uploads\\pdf\\page.pdf'
      })  
      
      // sava pdf in DB
     
      const savePDFquery = `UPDATE user.users SET pdf = ? WHERE firstName = '${user}'`
      const type = 'pdf'
      //const way = 'E:\\myDEV\\nodeJS\\test_Yury_Ivashin_BE\\uploads\\pdf\\page.pdf'
      const way = path.join(__dirname, '/uploads/pdf/page.pdf')
    
    await conn.query(savePDFquery, [type, way], (err, result)=>{
          if(err){
              console.log(err)
          }
          else{
              console.log(result.affectedRows + " record(s) updated")
              res.write(`<p>pdf file created</p>`)
              res.end()
          }
      })
})

app.post('/create', async (req, res)=>{
   
    await conn.query("CREATE DATABASE user",  (err, result) => {
        if(err) console.log(err);
        else console.log("База данных создана")
      })

      //create table
     const sql = "CREATE TABLE user.users (id INT AUTO_INCREMENT PRIMARY KEY , firstName VARCHAR(30) default '', secondName VARCHAR(30) default '', image MEDIUMBLOB, pdf MEDIUMBLOB)"

     await conn.query(sql,  function(err, result) {
        if(err) console.log(err)
        else {
            console.log("Таблица создана")
        }
    })

    await res.redirect('/index.html')
})

app.get('/close', async (req, res)=>{
    // DB connect close
    await conn.end((err)=>{
            if(err){
                 console.log(err)
                 return true
             }
             else {
                 console.log('DB connection close')
             }
         })
    res.redirect('/index.html')
})

async function start(){
    try{
         // connect
    await conn.connect((err)=>{
        if(err){
            throw new Error(err)
        }
        else {
            console.log('DB connection succes')
        }
    })

    app.listen(PORT, ()=>(console.log(`App has been started on port ${PORT}`)));
    }
    catch(e){
        console.log('server Error', e.message)
        process.exit() // need be code:1
    }
}
start()