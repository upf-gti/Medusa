var B_TYPE =
{
	moveToLocation:0,
	lookAt:1,
	animateSimple:2,
	wait:3,
	nextTarget:4,
	setMotion:5,
	setProperty:6,
	succeeder:7,
	action:8,
	conditional:9,
	gestureNode:10,
	facialExpression:11,
    ParseCompare:15,
    intent: 16,
    treeReferencer: 17
}

function BTreeReferencer() 
{
    this.name_in_graph = "";
    this.properties = {
        name: "BTreeReferencer",
        type: "path",
        value: 0, 
        bt_uid:""
    };
    var that    = this;
    this._node  = null;
    this.shape  = 2;
    this.color  = "#1E1E1E"
    this.boxcolor = "#999";
    this.addInput("","path");
    this.serialize_widgets = true;
    this.horizontal = true;
    this.widgets_up = true;
    this.behaviour  = new Behaviour();
    this.behaviour.type = B_TYPE.treeReferencer;
    this.widget = this.addWidget("string","", this.properties.bt_uid, function(v){ that.properties.bt_uid = v.toLowerCase(); }, this.properties );
}

BTreeReferencer.title = "BTreeReferencer";
BTreeReferencer.desc = "Input of the graph";
//reorder the links
BTreeReferencer.prototype.onStart = BTreeReferencer.prototype.onDeselected = function()
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
}

BTreeReferencer.prototype.onAdded = function()
{
    // if(this.graph)
    // {
    //     this.graph.addInput( this.properties.name, this.properties.type );
    //     this.graph.description_stack = [];
    // }
}

BTreeReferencer.prototype.tick = function(agent, dt)
{
    this.behaviour.setData({bt_uid:this.properties.bt_uid})
    var tree_root = this.findReferencedTree(this.properties.bt_uid);
    // Find the tree in the same graph, tick it
    if(tree_root)
    {
        var value = tree_root.tick(agent, dt) 
        if(value && (value.STATUS == STATUS.success || value.STATUS == STATUS.running))
		{
			if(agent.is_selected)
				highlightLink(this, tree_root)
			//push the node_id to the evaluation trace
			agent.evaluation_trace.push(this.id);

			//know if bt_info params must be reset
			//if the node was not in the previous 
			// if(!nodePreviouslyEvaluated(agent, this.id))
			// 	resetHBTreeProperties(agent)

			return value;
		}       
    }
    // Tree not in the same graph, return the tree identifier to search in other graphs
    else
    {
        this.behaviour.STATUS = STATUS.success;
        return this.behaviour;
    }

	this.behaviour.STATUS = STATUS.fail;
	return this.behaviour;
}

BTreeReferencer.prototype.findReferencedTree = function(uid)
{
    if(this.graph)
    {
        var nodes = this.graph._nodes;
        for(var i in nodes)
            if(nodes[i].type == "btree/BTTriggerer")
                return nodes[i]
        
        return false;
    }
    return false;
}

BTreeReferencer.prototype.getTitle = function() {
    if (this.flags.collapsed) {
        return this.properties.name;
    }
    return this.title;
}

LiteGraph.registerNodeType("btree/BTreeReferencer", BTreeReferencer);

function BTTriggerer() 
{
    this.name_in_graph = "";
    this.properties = {
        name: "BTTriggerer",
        type: "path",
        value: 0, 
        bt_uid:""
    };
    var that    = this;
    this._node  = null;
    this.shape  = 2;
    this.color  = "#1E1E1E"
    this.boxcolor = "#999";
    this.addOutput("","path");
    this.serialize_widgets = true;
    this.horizontal = true;
    this.widgets_up = true;
    this.behaviour  = new Behaviour();
    this.behaviour.type = B_TYPE.treeReferencer;
    this.widget = this.addWidget("string","", this.properties.bt_uid, function(v){ that.properties.bt_uid = v.toLowerCase(); }, this.properties );
}

BTTriggerer.title = "BTTriggerer";
BTTriggerer.desc = "Input of the graph";
//reorder the links
BTTriggerer.prototype.onStart = BTTriggerer.prototype.onDeselected = function()
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
}
BTTriggerer.prototype.onAdded = function()
{
    // if(this.graph)
    // {
    //     this.graph.addInput( this.properties.name, this.properties.type );
    //     this.graph.description_stack = [];
    // }
}

BTTriggerer.prototype.tick = function(agent, dt)
{
    var children = this.getOutputNodes(0);
	for(var n in children)
	{
		var child = children[n];
		var value = child.tick(agent, dt);
		if(value && (value.STATUS == STATUS.success || value.STATUS == STATUS.running))
		{
			if(agent.is_selected)
				highlightLink(this, child)
			//push the node_id to the evaluation trace
			agent.evaluation_trace.push(this.id);
			return value;
		}
	}
	this.behaviour.STATUS = STATUS.fail;
	return this.behaviour;
}

BTTriggerer.prototype.getTitle = function() {
    if (this.flags.collapsed) {
        return this.properties.name;
    }
    return this.title;
}
LiteGraph.registerNodeType("btree/BTTriggerer", BTTriggerer);

