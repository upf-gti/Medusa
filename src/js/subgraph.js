
//Input for a subgraph
function HBTreeInput() {
  
    this.name_in_graph = "";
    this.properties = {
        name: "root",
        type: "path",
        value: 0
    }; 

    var that = this;

    this._node = null;
   
    this.shape = 2;
    this.color = "#1E1E1E"
    this.boxcolor = "#999";
    this.addOutput("","path");

    this.horizontal = true;
    this.serialize_widgets = true;  
    this.widgets_up = true;
	this.behaviour = new Behaviour();
}

HBTreeInput.title = "HBTreeInput";
HBTreeInput.desc = "Input of the graph";

/*HBTreeInput.prototype.onConfigure = function()
{
    this.updateType();
}*/
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
			{
				highlightLink(this,child)
			}
			return value;
		}
		else if(value && value.STATUS == STATUS.running)
		{
			this.running_node_in_banch = true;
			if(agent.is_selected)
			{
				highlightLink(this,child)
			}
			return value;
		}
	}

	if(this.running_node_in_banch)
		agent.bt_info.running_node_index = null;

	this.behaviour.STATUS = STATUS.fail;
	return this.behaviour;
}

HBTreeInput.prototype.getTitle = function() {
    if (this.flags.collapsed) {
        return this.properties.name;
    }
    return this.title;
};

HBTreeInput.prototype.onAction = function(action, param) {
    if (this.properties.type == LiteGraph.EVENT) {
        this.triggerSlot(0, param);
    }
};

HBTreeInput.prototype.onExecute = function() {
    var name = this.properties.name;
    //read from global input
    var data = this.graph.inputs[name];
    if (!data) {
        this.setOutputData(0, this.properties.value );
        return;
    }

    this.setOutputData(0, data.value !== undefined ? data.value : this.properties.value );
};

HBTreeInput.prototype.onRemoved = function() {
    if (this.name_in_graph) {
        this.graph.removeInput(this.name_in_graph);
    }
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

