console.log("Starting up");

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const cors = require("cors");
const io = require('socket.io')(server, {
    origins: "*", 
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const { log } = require('console');

console.log("Finshed imports");

// /*
// * Server setup
// */

// Set up our server so it will listen on the port
const port =  process.env.PORT || 8080;
// const port =  8080;
server.listen(port, function (error) {
    // Checking any error occur while listening on port
    if (error) {
        console.log('Something went wrong', error);
    }else {
        console.log('Server is listening on port ' + port);
    }
});

/*
* Express setup
// */
// app.use(express.static(__dirname + '/node_modules'));
// app.use(express.static('public')); // use public folder for assets in html
// app.use(express.static('public/js')); // use public folder for assets in html

// routes
// app.get('/', function(req, res) {
//     res.sendFile(__dirname + '/index.html');
// });



// /*
// * utilties 
// */ 

// // log something
const logAll = (arr, name = null) => {
    console.log("***");
    if(name) console.log(name);

    if(arr.length){
        arr.forEach( item => {
            console.log(item);
        });
    }
}
// add user to room
const addRoom = id => {
    // check its a new room
    if(appData.rooms.indexOf(id) == -1) appData.rooms.push(id);
}
// remove room
const removeRoom = id => {
    // get room index and remove
    const index = appData.rooms.indexOf(id);
    if (index > -1) appData.rooms.splice(index, 1);
}

const addUser = id => {
    appData.peers.push(id);
}
const removeUser = user => {
    // remove user from peers array
    const index = appData.peers.indexOf(user.id);
    if (index > -1) appData.peers.splice(index, 1);

    // decrement user from peers in room
    if(appData.roomData.hasOwnProperty(user.data.room)) appData.roomData[user.data.room].peers--;
}
const removeAllData = () => {
    logAll(["Tearing down rooms and peers"], "No users")
    appData.peers.length = 0;
    appData.rooms.length = 0;
    appData.roomData = {};
}

// log all rooms
const showAllRooms = () => {
    logAll(appData.rooms, "Rooms")
}
// log all rooms
const showAllPeers = () => {
    logAll(appData.peers, "Peers")
}

async function showAllSockets(){
    const sockets = await io.fetchSockets();
    console.log("***");
    console.log("num of users: ",sockets.length);

    for (const socket of sockets) {
        console.log("id:",socket.id);
        console.log("rooms:",socket.rooms);
        console.log("data:",socket.data);
    }
    console.log("---");
}

const testPeers = () => {
    // delete rooms if none being used
    if(appData.peers.length == 0) removeAllData();
}

const addUserToRoom = (id, roomId) =>{
    
    addUser(id);
    addRoom(roomId);

    if(!appData.roomData.hasOwnProperty(roomId)){
        appData.roomData[roomId] = {}
        appData.roomData[roomId].peers = 1;
    }else{
        appData.roomData[roomId].peers++;
    }
}

async function getPeersInRoom(roomId) {
    return await io.in(roomId).fetchSockets();
}

/*
* Game data
*/ 

const playerCharacters = [
    {
        name:"Bertha",
    },
    {
        name:"Joey Joe Joe",
    },
    {
        name:"Kenneth",
    },
    {
        name:"Cubert",
    },
    {
        name:"Harold",
    }
];

// stat management
const appData = {};

appData.rooms = [];
appData.roomData = {};
appData.peers = [];

/*
* Socket stuff
*/

io.on('connection', function(socket){
    
    // new connect
    console.log('a user connected');

    socket.on("join",(roomId) =>{
        
        socket.join(roomId);
        socket.data.room = roomId;
        socket.data.host = false;

        socket.emit("joined", roomId);
        socket.emit("userId", socket.id);
        
        addUserToRoom(socket.id, roomId);

        showAllPeers();
        showAllRooms();
        
        // emit peer number to both room
        socket.to(roomId).emit("peerEnter", appData.roomData[roomId].peers);
        
        // emit to self
        // peer number and room data
        socket.emit("peerEnter", appData.roomData[roomId].peers);
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
        
        removeUser(socket);
        
        testPeers();
    });

    socket.on('markAsHost', function(msg){
        socket.data.host = true;
    });

    socket.on('changeState', async (msg) => {
        // send send to room but not self
        console.log("stateChange to "+msg);

        switch (msg) {
            case "start":
                setupPlayers();
                
                setup
                break;
            default:
                console.log("unknown state request");
                break;
        }
    });

    function setupPlayers(){
        getPeersInRoom(socket.data.room).then(
            sockets => {
                let i = 0;
                let len = appData.roomData[socket.data.room].peers - 1;
                sockets.forEach(socket => {
                    if(!socket.data.host)
                    console.log(socket.data.room);
                    io.to(socket.id).emit("setUser", playerCharacters[i]);
                })
            }
        ).catch(err => {
            console.log("SocketPeer error" + err);
        });

        // io.to(socket.data.room).emit("stateChangeTo", msg);
    }
});