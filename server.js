var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


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
var clarifai = require('clarifai');
app.use(cors());
app.use(bodyParser.urlencoded({extended:true,limit:'50mb'}));
app.use(bodyParser.json({limit:'50mb'}));

var clarApp = new clarifai.App(configInstance.clarifaiID,configInstance.clarifaiSecret);

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

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
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



app.post('/sendPic',function(req,res){
    console.log('reqested load pic');
    console.log(req.body.username);
    MongoClient.connect(url,function(err,db){
       if(err){
           console.log(err);
           res.send(false);
       } 
        else{
            db.collection('users').findOne({'username':req.body.username},function(err,docs){
                var doc = docs.images[getRandomInt(0,docs.images.length-1)];
                var picFile = (__dirname+'/pics/'+docs.images[getRandomInt(0,docs.images.length-1)]);
                console.log(docs);
                console.log(doc);
                console.log(picFile);
                res.sendFile(picFile);
            /*fs.readdir(__dirname+'/pics',function(err,files){
                if(err){
                    console.log(err);
                }
                else{
                    res.sendFile(__dirname+'/pics/'+files[getRandomInt(0,files.length-1)]); 
                }
            })*/
            });
        }
            
        db.close();
    });
    
   
});


app.get('/sendName',function(req,res){
    var inRange=false;
    var i;
    var myAverage;
    var range = .5;
    console.log('redirected');
    MongoClient.connect(url,function(err,db){
        console.log('connected to mongo');
        console.log(req.query.username);
        db.collection('users').findOne({username:req.query.username},function(error,doc){
            myAverage = doc.averageScore;
            console.log(doc.username);
            
            db.collection('users').find({username:{$not:{$eq:doc.username}}}).toArray(function(error,docs){
                i=getRandomInt(0,docs.length-1);
                if(error){

                    console.log(error);
                    res.end();
                }
                else{
                    console.log('are we timing out?');
                    while(inRange===false){
                        if(i>docs.length){
                            i=getRandomInt(0,docs.length-1);;
                            range+=.5;
                        }
                        if(Math.abs(myAverage-docs[i].averageScore)<=range){
                            inRange = true;
                            break;
                        }
                        else{
                            i++;
                            continue;
                        }
                    }
                    console.log(docs[0].username);
                    res.send(docs[i].username); 
                }
             
            });
            
        })
        
    
    });
});

app.post('/upload',upload.single('image'),function(req,res){
    
    console.log('upload request recieved');
    console.log(req.body.username);
    if(req.file===undefined){
        console.log('file undefined');
        res.end();
    }
    else{
        clarApp.models.predict(Clarifai.NSFW_MODEL,'http://res.cloudinary.com/hkqs3fahn/image/upload/v1481657619/owtmt9yk2bk8qavmdulv.jpg').then(function(response){
            console.log(response.data.outputs[0].data);
           
            if(response.data.outputs[0].data.concepts[0].name==='nsfw'){
                console.log('nsfw');
                res.redirect('/sendName?username='+req.body.username);    
            }
            else{
                MongoClient.connect(url,function(err,db){
                    if(err){
                        console.log(err);
                    }
                    else{
                        console.log('acceptable image recieved');
                        db.collection('users').update({username:req.body.username},{$push:{images:req.file.filename}});
                    }
                })
                fs.readdir(__dirname+'/pics',function(err,files){
                    for(var i=0;i<files.length;i++){
                        console.log(files[i]);
                    }
                });
                
                res.redirect('/sendName?username='+req.body.username);
                
            }
        },function(error){
            console.log(error);
            res.end();
        });
        //deal with the picture
        res.end();
        
       
    
        
        
        
        
        
    }
    
});

app.post('/register',function(req,res){
    MongoClient.connect(url,function(err,db){
        if(err){
            console.log('error: '+err);
            res.send(false)
        }
        else{
            db.collection('users').find({'username':req.body.username}).toArray(function(error,docs){
                if(error){
                    console.log(err);
                    res.send(false);
                }
                if(docs.length>0){
                    console.log(docs);
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
        db.close();
    });
    
    
});

app.post('/review',function(req,res){
    var newScore = req.body.score;
    var average;
    var sum=0;
    MongoClient.connect(url,function(err,db){
        if(err){
            console.log(err);
        }
        else{
            db.collection('users').update({username:req.body.username},{$push:{scores:newScore}});
            
            db.collection('users').findOne({username:req.body.username},function(error,doc){
                if(error){
                    console.log(error);
                }
                else{
                    for(var i=0; i<doc.scores.length;i++){
                        sum = sum+doc.scores[i];
                    }
                    average = sum/doc.scores.length;
                }
                db.collection('users').update({username:req.body.username},{$set:{averageScore:average}});
            });
            db.close();
            
        }
    })
})

app.post('/upload',upload.single('image'),function(req,res){
    console.log('direct request recieved');
    console.log(req.body.username);
    if(req.file===undefined){
        console.log(req.body);
        res.end();
    }
    else{
        //deal with the picture
        console.log('acceptable image recieved');
        
       MongoClient.connect(url,function(err,db){
            if(err){
                console.log(err);
            }
            else{
                db.collection('users').update({username:req.body.username},{$push:{images:req.file.filename}});
            }
        })
        
        
        
        
        fs.readdir(__dirname+'/pics',function(err,files){
            for(var i=0;i<files.length;i++){
                console.log(files[i]);
            }
        });
        res.send({'filename':req.file.filename,'target':req.body.target});
        
    }
    
});

app.post('/recieveImage',function(req,res){
    console('sending image dm');
    res.sendFile(__dirname+'/pics/'+req.body.file);
})

io.sockets.on('connection',function(socket){
    console.log('socket connected');
    socket.on('init',function(data){
        MongoClient.connect(url,function(err,db){
            db.collection('users').update({$set:{'socketID':socket.id}});
            db.close();
        })
    })
    
    socket.on('message',function(data){
        console.log(data);
    })
    socket.on('sendPic',function(data){
        console.log(data);
        MongoClient.connect(url,function(err,db){
            db.collection('users').findOne({username:data.target},function(error,doc){
                io.sockets.to(doc.socketID).emit('recieveImage',{'file':data.file});
            })
        })
        
    })
})



server.listen(process.env.PORT || 3000);