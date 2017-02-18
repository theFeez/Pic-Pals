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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


app.get('/',function(req,res){
    fs.readdir(__dirname+'/pics',function(err,files){
        for(var i=0;i<files.length;i++){
            console.log(files[i]);
        }
    })
    console.log(configInstance.mongoUrl);
    res.sendFile(__dirname+'/index.html');
    
});

app.get('/sendPic',function(req,res){
    console.log('reqested load pic');
    MongoClient.connect(url,function(err,db){
       if(err){
           console.log(err);
           res.send(false);
       } 
        else{
            db.collection('users').findOne({'username':req.body.username},function(err,docs){
                
                res.sendFile(__dirname+'/pics/'+docs.images[getRandomInt(0,docs.images.length-1)]);
            })
            /*fs.readdir(__dirname+'/pics',function(err,files){
                if(err){
                    console.log(err);
                }
                else{
                    res.sendFile(__dirname+'/pics/'+files[getRandomInt(0,files.length-1)]); 
                }
            })*/
        }
    });
    
   
});

app.get('/sendName',function(req,res){
    MongoClient.connect(url,function(err,db){
        db.collection('user').find({}),function(err,docs){
            if(err){
                console.log(err);
                res.end();
            }
            else{
                console.log(docs[getRandomInt(0,docs.length-1)].username);
                res.send(docs[getRandomInt(0,docs.length-1)].username);
            }
             
        }
       
    })
    
})

app.post('/upload',upload.single('image'),function(req,res){
    console.log('upload request recieved');
    if(req.file===undefined){
        console.log(req.body);
        res.end();
    }
    else{
        //deal with the picture
        console.log('acceptable image recieved');
        
       /* MongoClient.connect(url,function(err,db){
            if(err){
                console.log(err);
            }
            else{
                db.collection('users').update({username:req.body.username},{$push:{images:req.file.path}});
            }
        })
        */
        
        
        
        fs.readdir(__dirname+'/pics',function(err,files){
            for(var i=0;i<files.length;i++){
                console.log(files[i]);
            }
        });
        res.redirect('/sendName');
        
    }
    
})

app.post('/register',function(req,res){
    MongoClient.connect(url,function(err,db){
        if(err){
            console.log('error: '+err);
            res.send(false)
        }
        else{
            db.collection('users').find({'username':req.body.username},function(error, docs){
                if(error){
                    console.log(err);
                    res.send(false);
                }
                if(docs!=null){
                    console.log(req.body.username);
                    res.send(false);
                }
                else{
                    db.collection('users').insert({'username':req.body.username,'password':req.body.password});
                    res.send(true);
                }
            });
            
        }
        db.close();
        
       
    })
});

app.post('/login',function(req,res){
    console.log(req.body);
    MongoClient.connect(url,function(err,db){
        if(err){
            console.log('error: '+err);
            res.send(false);
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

app.post('/review',function(req,res){
    var newScore = req.body.score;
    MongoClient.connect(url,function(err,db){
        if(err){
            console.log(err);
        }
    })
})


app.listen(process.env.PORT||500,function(){
    console.log('listening on '+this.address()+' '+this.address().port);
    
})