var express = require('express');
var app = express();
var multer = require('multer');
var config = require('./config');
var configInstance = config;
var cloudinary = require('cloudinary');
var path= require('path');
var cors = require('cors');
var request = require('request');
var bodyParser = require('body-parser');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var url = configInstance.mongoUrl;
app.use(cors());
app.use(bodyParser.urlencoded({extended:true,limit:'50mb'}));
app.use(bodyParser.json({limit:'50mb'}));

cloudinary.config({ 
  cloud_name: configInstance.cloudName, 
  api_key: configInstance.cloudKey, 
  api_secret: configInstance.cloudSecret 
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, __dirname+'/pics')
  },
  filename: function (req, file, cb) {
      if(path.extname(file.originalname.toLowerCase())==='.jpg'||path.extname(file.originalname.toLowerCase())==='.jpeg'||path.extname(file.originalname.toLowerCase())==='.gif'||path.extname(file.originalname.toLowerCase())==='.bmp'||path.extname(file.originalname.toLowerCase())==='.png')
          {
              cb(null, file.originalname)
          }
    
  }
});

var upload = multer({storage})



app.get('/',function(req,res){
    fs.readdir(__dirname+'/pics',function(err,files){
        for(var i=0;i<files.length;i++){
            console.log(files[i]);
        }
    })
    res.sendFile(__dirname+'/index.html');
    
});

app.get('/load',function(req,res){
    res.sendFile(__dirname+'/pics/ellieKemper.jpg');
   
});

app.post('/upload',upload.single('image'),function(req,res){
    console.log('upload request recieved');
    if(req.file===undefined){
        console.log(req.body);
        res.end();
    }
    else{
        //deal with the picture
        console.log('acceptable image recieved');
        /*cloudinary.uploader.upload(req.file.path,function(result){
            console.log(result);
            res.redirect('/');
        })*/
        fs.readdir(__dirname+'/pics',function(err,files){
            for(var i=0;i<files.length;i++){
                console.log(files[i]);
            }
        });
        res.end();
        
    }
    
})

app.post('/register',function(req,res){
    MongoClient.connect(url,function(err,db){
        if(err){
            console.log('error: '+err);
        }
        else{
            db.collection('users').insert({'username':req.body.username,'password':req.body.password});
        }
        db.close();
        res.end();
       
    })
});

app.post('/login',function(req,res){
    console.log('wild');
    console.log(req.body);
    console.log(req.body.username);
    console.log(req.body.password);
    MongoClient.connect(url,function(err,db){
        if(err){
            console.log('error: '+err);
        }
        else{
            db.collection('users').findOne({username:req.body.username}, function(error,docs){
                if(error){
                    console.log('error: '+err);
                    res.end();
                }
                if(docs !== null){
                    if(docs.password == req.body.password){
                        console.log("Password correct!");
                        res.send(true);
                    } 
                    else {
                        console.log("Login failed! Bad password")
                        res.send(false);
                    }

                }
                else{ 
                    console.log("Login failed! Bad Username");
                    res.send(false);
                }

            });
        }
    })
    
    
});

app.get('/sendTrue',function(req,res){
    res.send(true);
})


app.listen(process.env.PORT||500,function(){
    console.log('listening on '+this.address()+' '+this.address().port);
    
})