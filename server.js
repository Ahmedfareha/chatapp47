var express = require('express');
var app= express();
var server= require('http').Server(app);
var client = require('socket.io')(server).sockets;
var path = require('path');
var ip= require('ip');
var mongo= require('mongodb').MongoClient;
var port = 8081;

//connect to mongodb
mongo.connect('mongodb://localhost/chatdb',function(err,db){
    if(err)
    {
        throw err;
    }
    else{
        console.log('mongo connected');
        
        //connect to socket.io
        client.on('connection',function(socket){
            console.log('new user connected');
            let chat = db.collection('chats');

            //create functoin to send status
            SendStatus = function(s){
                socket.emit('status',s)
            }

            //get chats from mongo 
            chat.find().limit(100).sort({_id:1}).toArray(function(err,res){
                if(err){
                    throw err;
                }
                //emit the messages
                socket.emit('output',res);
            })

            //handle input events
            socket.on('input',function(data)
            {
                let name= data.name;
                let message = data.message;
                //check for name and message
                if(name ==''|| message=='')
                {
                    //send error status
                    SendStatus("please enter a name and message")
                }else{
                    //insert messages
                    chat.insert({name: name, message: message},function()
                    {
                        client.emit('output',[data]);
                        
                        //send status
                        SendStatus({
                            message: "message sent",
                            clear: true
                        })
                    })
                }
            })

            //handle clear
            socket.on('clear',function(data){
                //remove all chats from collection
                chat.remove({},function()
                {
                    socket.emit('cleared')
                })
            })

            socket.on('disconnect', function(){
            console.log("user disconnected");
            })
        })
    }
})

app.get('/',function(req, res)
{
    res.sendFile(__dirname+'/index.html');
})

server.listen(port,function()
{
    console.log('server is listening at http://'+ip.address()+':'+port);
})



