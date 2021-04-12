
//Input for a subgraph
function HBTreeInput() 
{
    this.name_in_graph = "";
    this.properties    = {
        name: "root",
        type: "path",
        value: 0
    }; 
    var that      = this;
    this._node    = null;
    this.shape    = 2;
    this.color    = "#1E1E1E"
    this.boxcolor = "#999";
    this.addOutput("","path");
    this.horizontal = true;
    this.widgets_up = true;
	this.behaviour  = new Behaviour();
    this.serialize_widgets = true;  
}

HBTreeInput.title = "HBTreeInput";
HBTreeInput.desc = "Input of the graph";

HBTreeInput.prototype.onAdded = function()
{
    if(this.graph)
    {
        this.graph.addInput( this.properties.name, this.properties.type );
        this.graph.description_stack = [];
    }
}

HBTreeInput.prototype.tick = function(agent, dt)
{
	var children = this.getOutputNodes(0);
	for(var n in children)
	{
		var child = children[n];
		var value = child.tick(agent, dt);
		if(value && value.STATUS == STATUS.success)
		{
			if(agent.is_selected)
				highlightLink(this,child)
			
			return value;
		}
		else if(value && value.STATUS == STATUS.running)
		{
			this.running_node_in_banch = true;
			if(agent.is_selected)
				highlightLink(this,child)
			
			return value;
		}
	}
	this.behaviour.STATUS = STATUS.fail;
	return this.behaviour;
}

HBTreeInput.prototype.getTitle = function() 
{
    if (this.flags.collapsed) 
        return this.properties.name;
    
    return this.title;
};

HBTreeInput.prototype.onAction = function( action, param ) 
{
    if (this.properties.type == LiteGraph.EVENT) 
        this.triggerSlot(0, param);
    
};

HBTreeInput.prototype.onExecute = function() {
    //read from global input
    var name = this.properties.name;
    var data = this.graph.inputs[name];
    if (!data) 
    {
        this.setOutputData(0, this.properties.value );
        return;
    }

    this.setOutputData(0, data.value !== undefined ? data.value : this.properties.value );
};

HBTreeInput.prototype.onRemoved = function() 
{
    if (this.name_in_graph) 
        this.graph.removeInput(this.name_in_graph);
    
};
HBTreeInput.prototype.onStart = HBTreeInput.prototype.onDeselected = function()
{
	var children = this.getOutputNodes(0);
	if(!children) return;
	children.sort(function(a,b)
	{
		if(a.pos[0] > b.pos[0])
			return 1;
		if(a.pos[0] < b.pos[0])
			return -1;
	});

	this.outputs[0].links = [];
	for(var i in children)
		this.outputs[0].links.push(children[i].inputs[0].link);

	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}
LiteGraph.HBTreeInput = HBTreeInput;
LiteGraph.registerNodeType("graph/HBTreeinput", HBTreeInput);

//Output for a subgraph
function HBTreeOutput() 
{
    this.name_in_graph = "";
    this.properties    = {
        name: "root",
        type: "path",
        value: 0
    }; 
    var that      = this;
    this._node    = null;
    this.shape    = 2;
    this.color    = "#1E1E1E"
    this.boxcolor = "#999";
    this.addInput("","path");
    this.horizontal = true;
    this.widgets_up = true;
	this.behaviour  = new Behaviour();
    this.serialize_widgets = true;  
}

HBTreeOutput.title = "HBTreeOutput";
HBTreeOutput.desc  = "Output of the graph";

HBTreeOutput.prototype.onAdded = function()
{
    if(this.graph)
    {
        if( this.graph._subgraph_node.outputs == undefined || this.graph._subgraph_node.outputs.length == 0 )
        {
            this.graph.addOutput( this.properties.name, this.properties.type );
            this.graph.description_stack = [];
        }   
    }
}

HBTreeOutput.prototype.tick = function( agent, dt )
{
    if(this.graph && this.graph._subgraph_node)
    {
        var children = this.graph._subgraph_node.getOutputNodes(0)
        // In case the subgraph is not connected in the output
        if(!children || children.length == 0)
        {
            this.behaviour.STATUS = STATUS.fail;
            return this.behaviour;
        }

        for(var n in children)
        {
            var child = children[n];
            var value = child.tick(agent, dt);
            if(value && value.STATUS == STATUS.success)
            {
                if(agent.is_selected)
                    highlightLink(this,child)

                return value;
            }
            else if(value && value.STATUS == STATUS.running)
            {
                this.running_node_in_banch = true;
                if(agent.is_selected)
                    highlightLink(this,child)
                
                return value;
            }
        }
    }
    else
    {
        this.behaviour.STATUS = STATUS.fail;
        return this.behaviour;
    }
	this.behaviour.STATUS = STATUS.fail;
	return this.behaviour;
}

HBTreeOutput.prototype.getTitle = function() {
    if (this.flags.collapsed) 
        return this.properties.name;
    
    return this.title;
};

HBTreeOutput.prototype.onAction = function( action, param ) 
{
    if (this.properties.type == LiteGraph.EVENT) 
        this.triggerSlot(0, param);
    
};

HBTreeOutput.prototype.onExecute = function() 
{
    //read from global input
    var name = this.properties.name;
    var data = this.graph.inputs[name];
    if (!data) 
    {
        this.setOutputData(0, this.properties.value );
        return;
    }
    this.setOutputData(0, data.value !== undefined ? data.value : this.properties.value );
};

HBTreeOutput.prototype.onRemoved = function() {
    if (this.name_in_graph) {
        this.graph.removeInput(this.name_in_graph);
    }
};
HBTreeOutput.prototype.onStart = HBTreeOutput.prototype.onDeselected = function()
{
    if(this.graph && this.graph._subgraph_node)
    {
        var children = this.graph._subgraph_node.getOutputNodes(0)

        if(!children) return;
        children.sort(function(a,b)
        {
            if(a.pos[0] > b.pos[0])
                return 1;
            if(a.pos[0] < b.pos[0])
                return -1;
        });
    
        this.graph._subgraph_node.outputs[0].links = [];
        for(var i in children)
            this.graph._subgraph_node.outputs[0].links.push(children[i].inputs[0].link);
    
        var parent = this.getInputNode(0);
        if(parent)
            parent.onDeselected();
    }
}
LiteGraph.HBTreeOutput = HBTreeOutput;
LiteGraph.registerNodeType("graph/HBTreeOutput", HBTreeOutput);

//-----------------------LITEGRAPH SUBGRAPH INPUT FOR HBT------------------------------------//
LiteGraph.Subgraph.prototype.onSubgraphNewInput = function(name, type) {
    var slot = this.findInputSlot(name);
    if (slot == -1) {
        /* ADDED FOR BEHAVIOUR TREES */
        //add input to the node
        var w = this.size[0];
        if(type=="path")
        	this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
        /*---------------------------*/
        //add input to the node
        else
            this.addInput(name, type);
    }
};

LiteGraph.Subgraph.prototype.onSubgraphNewOutput = function(name, type) {
    var slot = this.findOutputSlot(name);
    if (slot == -1) {
        /* ADDED FOR BEHAVIOUR TREES */
        //add input to the node
        var w = this.size[0];
        var h = this.size[1];
        if(type=="path")
        	this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
        /*---------------------------*/
        //add input to the node
        else
            this.addOutput(name, type); 
    }
};

LiteGraph.Subgraph.prototype.onDeselected = function()
{
    var output_node = this.subgraph.findNodeByTitle("HBTreeOutput");
    output_node.onDeselected();
}