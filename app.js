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

    if(typeof arr != "object") return;

    if(arr.length){
        arr.forEach( item => {
            console.log(item);
        });
    }
}
// add user to room
const addRoom = id => {
    // check its a new room
    if(!roomData.hasOwnProperty(id)){ 
        roomData[id] = {};
        roomData[id].host = "";
        roomData[id].peers = [];
    }
}
// remove room
const removeRoom = id => {
    // get room index and remove
    if (roomData.hasOwnProperty(id)) delete roomData[id];
}

const removeUser = user => {
    // remove user from peers array
    const index = roomData[user.data.room].peers.indexOf(user.id);
    if (index > -1) roomData[user.data.room].peers.splice(index, 1);
}

const removeAllData = () => {
    logAll(["Tearing down rooms and peers"], "No users")
    roomData = {};
}

// log all rooms
const showAllRooms = () => {
    logAll(Object.keys(roomData), "Rooms")
}
// log all rooms
const showAllPeers = () => {
    const rooms = Object.keys(roomData);
    if(rooms){
        rooms.forEach(room => {
            logAll(roomData[room].peers, "Peers in room "+ room.toString())
        });
    }
}

const checkNotHost = (roomid, id) => {
    // return false if user is host
    if(roomData[roomid].host != id) return true;
    return false;
}

const testPeers = () => {
    // delete rooms if none being used
    if(!Object.keys(roomData)) removeAllData();
}

const addUserToRoom = (id, roomId) =>{ 
    
    addRoom(roomId);
    
    // add user to room
    roomData[roomId].peers.push(id);
}



/*
* Game data
*/ 

const playerCharacterNum = 6; 

// stat management
const roomData = {};

/*
* Socket stuff
*/

io.on('connection', function(socket){
    
    // new connect
    console.log('a user connected');

    socket.on("join",(roomId) =>{
        
        // add user to room
        socket.join(roomId);

        socket.data.room = roomId;
        socket.data.host = false;

        socket.emit("joined", roomId);
        socket.emit("userId", socket.id);
        
        addUserToRoom(socket.id, roomId);

        showAllPeers();
        showAllRooms();
        
        // emit peer number to room
        io.to(roomId).emit("peerEnter", roomData[roomId].peers.length);
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
        
        removeUser(socket);
        
        testPeers();
    });

    socket.on('markAsHost', function(msg){
        socket.data.host = true;
        // remove from peers of room
        roomData[socket.data.room].host = socket.id;
    });

    socket.on('changeState', (msg) => {
        // send send to room but not self
        console.log("stateChange to "+msg);

        switch (msg) {
            case "start":
                let i = 0;
                let roomId = socket.data.room;
                roomData[roomId].peers.forEach(id => {
                    console.log("user: "+id);
                    if(checkNotHost(roomId, id)){
                        io.to(id).emit("setUser", i);

                        let typeNum = 0;
                        if(i > 1) typeNum = 1;
                        if(i > 3) typeNum = 2;

                        io.to(id).emit("setType", typeNum);
                        io.to(id).emit("data", {
                                something: "121",
                                someelse: "21"
                            }
                        );
                        i++;
                    }
                })
                break;
            case "main":
                io.to(socket.data.room).emit("stateChange", "main");
                break;
            default:
                console.log("unknown state request");
                break;
        }
    });
});