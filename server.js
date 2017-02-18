var express = require('express');
var app = express();
var multer = require('multer');

var storage = multer.diskStorage({
  filename: function (req, file, cb) {
      if(path.extname(file.originalname.toLowerCase())==='.jpg'||path.extname(file.originalname.toLowerCase())==='.jpeg'||path.extname(file.originalname.toLowerCase())==='.gif'||path.extname(file.originalname.toLowerCase())==='.bmp'||path.extname(file.originalname.toLowerCase())==='.png')
          {
              cb(null, file.originalname)
          }
    
  }
});

var upload = multer({storage})


app.get('/',function(req,res){
   res.send('req recieved'); 
});

app.post('/upload',upload.single('image'),function(req,res){
    console.log('upload request recieved');
    if(req.file===undefined){
        console.log(req.body);
        res.end();
    }
    else{
        //deal with the picture
    }
    
})


app.listen(process.env.PORT||500,function(){
    console.log('listening on '+this.address()+' '+this.address().port);
    
})