function CharacterStreamer()
{
	if (this.constructor !== CharacterStreamer)
		throw ("You must use new to create an Streamer");

	this.client_id = 1;
	this.characters = {};
	this.num_characters = 0;
	this.is_connected = false;

	this.onConnect = null;
	this.onCharacterData = null; //callback to receive data from the server
	this.onDisconnect = null; //callback when connection lost

	this.websocket = null;
	this.headersize = 18;
	this.LE = true; //little endian
}

CharacterStreamer.BONE25_ANIMATIONS_ID = 16; //25 bones in animation
CharacterStreamer.BONE41_ANIMATIONS_ID = 101; //41 bones in animation
CharacterStreamer.BONE67_ANIMATIONS_ID = 102; //67 bones in animation
CharacterStreamer.BONE55_ANIMATIONS_ID = 16; //55 bones in animation
CharacterStreamer.BONE41_MAT4_ANIMATIONS_ID = 111; //using mat4 per bone
CharacterStreamer.BONE67_MAT4_ANIMATIONS_ID = 112; //using mat4 per bone
CharacterStreamer.BONE41_MAT43_ANIMATIONS_ID = 121; //using mat4x3 per bone
CharacterStreamer.BONE67_MAT43_ANIMATIONS_ID = 122; //using mat4x3 per bone

CharacterStreamer.prototype.connect = function( url, on_connected, on_error )
{
	// var that = this;
	// var protocol = "";
	// if(url.indexOf("://") == -1)
	// 	protocol = location.protocol == "https:" ? "wss://" : "ws://";

	// this.websocket = new WebSocket( protocol + url );
	// this.websocket.binaryType = 'arraybuffer';
	// this.websocket.onopen = function(event) {
	// 	console.log("character streamer connected");
	// 	that.characters = {}; //clear
	// 	that.num_characters = 0;
	// 	that.is_connected = true;
	// 	if(on_connected)
	// 		on_connected(url);
	// 	if(that.onConnect)
	// 		that.onConnect();
	// };

	// this.websocket.onmessage = function(event)
	// {
	// 	if( that.onCharacterData && event.data.constructor !== String )
	// 		that.processMessage(event.data);
	// }

	// this.websocket.onerror = function(event) {
	// 	console.log("error connecting with character streamer server");
	// 	that.is_connected = false;
	// 	if(on_error)
	// 		on_error(event);
	// }

	// this.websocket.onclose = function(event) {
	// 	console.log("disconnected", event);
	// 	that.is_connected = false;
	// 	if(	that.onClose )
	// 		that.onClose();
	// }
}

CharacterStreamer.prototype.clear = function()
{
	this.characters = {}; //clear
	this.num_characters = 0;
}

CharacterStreamer.prototype.close = function()
{
	// if(!this.websocket || this.websocket.readyState != WebSocket.OPEN )
	// {
	// 	console.error("no connected to server");
	// 	return;
	// }
	// this.websocket.close();
}

CharacterStreamer.prototype.processMessage = function(data)
{
	var info = this.unpackCharacter( data );
	if(info && this.onCharacterData)
	{
		if(!this.characters[ info.id ])
			this.num_characters++;
		this.characters[ info.id ] = info;
		this.onCharacterData(info);
	}
}
CharacterStreamer.prototype.sendCharacterPosition = function (character_id, character_pos) 
{
	var data = this.packCharacterPosition(character_id, character_pos);
	if(data)
		this.websocket.send( data );
}

CharacterStreamer.prototype.packCharacterPosition = function (character_id, character_pos) 
{
	var offset = 0;		
	var packet_size = this.headersize; 
	out = out || new ArrayBuffer( packet_size );
    var view = new DataView(out);

	// Fill header + character position
	view.setUint8( offset, this.client_id ); offset += 1; //client ID
	view.setUint8( offset, 0 ); offset += 1;
	view.setUint32( offset, character_id, this.LE); offset += 4;
	view.setFloat32( offset, character_pos[0], this.LE); offset += 4;
	view.setFloat32( offset, character_pos[1], this.LE); offset += 4;
	view.setFloat32( offset, character_pos[2], this.LE); offset += 4;

	return out;
}

