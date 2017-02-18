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
    res.sendFile(__dirname+'/index.html');
});

app.get('/load',function(req,res){
    request('http://res.cloudinary.com/haklhguz5/image/upload/v1487404456/aj9zetaz3wi4a8mnit8r.jpg', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body) // Print the google web page.
    res.send(body);
  }
})
   
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
        res.end();
        
    }
    
})

app.post('/login',function(req,res){
    console.log('wild');
    console.log(req.body);
    console.log(req.body.username);
    console.log(req.body.password);
    res.redirect('/sendTrue');
    
});

app.get('/sendTrue',function(req,res){
    res.send('you logged in ');
})


app.listen(process.env.PORT||500,function(){
    console.log('listening on '+this.address()+' '+this.address().port);
    
})