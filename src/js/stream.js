function Streamer ()
{
	if (this.constructor !== Streamer)
		throw ("You must use new to create an Streamer");
	this.websocket = null;
	this.array_buffer = null;
	this.port = 5558; //by default 
	this.headersize = 18;
	this.filesize = 67 * 4 * 4; //418
	this.LE = true;
}

Streamer.prototype.openConnection = function( url , callback)
{
	this.websocket = new WebSocket('wss://echo.websocket.org');
	this.websocket.onopen = function(event) {
		if(callback)
			callback(url)
	};
}

Streamer.prototype.sendData = function( position, array_of_bones_matrices )
{
	this.fillCharacterBuffer(position, array_of_bones_matrices);
	//Here the array_buffer already have the data
//	websocket.send(this.array_buffer);
}

/*
* @position: [x,y,z]
* @array_of_bones_matrices: Array of the bone matrices in order
*/
Streamer.prototype.fillCharacterBuffer = function( position, array_of_bones_matrices )
{
	//1st - Construct the ArrayBuffers with headers and constant values from the protocol 
	this.array_buffer = new ArrayBuffer(this.filesize + this.headersize);
    var view = new DataView(this.array_buffer);
	
	// Fill header

	var offset = 0;

	view.setUint8(offset, 1 ); offset += 1;
	view.setUint8(offset, 16); offset += 1;
	view.setUint32(offset, 123, this.LE); offset += 4;
	view.setFloat32(offset, position[0], this.LE); offset += 4;
	view.setFloat32(offset, position[1], this.LE); offset += 4;
	view.setFloat32(offset, position[2], this.LE); offset += 4;

	// Fill file data

	//2nd - Get rotations for each bone	
	for (var i in array_of_bones_matrices)
	{
		var bone_matrix = array_of_bones_matrices[i]; //matrix
		var rotation = quat.create(); 
		quat.fromMat4(rotation, bone_matrix);
		console.log(rotation);

		//3rd - Fill the ArrayBuffers with the data of the agents
		view.setFloat32(offset, rotation[0], this.LE); offset += 4;
		view.setFloat32(offset, rotation[1], this.LE); offset += 4;
		view.setFloat32(offset, rotation[2], this.LE); offset += 4;
		view.setFloat32(offset, rotation[3], this.LE); offset += 4;
	}
}

