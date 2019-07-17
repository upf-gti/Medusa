LGraphNode.prototype.connect = function( slot, target_node, target_slot )
{
	target_slot = target_slot || 0;

	//THIS IS FOR BTREE MADE BY DAVID

	if(this.children)
		this.children.push(target_node.id);
	else if(!this.children)
		this.children = [target_node.id];
	target_node.parent = this.id;
	//********************************/

	if(!this.graph) //could be connected before adding it to a graph
	{
		console.log("Connect: Error, node doesnt belong to any graph. Nodes must be added first to a graph before connecting them."); //due to link ids being associated with graphs
		return false;
	}


	//seek for the output slot
	if( slot.constructor === String )
	{
		slot = this.findOutputSlot(slot);
		if(slot == -1)
		{
			if(LiteGraph.debug)
				console.log("Connect: Error, no slot of name " + slot);
			return false;
		}
	}
	else if(!this.outputs || slot >= this.outputs.length)
	{
		if(LiteGraph.debug)
			console.log("Connect: Error, slot number not found");
		return false;
	}

	if(target_node && target_node.constructor === Number)
		target_node = this.graph.getNodeById( target_node );
	if(!target_node)
		throw("target node is null");

	//avoid loopback
	if(target_node == this)
		return false;

	//you can specify the slot by name
	if(target_slot.constructor === String)
	{
		target_slot = target_node.findInputSlot( target_slot );
		if(target_slot == -1)
		{
			if(LiteGraph.debug)
				console.log("Connect: Error, no slot of name " + target_slot);
			return false;
		}
	}
	else if( target_slot === LiteGraph.EVENT )
	{
		//search for first slot with event?
		/*
		//create input for trigger
		var input = target_node.addInput("onTrigger", LiteGraph.EVENT );
		target_slot = target_node.inputs.length - 1; //last one is the one created
		target_node.mode = LiteGraph.ON_TRIGGER;
		*/
		return false;
	}
	else if( !target_node.inputs || target_slot >= target_node.inputs.length )
	{
		if(LiteGraph.debug)
			console.log("Connect: Error, slot number not found");
		return false;
	}

	//if there is something already plugged there, disconnect
	if(target_node.inputs[ target_slot ].link != null )
		target_node.disconnectInput( target_slot );

	//why here??
	//this.setDirtyCanvas(false,true);
	//this.graph.connectionChange( this );

	var output = this.outputs[slot];

	//allows nodes to block connection
	if(target_node.onConnectInput)
		if( target_node.onConnectInput( target_slot, output.type, output ) === false)
			return false;

	var input = target_node.inputs[target_slot];

	if( LiteGraph.isValidConnection( output.type, input.type ) )
	{
		var link_info = {
			id: this.graph.last_link_id++,
			type: input.type,
			origin_id: this.id,
			origin_slot: slot,
			target_id: target_node.id,
			target_slot: target_slot
		};

		//add to graph links list
		this.graph.links[ link_info.id ] = link_info;

		//connect in output
		if( output.links == null )
			output.links = [];
		output.links.push( link_info.id );
		//connect in input
		target_node.inputs[target_slot].link = link_info.id;
		if(this.graph)
			this.graph._version++;
		if(this.onConnectionsChange)
			this.onConnectionsChange( LiteGraph.OUTPUT, slot, true, link_info, output ); //link_info has been created now, so its updated
		if(target_node.onConnectionsChange)
			target_node.onConnectionsChange( LiteGraph.INPUT, target_slot, true, link_info, input );
		if( this.graph && this.graph.onNodeConnectionChange )
			this.graph.onNodeConnectionChange( LiteGraph.OUTPUT, this, slot, target_node, target_slot );
	}

	this.setDirtyCanvas(false,true);
	this.graph.connectionChange( this );

	return true;
}