CharacterStreamer.prototype.sendCharacterRotation = function (character_id, character_pos) 
{
	var data = this.packCharacterRotation(character_id, character_rot);
	if(data)
		this.websocket.send( data );
}

CharacterStreamer.prototype.packCharacterRotation = function (character_id, character_rot) 
{
	var offset = 0;		
	var packet_size = this.headersize + 4; 
	out = out || new ArrayBuffer( packet_size );
    var view = new DataView(out);

	// Fill header + character rotation
	view.setUint8( offset, this.client_id ); offset += 1; //client ID
	view.setUint8( offset, 0 ); offset += 1;
	view.setUint32( offset, character_id, this.LE); offset += 4;
	view.setFloat32( offset, character_rot[0], this.LE); offset += 4;
	view.setFloat32( offset, character_rot[1], this.LE); offset += 4;
	view.setFloat32( offset, character_rot[2], this.LE); offset += 4;
	view.setFloat32( offset, character_rot[3], this.LE); offset += 4;

	return out;
}

CharacterStreamer.prototype.sendCharacterData = function( character_id, global_model, array_of_bones )
{
	if(!this.websocket || this.websocket.readyState != WebSocket.OPEN )
	{
		console.error("no connected to server");
		return;
	}

	var data = this.packCharacterData( character_id, global_model, array_of_bones );
	if(data)
		this.websocket.send( data );
}

CharacterStreamer.mat43_indices = [0,1,2,4,5,6,8,9,10,12,13,14];

/*
* @position: [x,y,z]
* @array_of_bones: array of local rotation in quaternion format
*/
CharacterStreamer.prototype.packCharacterData = function( character_id, global_model, array_of_bones, out )
{
	var offset = 0;
	debugger;
	var packed_id = 0;
	var num_bones = array_of_bones.length;
	switch( num_bones )
	{
		case 25: packed_id = CharacterStreamer.BONE25_ANIMATIONS_ID; break;
		case 41: packed_id = CharacterStreamer.BONE41_ANIMATIONS_ID; break;
		case 67: packed_id = CharacterStreamer.BONE67_ANIMATIONS_ID; break;
		case 55: packed_id = CharacterStreamer.BONE55_ANIMATIONS_ID; break;
		default:
			console.warn("number of bones not supported by protocol");
			return null;
	}

	var bone_bytes = 4 * 4;
	var pack_matrices = true;

	if( array_of_bones[0].length == 16 ) //mat4
	{
		packed_id += 10;
		bone_bytes = 4*4 * 4;
		if(pack_matrices)
		{
			bone_bytes = 4*3*4;
			packed_id += 10;
		}
	}

	var packet_size = this.headersize + num_bones * bone_bytes; 
	out = out || new ArrayBuffer( packet_size );
    var view = new DataView(out);
    var array = new Uint8Array(out);

	var position = mat4.getTranslation( vec3.create(), global_model );

	// Fill header
	view.setUint8( offset, this.client_id ); offset += 1; //client ID
	view.setUint8( offset, 16 ); offset += 1;
	view.setUint32( offset, character_id, this.LE); offset += 4;
	view.setFloat32( offset, position[0], this.LE); offset += 4;
	view.setFloat32( offset, position[1], this.LE); offset += 4;
	view.setFloat32( offset, position[2], this.LE); offset += 4;

	var mat43_indices = CharacterStreamer.mat43_indices;

	//Get rotations for each bone
	for (var i = 0; i < array_of_bones.length; ++i)
	{
		var rotation = array_of_bones[i];

		if( rotation.length == 4 )
		{
			view.setFloat32(offset, rotation[0], this.LE); offset += 4;
			view.setFloat32(offset, rotation[1], this.LE); offset += 4;
			view.setFloat32(offset, rotation[2], this.LE); offset += 4;
			view.setFloat32(offset, rotation[3], this.LE); offset += 4;
			// if(i < array_of_bones.length)	
			// 	offset += 4;
			
			// console.log(rotation);
		}
		else if( rotation.length == 16 )
		{
			//array.set( rotation.buffer, offset );
			//offset += 4*16;
			if(pack_matrices)
			{
				for(var j = 0; j < 12; ++j)
					view.setFloat32( offset + j*4, rotation[ mat43_indices[j] ], this.LE );
				offset += mat43_indices.length * 4;
			}
			else
			{
				for(var j = 0; j < 16; ++j)
				{
					view.setFloat32(offset, rotation[j], this.LE);
					offset += 4;
				}
			}
		}
	}

	return out;
}

