console.log("loaded");


// unitites 
const randomString = (length = 12) => {
    return Math.random().toString(16).slice(2, length);
};


const queryString = location.search;
console.log(queryString);

const stringIndex = queryString.search("room=")
let room = queryString.slice(stringIndex + 5, queryString.length)

if(room){
    console.log("Room available");
    // try to login to room
}else{
    console.log("no Room");
    // make new room
    room = randomString();
    console.log("gen room:", room);
}

var socket = io.connect();

socket.on('connect', function(data) {
    console.log("connecting");
    
    socket.emit('join', room);
});

socket.on('joined', function(data) {
    
    console.log("connected to: " + data);
});
socket.on('enter', function(data) {
    
    console.log("message: " + data);
});
socket.on('updates', function(data) {
    
    console.log("Message: " + data);
});

document.getElementById("form").addEventListener("submit", function(e){
    
    e.preventDefault();

    console.log("sending message");

    var message = document.getElementById("m").value;
    socket.emit('messages', message);
});


