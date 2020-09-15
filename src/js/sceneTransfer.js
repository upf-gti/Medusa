function SceneTransfer()
{
	if (this.constructor !== SceneTransfer)
		throw ("You must use new to create an SceneTransfer");

	this.client_id = 1;
	// this.characters = {};
	this.num_characters = 0;
	this.is_connected = false;

	this.onConnect = null;
	this.onCharacterData = null; //callback to receive data from the server
	this.onDisconnect = null; //callback when connection lost

	this.websocket = null;
	this.headersize = 18;
    this.LE = true; //little endian
    this.character_streamer = new CharacterStreamer();
}
SceneTransfer.prototype.connect = function ( url, on_connected, on_error ) 
{
	var that = this;
	var protocol = "";
	if(url.indexOf("://") == -1)
		protocol = location.protocol == "https:" ? "wss://" : "ws://";

	this.websocket = new WebSocket( protocol + url );
	this.websocket.binaryType = 'arraybuffer';
	this.websocket.onopen = function(event) {
		console.log("character streamer connected");
		that.characters = {}; //clear
		that.num_characters = 0;
		that.is_connected = true;
		if(on_connected)
			on_connected(url);
		if(that.onConnect)
			that.onConnect();
	};

	this.websocket.onmessage = function(event)
	{
		if( that.onCharacterData && event.data.constructor !== String )
			that.processMessage(event.data);
	}

	this.websocket.onerror = function(event) {
		console.log("error connecting with character streamer server");
		that.is_connected = false;
		if(on_error)
			on_error(event);
	}

	this.websocket.onclose = function(event) {
		console.log("disconnected", event);
		that.is_connected = false;
		if(	that.onClose )
			that.onClose();
	}

	this.character_streamer.websocket = this.websocket;
}

SceneTransfer.prototype.close = function()
{
	if(!this.websocket || this.websocket.readyState != WebSocket.OPEN )
	{
		console.error("no connected to server");
		return;
	}
	this.websocket.close();
}
SceneTransfer.prototype.requestInfo = function ( name ) 
{	
	this.websocket.send(name);
}

SceneTransfer.prototype.processMessage = function( data )
{
	var info = this.unpack( data );
	/*if(info && this.onCharacterData)
	{
		if(!this.characters[ info.id ])
			this.num_characters++;
		this.characters[ info.id ] = info;
		this.onCharacterData(info);
	}*/
}

SceneTransfer.prototype.unpack = function( data, bool ) 
{	
	//ToDo: read packet type, bool is for test
	if(bool)
		this.character_streamer.unpackCharacter(data);
	else
	{
		//code to receive scene
		this.unpackScene( data );
	}
	//if the message is an update position (when a position is clicked in VPET Tablet)
	//var target_position = this.unpackPositionUpdate()
	
}

SceneTransfer.prototype.unpackScene = function ( data ) 
{
	console.log(data);
	var view = new DataView(data);
	var packed_id = view.getUint8(1, this.LE);
	var type = view.getUint8(2, this.LE);
	console.log(packed_id);
	console.log(type);
}

//method called in on_message from the websocket
SceneTransfer.prototype.parseSceneByteArray = function ( byte_array ) 
{
    //read header: from where to where?
    
    //read all SceneNodeGeo: from where to where and how can I distinguish between nodes?

    //read all SceneNodeSkinnedGeo (virtual characters):  from where to where and how can I distinguish between nodes?
}

/*
 */
SceneTransfer.prototype.parseHeader = function ( header_byte_array ) 
{
    
}

SceneTransfer.prototype.parseSceneNode = function ( node_byte_array ) 
{
    
}

SceneTransfer.prototype.parseSceneCharacter = function ( character_byte_array ) 
{
    
}

SceneTransfer.prototype.parseSceneCharacter = function ( character_byte_array ) 
{
    
}