/*
* @data: packet data
*/
CharacterStreamer.prototype.unpackCharacter = function( data )
{
    var view = new DataView(data);

	var packed_id = view.getUint8(1, this.LE);
	var use_mat4 = false;
	var use_mat43 = false;

	var num_bones = 0;
	if( packed_id == CharacterStreamer.BONE25_ANIMATIONS_ID )
		num_bones = 25;
	else if( packed_id == CharacterStreamer.BONE41_ANIMATIONS_ID )
		num_bones = 41;
	else if( packed_id == CharacterStreamer.BONE67_ANIMATIONS_ID )
		num_bones = 67;
	else if( packed_id == CharacterStreamer.BONE41_MAT4_ANIMATIONS_ID )
	{
		num_bones = 41;
		use_mat4 = true;
	}
	else if( packed_id == CharacterStreamer.BONE67_MAT4_ANIMATIONS_ID )
	{
		num_bones = 67;
		use_mat4 = true;
	}
	else if( packed_id == CharacterStreamer.BONE41_MAT43_ANIMATIONS_ID )
	{
		num_bones = 41;
		use_mat43 = true;
	}
	else if( packed_id == CharacterStreamer.BONE67_MAT43_ANIMATIONS_ID )
	{
		num_bones = 67;
		use_mat43 = true;
	}
	else
	{
		//unknown packet, ignore
		console.warn("unknown packet",packed_id);
		return null;
	}

	var character_id = view.getUint32(2, this.LE);
	var position = vec3.create();

	var offset = 6;
	position[0] = view.getFloat32(offset, this.LE); offset += 4;
	position[1] = view.getFloat32(offset, this.LE); offset += 4;
	position[2] = view.getFloat32(offset, this.LE); offset += 4;

	var bone_rotations = [];
	var mat43_indices = CharacterStreamer.mat43_indices;

	for (var i = 0; i < num_bones; ++i )
	{
		if(use_mat4)
		{
			var rotation = mat4.create();
			for(var j = 0; j < 16; ++j)
			{
				rotation[j] = view.getFloat32(offset, this.LE); offset += 4;
			}
			bone_rotations.push( rotation );
		}
		else if(use_mat43)
		{
			var rotation = mat4.create();
			for(var j = 0; j < 12; ++j)
			{
				rotation[ mat43_indices[j] ] = view.getFloat32(offset, this.LE);
				offset += 4;
			}
			bone_rotations.push( rotation );
		}
		else
		{
			var rotation = quat.create();
			rotation[0] = view.getFloat32(offset, this.LE); offset += 4;
			rotation[1] = view.getFloat32(offset, this.LE); offset += 4;
			rotation[2] = view.getFloat32(offset, this.LE); offset += 4;
			rotation[3] = view.getFloat32(offset, this.LE); offset += 4;
			bone_rotations.push( rotation );
		}
	}

	var character_info = {
		id: character_id,
		position: position,
		bone_rotations: bone_rotations,
		bytes: data.byteLength
	};

	return character_info;
}

//copy rotation from 
if(typeof(mat4) != "undefined")
	mat4.copyRotation = function(a,b)
	{
		a[0] = b[0];
		a[1] = b[1];
		a[2] = b[2];
		a[4] = b[4];
		a[5] = b[5];
		a[6] = b[6];
		a[8] = b[8];
		a[9] = b[9];
		a[10] = b[10];
	}