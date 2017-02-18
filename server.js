var express = require('express');
var app = express();

app.get('/',function(req,res){
   res.send('req recieved'); 
});


app.listen(process.env.PORT||500,function(){
    console.log('listening on '+this.address()+' '+this.address().port);
    
})