/*
* David Moreno - UPF
*/

/*Structure used in the HBTNodes*/
STATUS = {

	success:0, 
	running:1, 
	fail:2
}

function onConfig(info, graph)
{
    if(!info.outputs)
        return

    for(let i in info.outputs)
    {
        var output = info.outputs[i];
        for(let j in output.links)
        {   
            var link_id = output.links[j];
            var link = getLinkById(link_id, graph);

            var node = graph.getNodeById(link.origin_id);
            var origin_slot = link.origin_slot;
            var target_node = graph.getNodeById(link.target_id);
            var target_slot = link.target_slot;
            var type = link.type;
        }
    }
}  

function getLinkById(id,graph)
{
    for(var i in graph.links)
    {
        var link = graph.links[i];
        if(link.id == id)
            return link;
    }
}

//to know if a node was executed the previous evaluation
function nodePreviouslyEvaluated(agent, node_id)
{
	for(var i in agent.last_evaluation_trace)
		if(agent.last_evaluation_trace[i] == node_id)
			return true;
	return false;
}

function resetHBTreeProperties(agent)
{
	//running nodes params
	// agent.bt_info.running_node_id = null;
	// agent.bt_info.running_node_index = null;
	//random selector nodes params
	agent.bt_info.random_index_data = null;
	agent.bt_info.rand_selection_index = null;  
	agent.bt_info.random_period = null;
}

//editor stuff: highlighst the connections
function highlightLink(node, child)
{
	if(child.inputs)
	{
		var chlid_input_link_id = child.inputs[0].link;
		node.triggerSlot(0, null, chlid_input_link_id);
	}

	if(child.description)
	{
		var graph = child.graph;
		graph.description_stack.push(child.description); 
	} 
}

function Blackboard()
{
  if(this.constructor !== Blackboard)
	 throw("You must use new to create a Blackboard");
	this._ctor();
}

Blackboard.prototype._ctor = function()
{
    this.stress = 0;
    this.avg_age = 20;
    this.rain = 50;
    this.temperature = 20;
    this.light = 80;
    this.noise = 35;
	this.danger = 0;
    this.bbvariables = ["stress", "rain", "temperature", "light", "noise", "danger"];
    this.area = [-2500,-2500,2500,2500];
}

Blackboard.prototype.setArea = function(p1, p2, p3, p4)
{
    this.area = [p1, p2, p3, p4];
}


/******************************************** HBTContext ************************************************************/
/* HBTContext will contain the graphs available in that context and the evaluate methods for an Agent A witha  Graph G 
** Also contains the facade (overwriten by each engine we use) 
*/
function HBTContext ()
{
	if(this.constructor !== HBTContext)
		throw("You must use new to create an HBTContext");
	this._ctor();
}

HBTContext.prototype._ctor = function()
{
	this.name = "HBTContext";
	this.id = "@HBTContext";
	this.blackboard = new Blackboard();
	this.interest_points = {};
	this.list_of_graphs = {};
	this.facade = new Facade();
	this.agent_evaluated = null;
	this.tmp_result = null;  
}

/*
* Function to evaluate what to do
* Returns an object with the status and info about the task to do
*/
HBTContext.prototype.evaluate = function(character, dt)
{
	this.agent_evaluated = character;
	var graph = this.getGraphByName(this.agent_evaluated.hbtgraph);
	this.tmp_result = graph.runBehaviour(this.agent_evaluated, dt);
	return this.tmp_result;
}

HBTContext.prototype.addInterestPoint = function( info )
{
	var new_ip = new InterestPoint( info );

	if(!this.interest_points[new_ip.type])
		this.interest_points[new_ip.type] = [];

	this.interest_points[new_ip.type].push( new_ip );
}
/*
* Creates a new empty graph and returns it
*/
HBTContext.prototype.addHBTGraph = function( name )
{
	var new_graph = new HBTGraph( name );
	new_graph.graph.context = this;
	this.current_graph = new_graph;
	this.list_of_graphs[new_graph.uid] = new_graph;

	return new_graph;
}

HBTContext.prototype.getGraphByName = function( name )
{
	for (var i in this.list_of_graphs)
	{
		if(this.list_of_graphs[i].name == name)
			return this.list_of_graphs[i];
	}

	return false;
}

HBTContext.prototype.getGraphNames = function(  )
{
	var names = [];
	for (var i in this.list_of_graphs)
	{
		names.push(this.list_of_graphs[i].name);
	}
	return names;
}

/********************************************************************************************************************/


/******************* Interest point class, just a JavaScript object with the info ***********************************/

function InterestPoint( info )
{
	if(this.constructor !== InterestPoint)
		throw("You must use new to create an HBTContext");
	this._ctor( info );
}

InterestPoint.prototype._ctor = function( o )
{	
	if(o)
	{
		this.name = o.name;
		this.pos = o.pos;
		this.id = o.id;
		this.a_properties = o.a_properties;
        this.bb_properties = o.bb_properties;
		this.type = o.type
	}
	
}
function addPropertyToAgents(type, name)
{
	for(var i in CORE.AgentManager.agents)
	{
		var agent = CORE.AgentManager.agents[i];
		if(!agent.properties[name])
		{
			switch(type)
			{
				case "float":agent.properties[name] 	= 0; 				break;
				case "bool":agent.properties[name] 		= false;			break;
				case "vec3":agent.properties[name] 		= vec3.create();	break;
				case "string":agent.properties[name] 	= "property_to_set"; 	break;
			}
		}
	}
}
/*******************************************************************************************************************/

/********************************************** HBTGraph ***********************************************************/

function HBTGraph(name)
{
	if(this.constructor !== HBTGraph)
		throw("You must use new to create an HBTGraph");
	this._ctor(name);
}

HBTGraph.prototype._ctor = function( name )
{
	this.graph = new LGraph();
	this.graph.evaluation_behaviours = [];
	this.graph.current_behaviour = new Behaviour();
	this.root_node = null;
	this.graph.description_stack = [];
	this.tmp_tick_result = null;
	this.uid = LS.generateUId('HBT'); 

	if(name)
		this.name = name;
	else
		this.name = "default";

	var that = this;
	this.graph.onNodeAdded = function(node)
    {
		if(node.type == "btree/Root")
			that.root_node = node;

		if(node.type == "btree/HBTproperty")
			addPropertyToAgents(node.properties.type, node.title);
    }
}

HBTGraph.prototype.runBehaviour = function(character, ctx, dt, starting_node)
{
	this.graph.character_evaluated = character;
	this.graph.evaluation_behaviours = [];
	this.graph.context = ctx;
	ctx.agent_evaluated = character;
	//to know the previous execution trace of the character
	if(!character.evaluation_trace || character.evaluation_trace.length == 0 )
	{
		character.evaluation_trace = [];
		character.last_evaluation_trace = [];
	}
	//put the previous evaluation to the last, and empty for the coming one
	//the ... is to clone the array (just works with 1 dimension, if it was an array of objects, it won't work)
	character.last_evaluation_trace = [...character.evaluation_trace];
	character.evaluation_trace = [];

	/* In case a starting node is passed (we just want to execute a portion of the graph) */
	if(starting_node)
	{
		this.graph.runStep(1, false);
		this.current_behaviour = starting_node.tick(this.graph.character_evaluated, dt);
		return this.current_behaviour;
	}
	/* Execute the tree from the root node */
	else if(this.root_node)
	{
		this.graph.runStep( 1, false );
		// console.log(character.evaluation_trace);
		// console.log(character.last_evaluation_trace);
		this.current_behaviour = this.root_node.tick(this.graph.character_evaluated, dt);
		return this.graph.evaluation_behaviours;
	}
}



/*******************************************************************************************************************/


/****************************************** HBTNodes REPOSITORY ****************************************************/
/*
* This node gets a property (From a Virtual Character or from the scene) and outputs its value and/or the name to  the connected node
* It could be connected to conditionals or Tasks which requires that data
*/
function HBTproperty()
{
    this.shape = 2;
    this.color = "#907300";
  	this.bgcolor = '#796B31';
    this.boxcolor = "#999";
  	var w = 210;
    var h = 55;
    this.addOutput("value","", {pos:[w,55], dir:LiteGraph.RIGHT});
	this.addOutput("name","string", {pos:[w,35], dir:LiteGraph.RIGHT});
    this.flags = {};
  	this.properties = {value:null, node_name: this.title, type:"float"};
    this.data = {};
	this.size = [w, h];
	var that = this;
	this.combo = this.addWidget("combo","Type:", "float", function(v){that.properties.type = v;}, { values:function(widget, node)
	{
        return ["float","bool","vec3", "string"];
    }} ); 
	this.widgets_up = true;
  	this._node = null;
	this._component = null;
	this.serialize_widgets = true;
}

HBTproperty.prototype.onExecute = function()
{	
	//	Check if its Scene or Agent
	var value = this.graph.context.facade.getEntityPropertyValue( this.title, this.graph.character_evaluated); 
	this.setOutputData(0,value);
	this.setOutputData(1,this.title);
}

HBTproperty.prototype.onPropertyChanged = function(name, value)
{
    if(name == "type")
        this.combo.value = value;
	if(name == "value")
		this.properties.value = value;
    
}

LiteGraph.registerNodeType("btree/HBTproperty", HBTproperty);

/*
* This is the initial node ticked of the tree. Acts like a Selector
*/
function RootNode()
{
    this.shape = 2;
    this.color = "#1E1E1E"
    this.boxcolor = "#999";
    this.addOutput("","path");
	this.properties = {};
    this.horizontal = true;
	this.widgets_up = true;

	this.behaviour = new Behaviour();
}

RootNode.prototype.tick = function(agent, dt)
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

			//know if bt_info params must be reset
			//if the node was not in the previous 
			// if(!nodePreviouslyEvaluated(agent, this.id))
			// 	resetHBTreeProperties(agent)

			return value;
		}
	}

	// if(this.running_node_in_banch)
	// 	agent.bt_info.running_node_index = null;

	this.behaviour.STATUS = STATUS.fail;
	return this.behaviour;
}

RootNode.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
	this.graph.root_node =  this;
}

RootNode.title = "Root";
RootNode.desc = "Start node of the Hybrid Behaviour Tree";

//reorder the links
RootNode.prototype.onStart = RootNode.prototype.onDeselected = function()
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

LiteGraph.registerNodeType("btree/Root", RootNode);

/*******************************************************************************************************************/
function Conditional()
{
    this.shape = 2;
	this.color= "#233";
	this.bgcolor = "#355",
    this.boxcolor = "#999";
    this.data = {}
    var w = 200;
	var h = 85;
	//top input
	this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
	//left side input to receive data on the onExecute method
	this.addInput("value","", {pos:[0,60], dir:LiteGraph.LEFT});
	//bottom output
    this.addOutput("","path", {pos:[w*0.5,h+17], dir:LiteGraph.DOWN});
    this.size = [w, h];    
    var that = this;
    this.properties = {
        min: 0,
        max: 100,
        text: "threshold",
				property_to_compare:"", 
				limit_value: 50, 
				value_to_compare:null,
      	comparison_type : ">"
    };
  	this.combo = this.addWidget("combo","Type:", ">", function(v){that.properties.comparison_type = v;}, { values:function(widget, node){
        return [">","<","==", "!=", "<=", ">="];
    }} ); 
    this.slider = this.addWidget("string","Threshold", this.properties.limit_value, function(v){ that.properties.limit_value = v; }, this.properties  );

    this.editable = { property:"value", type:"number" };
	this.widgets_up = true;
	this.serialize_widgets = true;
	this.behaviour = new Behaviour();
	
}
//reorder
Conditional.prototype.onStart = Conditional.prototype.onDeselected = function()
{
	var children = this.getOutputNodes(0);
	if(!children) return;
	children.sort(function(a,b)
	{
		 if(a.pos[0] > b.pos[0])
		{
		  return 1;
		}
		if(a.pos[0] < b.pos[0])
		{
		  return -1;
		}
	});

	this.outputs[0].links = [];
	for(var i in children)
		this.outputs[0].links.push(children[i].inputs[0].link);
	
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}

Conditional.title = "Conditional"
Conditional.desc = "Compares an input or a property value with a threshold";	

Conditional.prototype.tick = function(agent, dt )
{
	//condition not passed
	if(this.evaluateCondition && !this.evaluateCondition())
	{
		//some of its children of the branch is still on execution, we break that execution (se weh we enter again, it starts form the beginning)
		// if(this.running_node_in_banch)
		// 	agent.bt_info.running_node_index = null;

		this.behaviour.STATUS = STATUS.fail;
		return this.behaviour;
	}
	else if(this.evaluateCondition && this.evaluateCondition())
	{               
		//this.description = this.properties.property_to_compare + ' property passes the threshold';
		var children = this.getOutputNodes(0);
		//Just in case the conditional is used inside a sequencer to accomplish several conditions at the same time
		if(children.length == 0){
			this.behaviour.type = B_TYPE.conditional;
			this.behaviour.STATUS = STATUS.success; 
			return this.behaviour;
		}
    
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);
			if(value && value.STATUS == STATUS.success)
			{
				agent.evaluation_trace.push(this.id);
				/* MEDUSA Editor stuff, not part of the core */
				if(agent.is_selected)
					highlightLink(this, child);

				return value;
			}
			else if(value && value.STATUS == STATUS.running)
			{
				agent.evaluation_trace.push(this.id);
				/* MEDUSA Editor stuff, not part of the core */
				if(agent.is_selected)
					highlightLink(this, child)

				return value;
			}
		}

		//if this is reached, means that has failed
		
		if(this.running_node_in_banch)
			agent.bt_info.running_node_index = null;

		this.behaviour.STATUS = STATUS.fail;
		return this.behaviour;
	}
}

Conditional.prototype.evaluateCondition = function()
{
	if(this.properties.value_to_compare == "") return false;
	var result = true;
    var value = this.properties.limit_value;

    try{
        value = JSON.parse( value );
    }catch{
       // value is a string (no true/false/number)
       // i.e. a name "pepe"
    }
	switch (this.properties.comparison_type) {
		case ">":
			result = this.properties.value_to_compare > value;
			break;
		case "<":
			result = this.properties.value_to_compare < value;
			break;
		case "==":
			result = this.properties.value_to_compare == value;
			break;
		case "!=":
			result = this.properties.value_to_compare != value;
			break;
		case "<=":
			result = this.properties.value_to_compare <= value;
			break;
		case ">=":
			result = this.properties.value_to_compare >= value;
			break;
		}
	return result;
}

Conditional.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    //ctx.fillText(`Property: ${this.data.property_to_compare}`,10,65);
}

Conditional.prototype.onPropertyChanged = function(name,value)
{
    if(name == "value"){
        this.slider.value = value;
        // this.data.limit_value = value;
    }
}
Conditional.prototype.onExecute = function()
{
    var data = this.getInputData(1);
    // console.log(data);
    if(data!=undefined && data != null)
		this.properties.value_to_compare = data;
	else
		this.properties.value_to_compare = "";
}


Conditional.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}
Conditional.prototype.onSerialize = function(info)
{

}

LiteGraph.registerNodeType("btree/Conditional", Conditional);


/*******************************************************************************************************************/
function BoolConditional()
{
    this.shape = 2;
	this.color= "#233";
	this.bgcolor = "#355",
    this.boxcolor = "#999";
    this.data = {title:"", property_to_compare:"", value_to_compare:null, bool_state:true}
    var w = 200;
    var h = 65;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("value","boolean", {pos:[0,40], dir:LiteGraph.LEFT});
    this.addOutput("","path", {pos:[w*0.5,h+15], dir:LiteGraph.DOWN});
    this.size = [w, h];    
    var that = this;
    this.properties = {
        value: that.data.limit_value,
        min: 0,
        max: 100,
        title:"", 
        property_to_compare:"", 
        value_to_compare:null, 
        bool_state:true
    };
    // this.size = [80,60];
    this.slider = this.addWidget("toggle","Success if value is:", this.properties.bool_state, function(v){ console.log(v);that.properties.bool_state = v; }, this.properties  );

    this.editable = { property:"value", type:"number" };
    // this.flags = { widgets_up: true };
	this.widgets_up = true;
	this.behaviour = new Behaviour();
	this.serialize_widgets = true;
	

}
//reorder
BoolConditional.prototype.onStart = BoolConditional.prototype.onDeselected =function()
{
	var children = this.getOutputNodes(0);
	if(!children) return;
	children.sort(function(a,b)
	{
		if(a.pos[0] > b.pos[0])
		{
		  return 1;
		}
		if(a.pos[0] < b.pos[0])
		{
		  return -1;
		}
	});

	this.outputs[0].links = [];
	for(var i in children)
		this.outputs[0].links.push(children[i].inputs[0].link);

	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}

BoolConditional.title = "BoolConditional"
BoolConditional.desc = "Success if the boolean parameter is equal to the widget toggle";

BoolConditional.prototype.tick = function(agent, dt )
{
	if(this.evaluateCondition && !this.evaluateCondition())
	{
		if(this.running_node_in_banch)
			agent.bt_info.running_node_index = null;

		this.behaviour.STATUS = STATUS.fail;
		return this.behaviour;
	}

	else if(this.evaluateCondition && this.evaluateCondition())
	{   
		this.description = this.properties.property_to_compare + ' property is true';
		var children = this.getOutputNodes(0);

		if(children.length == 0)
		{
			console.warn("BoolConditional Node has no children");
			return STATUS.success;
		}
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);

			if(value && value.STATUS == STATUS.success)
			{
				agent.evaluation_trace.push(this.id);

				if(agent.is_selected)
					highlightLink(this, child);

				return value;
			}
			else if(value && value.STATUS == STATUS.running)
			{
				agent.evaluation_trace.push(this.id);

				if(agent.is_selected)
					highlightLink(this, child);

				return value;
			}
		}

		//if this is reached, means that has failed
		
		if(this.running_node_in_banch)
			agent.bt_info.running_node_index = null;

		this.behaviour.STATUS = STATUS.fail;
		return this.behaviour;
	}
}

BoolConditional.prototype.evaluateCondition = function()
{
	if(this.properties.value_to_compare == this.properties.bool_state)
    return true;
 	return false;
}

BoolConditional.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
}

BoolConditional.prototype.onPropertyChanged = function(name,value)
{
    if(name == "value"){
        this.slider.value = value;
        this.data.limit_value = value;
    }
}
BoolConditional.prototype.onExecute = function()
{
    var data = this.getInputData(1);
    // console.log(data);
    if(data !== undefined)
        this.properties.value_to_compare = data;
}


BoolConditional.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}

LiteGraph.registerNodeType("btree/BoolConditional", BoolConditional);


/*******************************************************************************************************************/
/*
* Check if an object is in the line of sight of something */
function LineOfSight()
{
    this.shape = 2;
	this.color= "#233";
	this.bgcolor = "#355",
    this.boxcolor = "#999";
    this.data = {}
    var w = 200;
    var h = 45;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("","vec3", {pos:[0,10], dir:LiteGraph.LEFT});
    this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    this.size = [w, h];    
    var that = this;
    this.properties = {
  		title:"", 
		look_at:null, 
		limit_angle:90
    };
    this.slider = this.addWidget("slider","Angle of vision", this.properties.limit_angle, function(v){ that.properties.limit_angle = v;  }, this.properties  );

    this.editable = { property:"value", type:"number" };
    // this.flags = { widgets_up: true };
	this.widgets_up = true;
	this.facade = null;
	this.behaviour = new Behaviour();
	this.serialize_widgets = true;

}
//reorder
LineOfSight.prototype.onStart = LineOfSight.prototype.onDeselected = function()
{
	var children = this.getOutputNodes(0);
	if(!children) return;
	children.sort(function(a,b)
	{
		if(a.pos[0] > b.pos[0])
		{
		  return 1;
		}
		if(a.pos[0] < b.pos[0])
		{
		  return -1;
		}
	});

	this.outputs[0].links = [];
	for(var i in children)
		this.outputs[0].links.push(children[i].inputs[0].link);
	
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
  
}

LineOfSight.prototype.tick = function(agent, dt)
{
	if(this.facade == null)
	{
		this.facade = this.graph.context.facade;
		return;
	}

	var lookat = this.properties.look_at;
	if(this.facade.canSeeElement(agent, lookat, this.properties.limit_angle))
	{
		this.description = 'Agent can see the input';
		var children = this.getOutputNodes(0);
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);

			//Value deber�a ser success, fail, o running
			if(value.STATUS == STATUS.success)
			{
				agent.evaluation_trace.push(this.id);

				if(agent.is_selected)
					highlightLink(this, child);

				return value;
			}
			else if(value && value.STATUS == STATUS.running)
			{
				agent.evaluation_trace.push(this.id);

				this.running_node_in_banch = true;
				if(agent.is_selected)
					highlightLink(this, child);

				return value;
			}
		}		

	}
	else
	{
		if(this.running_node_in_banch)
		{
			agent.bt_info.running_node_index = null;
		}
		agent.properties.look_at_pos = null;
		this.behaviour.STATUS = STATUS.fail;
		return this.behaviour;
	}
}

LineOfSight.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    ctx.fillText(`Agent looks at the input position`,10,35);
}

LineOfSight.prototype.onPropertyChanged = function(name,value)
{
    if(name == "value"){
        this.slider.value = value;
        // this.data.limit_value = value;
    }
}
LineOfSight.prototype.onExecute = function()
{
    var data = this.getInputData(1);
    // console.log(data);
    if(data)
        // this.data.look_at = [0,0,500];
        this.data.look_at = data;
}

LineOfSight.title = "LineOfSight"
LineOfSight.desc = "Decorator checking if can see something";

LineOfSight.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}
LineOfSight.prototype.onSerialize = function(info)
{

}

LiteGraph.registerNodeType("btree/LineOfSight", LineOfSight);

/*******************************************************************************************************************/
function Sequencer()
{
  
    this.shape = 2;
    this.color = "#6e1212";
    this.bgcolor = "#702d2d";
    this.boxcolor = "#999";
    this.addInput("","path");
	this.addOutput("","path");
	this.addProperty( "value", 1.0 );
    this.editable = { property:"value", type:"number" };
    this.data = {}
    this.flags = { horizontal: true };
 	this.horizontal = true;
	this.widgets_up = true;
	this.behaviour = new Behaviour();
}

Sequencer.prototype.onStart = Sequencer.prototype.onDeselected = function()
{
	var children = this.getOutputNodes(0);
	if(!children) return;
	children.sort(function(a,b)
	{
		if(a.pos[0] > b.pos[0])
		{
		  return 1;
		}
		if(a.pos[0] < b.pos[0])
		{
		  return -1;
		}
	});

	this.outputs[0].links = [];
	for(var i in children)
		this.outputs[0].links.push(children[i].inputs[0].link);
	this.ordered = true;

	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
	
}
Sequencer.prototype.tick = function(agent, dt)
{

	//check if this node was executed the previous evaluation
	if(!nodePreviouslyEvaluated(agent, this.id))
	{
		//clear this node, so it executes from the beginning
		agent.bt_info.running_data[this.id] = null;
	}

	/* means that there is some node on running state */
	if(agent.bt_info.running_data[this.id])
	{
		var children = this.getOutputNodes(0);
		for(var i = 0; i < children.length; i++)
		{
			if(i != agent.bt_info.running_data[this.id]) continue;
			var child = children[agent.bt_info.running_data[this.id]];
			var value = child.tick(agent, dt);
			if(value && value.STATUS == STATUS.running)
			{
				agent.evaluation_trace.push(this.id);

				if(agent.is_selected)
					highlightLink(this, child);

				return value;
			}
			if(agent.bt_info.running_data[this.id] == children.length-1 && value && value.STATUS == STATUS.success)
			{
				agent.bt_info.running_data[this.id] = null;
				// value.STATUS = STATUS.success;
				return value;
			}
			if( value && value.STATUS == STATUS.success )
			{  
				agent.evaluation_trace.push(this.id);

				agent.bt_info.running_data[this.id] ++;
				if(agent.is_selected)
					highlightLink(this, child);

				value.STATUS = STATUS.success;
				continue;
			}
			//Value deber�a ser success, fail, o running
			if(value && value.STATUS == STATUS.fail){
				agent.bt_info.running_data[this.id] = null;
				return value;
			}
		}
	}
	else
	{
		var children = this.getOutputNodes(0);
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);
			// debugger;
			if(value && value.STATUS == STATUS.running)
			{
				agent.evaluation_trace.push(this.id);
				agent.bt_info.running_data[this.id] = parseInt(n);
				
				if(agent.is_selected)
					highlightLink(this, child);

				return value;
			}
			if(value && value.STATUS == STATUS.success)
			{
				agent.evaluation_trace.push(this.id);

				if(agent.is_selected)
					highlightLink(this, child);
			}
			if(n == children.length-1 && value && value.STATUS == STATUS.success && agent.bt_info.running_data[this.id] == null)
				return value;
			//Value deber�a ser success, fail, o running
			if(value && value.STATUS == STATUS.fail)
			{
				if(this.running_node_in_banch)
					agent.bt_info.running_data[this.id] = null;

				return value;
			}
		}
	}
}

Sequencer.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;
}

// Sequencer.prototype.onConfigure = bl();
LiteGraph.registerNodeType("btree/Sequencer", Sequencer);

/*******************************************************************************************************************/
function Selector()
{
    this.shape = 2;
    this.color = "#6e1212";
    this.bgcolor = "#702d2d";
    this.boxcolor = "#999";
    this.addInput("","path");
	this.addOutput("","path");
	this.addProperty( "value", 1.0 );
    this.editable = { property:"value", type:"number" };
    this.data = {}
    this.flags = { horizontal: true };
 	this.horizontal = true;
    this.widgets_up = true;
}

Selector.prototype.onStart = Selector.prototype.onDeselected = function()
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

	this.ordered = true;

	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}

Selector.prototype.tick = function(agent, dt)
{
	//there is a task node in running state
	if(agent.bt_info.running_node_index != null && agent.bt_info.running_node_id == this.id)
	{
		var children = this.getOutputNodes(0);
		var child = children[agent.bt_info.running_node_index];
		var value = child.tick(agent, dt);
		if(value.STATUS == STATUS.running)
		{
			agent.evaluation_trace.push(this.id);

			//Editor stuff [highlight trace]
			if(agent.is_selected)
				highlightLink(this, child);

			return value;
		}

		if(value.STATUS == STATUS.success )
		{
			agent.evaluation_trace.push(this.id);

			//reinitialize running 
			agent.bt_info.running_node_index = null;
			agent.bt_info.running_node_id = null;
			//Editor stuff [highlight trace]
			if(agent.is_selected)
				highlightLink(this, child);
			
			value.STATUS = STATUS.success;
			return value;
		}
		if(value.STATUS == STATUS.fail){
			agent.bt_info.running_node_index = null;
			return value;
		}
	}
	//No running state in child nodes
	else
	{
		//The output 0 is always the behaviour tree output
		var children = this.getOutputNodes(0);
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);
			if(value.STATUS == STATUS.running)
			{
				agent.evaluation_trace.push(this.id);

				//first time receiving running state
				if((agent.bt_info.running_node_index == undefined || agent.bt_info.running_node_index == null ) || agent.bt_info.running_node_id == null)
				{
					agent.bt_info.running_node_index = parseInt(n);
					agent.bt_info.running_node_id = this.id;
				}

				//running node directly in the next child level, need to know which index to run
				if(agent.bt_info.running_node_index != undefined && agent.bt_info.running_node_index != null && agent.bt_info.running_node_id == this.id)
				{
					agent.bt_info.running_node_index = parseInt(n);
					agent.bt_info.running_node_id = this.id;
				}
				//Editor stuff [highlight trace]
				if(agent.is_selected)
					highlightLink(this, child);
			
				return value;
			}
			if(value.STATUS == STATUS.success)
			{
				agent.evaluation_trace.push(this.id);

				//Editor stuff [highlight trace]
				if(agent.is_selected)
					highlightLink(this, child);
			
				return value;
			}
		}
		return value; 
	}
    
}

Selector.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}

// Selector.prototype.onConfigure = bl();
LiteGraph.registerNodeType("btree/Selector", Selector);

function RandomSelector()
{
	this.shape 		= 2;
	this.color 		= "#6e1212";
	this.bgcolor 	= "#702d2d";
	this.boxcolor 	= "#999";
	this.size 		= [100,35];
	this.addInput("","path");
	this.addOutput("","path");
	// this.addProperty( "value", 1.0 );
	this.editable 	= { property:"period", type:"number" };
	this.flags 		= { horizontal: true };
	this.horizontal = true;
	this.widgets_up = true;
	this.properties = {period:5};
	var that = this;
	this.slider = this.addWidget("number","Period", this.properties.period, function(v){  that.properties.period = v; }, this.properties  );
	this.serialize_widgets = true;
}

RandomSelector.prototype.onStart = RandomSelector.prototype.onDeselected = function()
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

RandomSelector.prototype.tick = function(agent, dt)
{
	// know if bt_info params must be reset
	// if the node was not in the previous 
	if(!nodePreviouslyEvaluated(agent, this.id))
		resetHBTreeProperties(agent)

	//Running node in previous evaluation
	if(agent.bt_info.running_node_index != null && agent.bt_info.random_index_data && agent.bt_info.random_index_data[this.id])
	{
		//accumulate the period of the random computation 
		if(agent.bt_info.random_period != null && agent.bt_info.random_period != undefined)
			agent.bt_info.random_period += dt;
		
		var children = this.getOutputNodes(0);
		var child = children[agent.bt_info.random_index_data[this.id]];
		var value = child.tick(agent, dt);
		if(value && value.STATUS == STATUS.running)
		{
			agent.evaluation_trace.push(this.id);
			//Editor stuff [highlight trace]
			if(agent.is_selected)
				highlightLink(this, child);

			return value;
		}
		if( value && value.STATUS == STATUS.success )
		{
			agent.evaluation_trace.push(this.id);
			agent.bt_info.running_node_index 	= null;
			agent.bt_info.running_node_id 		= null;
			agent.bt_info.random_index_data[this.id] = null;

			//Editor stuff [highlight trace]
			if(agent.is_selected)
				highlightLink(this, child);
			
			//to reevaluate the random selection once a running node has finished
			agent.bt_info.random_period = this.properties.period+1;
			value.STATUS = STATUS.success;
			return value;
		}
		if(value && value.STATUS == STATUS.fail)
		{
			agent.bt_info.running_node_index = null;
			return value;
		}
	}
	//No running state in child nodes
	else
	{
		//first time to ser the period that the random will last
		if(agent.bt_info.random_period == undefined || agent.bt_info.random_period == null)
			agent.bt_info.random_period = 0;
		// increase in case there is already a random period ser
		else
			agent.bt_info.random_period += dt;

		var children = this.getOutputNodes(0);
		//The running node has spent more time than the random period
		//we calculate a new random node
		if( agent.bt_info.random_period <= 0 || agent.bt_info.random_period > this.properties.period )
		{
			//reset agent.bt_info.random_period && rand
			agent.bt_info.random_period = 0;
			//random child to tick
			var rand = Math.trunc(Math.random()*children.length);
			if(rand >= children.length)
				rand -= 1;
			agent.bt_info.rand_selection_index = rand;
		}

		//if we are still inside the random_period time, execute again the same rand node

		var child = children[agent.bt_info.rand_selection_index];
		var value = child.tick(agent, dt);
		// the random selection returns running
		if(value && value.STATUS == STATUS.running)
		{
			agent.evaluation_trace.push(this.id);
			//in case there is a sequencer or selector in running state in lower levels
			if(agent.bt_info.running_node_index && agent.bt_info.running_node_id != this.id)
			{
				this.running_node_in_banch = true;
			}
			else
			{
				//child in running status
				agent.bt_info.running_node_index = parseInt(agent.bt_info.rand_selection_index);
				//node which has to take into account which child to execute
				agent.bt_info.running_node_id = this.id;
			}

			if(agent.is_selected)
				highlightLink(this, child);
			
			//to know whch random pick is in running state
			if(!agent.bt_info.random_index_data)
				agent.bt_info.random_index_data = {};

			agent.bt_info.random_index_data[this.id] = agent.bt_info.rand_selection_index;
			return value;
		}
		else if(value && value.STATUS == STATUS.success)
		{
			agent.evaluation_trace.push(this.id);
			//Editor stuff [highlight trace]
			if(agent.is_selected)
				highlightLink(this, child);
			
			return value;
		}
		else 
		{
			agent.bt_info.random_index_data[this.id] = null;
			agent.bt_info.random_period = null;
			this.behaviour.STATUS = STATUS.fail;
			return this.behaviour; //placeholder ta que lo pensemos bien
		}
	}
	
}

RandomSelector.prototype.onConfigure = function(info)

{
	onConfig(info, this.graph);
}

LiteGraph.registerNodeType("btree/RandomSelector", RandomSelector);


function MoveToLocation()
{
    this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    var w = 200;
    var h = 50;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
	this.addInput("target","vec3", {pos:[0,32], dir:LiteGraph.LEFT});
	this.addProperty( "threshold", 200.0 );
    this.size = [w, h];    
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.data = {target:null, motion:1}
	this.widgets_up = true;
	this.facade = null;
	this.target_to_draw = null;
	var that = this;
	this.slider = this.addWidget("string","Threshold", this.properties.threshold, function(v){ that.properties.threshold = v; that.properties.threshold = v; }, this.properties  );
	this.serialize_widgets = true;
	this.behaviour = new Behaviour();
	
}

MoveToLocation.title = "MoveToLocation ";

MoveToLocation.prototype.onDeselected = function () {
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}

MoveToLocation.prototype.tick = function(agent, dt)
{		
	if(!this.facade)
	{
		this.facade = this.graph.context.facade;
	}
	if(this.properties.target)
	{
		this.facade.setEntityProperty(agent, "target", this.properties.target);
		if(this.facade.entityInTarget && this.facade.entityInTarget(agent, this.properties.target, parseInt(this.properties.threshold)))
		{
			//build and return success
//			console.log("a");
			agent.evaluation_trace.push(this.id);

			this.behaviour.type = B_TYPE.moveToLocation;
			this.behaviour.STATUS = STATUS.success;
			this.behaviour.setData({target:this.properties.target});
			this.graph.evaluation_behaviours.push(this.behaviour);
			return this.behaviour;
		}
		else
		{
			//build and return running
			agent.evaluation_trace.push(this.id);
			this.behaviour.type = B_TYPE.moveToLocation;
			this.behaviour.STATUS = STATUS.running;
			this.behaviour.setData({target:this.properties.target});
			this.graph.evaluation_behaviours.push(this.behaviour);
			return this.behaviour;
		}
		// agent.properties.target = this.properties.target;
		// this.description = 'Target updated: New destination set to the input';

		// agent.evaluation_trace.push(this.id);
		// this.behaviour.type = B_TYPE.moveToLocation;
		// this.behaviour.STATUS = STATUS.success;
		// this.behaviour.setData({target:this.properties.target});
		// this.graph.evaluation_behaviours.push(this.behaviour);
		// return this.behaviour;
	}
	this.behaviour.type = B_TYPE.moveToLocation;
	this.behaviour.STATUS = STATUS.fail;
	this.behaviour.setData({});
	return this.behaviour;
}
MoveToLocation.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
    if(this.properties.target)
	{
		// this.properties.target = Math.trunc(this.properties.target); 
		this.target_to_draw = [Math.floor(this.properties.target[0]),Math.floor(this.properties.target[1]), Math.floor(this.properties.target[2])]

		ctx.fillText(`move to: ${this.target_to_draw}`,10,35);

	}
        
    // ctx.fillText(`Motion speed: ${this.data.motion}`,10,55);
}
MoveToLocation.prototype.onExecute = function()
 {
	if(!this.getInputData(1)) 
		return;
	var data = this.getInputData(1).constructor == Array ? this.getInputData(1) : this.getInputData(1).position ;
	if(!data)
		data = this.getInputData(1).constructor == Float32Array ? this.getInputData(1) : this.getInputData(1).position ;
    if(data)
        this.properties.target = data;

}
MoveToLocation.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}

LiteGraph.registerNodeType("btree/MoveToLocation", MoveToLocation);

function FindNextTarget()
{
	this.shape    = 2;
	this.color    = "#2e542e"
	this.bgcolor  = "#496b49";
	this.boxcolor = "#999";
	var w         = 200;
	var h         = 35;
	
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.size       = [w, h];
    this.editable   = { property:"value", type:"number" };
    this.flags      = { resizable: false };
    this.data       = {};
    this.horizontal = true;
    this.widgets_up = true;


}

FindNextTarget.title = "FindNextTarget ";

FindNextTarget.prototype.tick = function(agent, dt)
{
	if(this.findNextTarget && !this.findNextTarget(agent))
	{
		this.behaviour.STATUS = STATUS.fail;
		return this.behaviour;
	}
	else
	{   
		this.description = ' Next waypoint of the path found';

		// var g_child = child.g_node;
		// var chlid_input_link_id = g_child.inputs[0].link;
		// this.g_node.triggerSlot(0, null, chlid_input_link_id);
		this.behaviour.type = B_TYPE.nextTarget;
		this.behaviour.STATUS = STATUS.success;
		this.behaviour.setData({});
		return this.behaviour;
	}
}

FindNextTarget.prototype.findNextTarget = function(agent)
{
	//find nearest agent
	if(agent.checkNextTarget())
	{
//		agent.properties.target = agent.checkNextTarget();
		agent.in_target = false;
		return true;  
	}
	return false;
}

FindNextTarget.prototype.onDrawBackground = function(ctx, canvas)
{
    // ctx.font = "12px Arial";
    // ctx.fillStyle = "#AAA";
    // // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
    // ctx.fillText(`move to: ${this.data.target}`,10,35);
    // ctx.fillText(`Motion speed: ${this.data.motion}`,10,55);
}

FindNextTarget.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}

LiteGraph.registerNodeType("btree/FindNextTarget", FindNextTarget);

function Wait()
{
    this.shape = 2;
	this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    this.addInput("","path");
	this.addProperty( "value", 1.0 );
	this.addProperty("priority", "append", "enum", {
		values: [
			"append",
			"overwrite",
			"mix",
			"skip"
		]
	});
	this.size       = [200,45];
	this.editable   = { property:"value", type:"number" };
	this.flags      = { horizontal: true };
	this.horizontal = true;
	this.widgets_up = true;
	this.data       = {}
	this.behaviour  = new Behaviour();
    var that        = this;

    this.properties = {
		total_time:5, 
    };
    // this.size = [80,60];
    this.slider = this.addWidget("number","Time to wait", this.properties.total_time, function(v){ that.properties.total_time = v; that.properties.total_time = v; }, this.properties  );
	this.serialize_widgets = true;
}

Wait.title = "Wait";

Wait.prototype.onDeselected = function()
{
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}

Wait.prototype.tick = function(agent, dt)
{
	this.description = 'Waiting ' + this.properties.total_time + ' seconds ';

	//first time evaluating this node
	if(!agent.waiting_time)
	{
		agent.waiting_time 			= this.properties.total_time;
		agent.current_waiting_time 	= 0;
		this.behaviour.type   		= B_TYPE.wait;
		this.behaviour.STATUS 		= STATUS.running;
//		this.behaviour.setData(behaviour);
		agent.evaluation_trace.push(this.id);
		this.graph.evaluation_behaviours.push(this.behaviour);
		return this.behaviour;
	}
	//already waiting in the previous evaluation
	else
	{
		if(agent.current_waiting_time > agent.waiting_time)
		{
			agent.waiting_time 			= null;
			agent.current_waiting_time  = 0;
			this.behaviour.type   		= B_TYPE.wait;
			this.behaviour.STATUS 		= STATUS.success;
//			this.behaviour.setData(behaviour);
			agent.evaluation_trace.push(this.id);
			this.graph.evaluation_behaviours.push(this.behaviour);
			return this.behaviour;
		}
		else{
			agent.current_waiting_time += dt;
			this.behaviour.type   		= B_TYPE.wait;
			this.behaviour.STATUS 		= STATUS.running;
			agent.evaluation_trace.push(this.id);
			this.graph.evaluation_behaviours.push(this.behaviour);
//			this.behaviour.setData(behaviour);
			return this.behaviour;
		}
	}
}

Wait.prototype.onConfigure = function(info)
{
    // debugger;
    onConfig(info, this.graph);
    // this.data.g_node = this;

}
LiteGraph.registerNodeType("btree/Wait", Wait);

function SimpleAnimate()
{
    this.shape    = 2;
    this.color    = "#2e542e"
    this.bgcolor  = "#496b49";
    this.boxcolor = "#999";
	this.addInput("","path");
	
    //this.addProperty( "value", 1.0 );
    // this.size = [200,80];
	this.editable   = { property:"value", type:"number" };
	this.widgets_up = true;
	this.horizontal = true;
	this.properties = {anims:[{name:null, weight: 1}], motion:0, speed:1, src:"david8more/projects/SAUCE/Animations/", filename:""};
	var that        = this;
	this.widget     = this.addWidget("string","", this.properties.filename, function(v){ that.properties.filename = v.toLowerCase(); }, this.properties  );
	this.number     = this.addWidget("number","motion", this.properties.motion, function(v){ that.properties.motion = v; }, this.properties  );
	this.number2    = this.addWidget("number","speed", this.properties.speed, function(v){ that.properties.speed = v; }, this.properties  );
	this.addProperty("intensity", 0.5, "number", {min:0, max:1} );
	this.addProperty("priority", "append", "enum", {
		values: [
			"append",
			"overwrite",
			"mix",
			"skip"
		]
	});
	this.facade 	= null;
	this.behaviour 	= new Behaviour();
	this.serialize_widgets = true;
}

SimpleAnimate.title = "SimpleAnimate ";
SimpleAnimate.prototype.onDeselected = function () 
{
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();	
}

SimpleAnimate.prototype.tick = function(agent, dt)
{
	if(this.facade == null)
		this.facade = this.graph.context.facade;

//   if(agent.animationBlender)
//   {
  	if(this.action)
	{
	  this.description = 'Playing ' + this.properties.anims[0].anim;
	  agent.evaluation_trace.push(this.id);
      return this.action(agent);
	}
//   }
}

SimpleAnimate.prototype.action = function(agent)
{
	var animation = this.facade.getAnimation(this.properties.filename);//animation_manager.animations[this.properties.filename.toLowerCase()];
	// animation.weight = 1;
	var behaviour = {
		animation_to_merge: animation,
		speed: this.properties.speed,
		motion:this.properties.motion,
//		weight:this.properties.weight
		type: this.type,
		type2: "mixing",
		author: "DaVinci"
	};
	
//	LEvent.trigger( agent, "applyBehaviour", behaviour);

	this.behaviour.type = B_TYPE.animateSimple;
	this.behaviour.STATUS = STATUS.success;
	this.behaviour.setData(behaviour);
	this.behaviour.priority = this.properties.priority; 
	//console.log(behaviour);
	//agent.animationBlender.applyBehaviour(behaviour);
	agent.evaluation_trace.push(this.id);
	this.graph.evaluation_behaviours.push(this.behaviour);
	return this.behaviour;
}

SimpleAnimate.prototype.onPropertyChanged = function(name,value)
{
    if(name == "filename"){
        this.widget.value = value.toLowerCase();
        // this.data.limit_value = value;
    }

    if(name == "motion"){
        this.number.value = value;
        // this.data.limit_value = value;
    }

	if(name == "speed"){
        this.number2.value = value;
        // this.data.limit_value = value;
    }
}


SimpleAnimate.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;
}

LiteGraph.registerNodeType("btree/SimpleAnimate", SimpleAnimate);

function ActionAnimate()
{
    this.shape = 2;
	this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    this.addInput("","path");
    //this.addProperty( "value", 1.0 );
    this.size = [160,55];
    this.editable = { property:"value", type:"number" };
  	this.widgets_up = true;
	this.horizontal = true;
	this.addProperty("intensity", 0.5, "number", {min:0, max:1} );
	this.addProperty("priority", "append", "enum", {
		values: [
			"append",
			"overwrite",
			"mix",
			"skip"
		]
	});
	this.properties = {anims:[{name:null, weight: 1}], translation_enabled:true, time:1, src:"david8more/projects/SAUCE/Animations/", filename:""};
  	var that = this;
    this.widget = this.addWidget("string","", this.properties.filename, function(v){ that.properties.filename = v.toLowerCase(); }, this.properties  );
//  	this.number = this.addWidget("number","motion", this.properties.motion, function(v){ that.properties.motion = v; }, this.properties  );
//	this.toggle = this.addWidget("toggle","Translation:", this.properties.translation_enabled, function(v){ console.log(v);that.properties.translation_enabled = v; }, this.properties  );
	this.number2 = this.addWidget("number","time", this.properties.time, function(v){ that.properties.time = v; }, this.properties  );

	this.facade = null;
	this.behaviour = new Behaviour();
	this.serialize_widgets = true;
}

ActionAnimate.title = "ActionAnimate ";

ActionAnimate.prototype.onDeselected = function()
{
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}

ActionAnimate.prototype.tick = function(agent, dt)
{
	if(this.facade == null)
		this.facade = this.graph.context.facade;
		
	if(!agent.action_time)
	{
		agent.evaluation_trace.push(this.id);
		agent.action_time = this.properties.time;
		agent.current_action_time = 0;
		this.behaviour.STATUS = STATUS.running;
		if(this.action)
		{
			this.description = 'Action: ' + this.properties.anims[0].anim;
			this.action(agent);
		}
		this.graph.evaluation_behaviours.push(this.behaviour);
		return this.behaviour;

	}

	else
	{
		if(agent.current_action_time > agent.action_time)
		{
			agent.evaluation_trace.push(this.id);
			agent.action_time = null;
			agent.current_action_time = 0;
			this.behaviour.STATUS = STATUS.success;
			if(this.action)
			{
				this.description = 'Action: ' + this.properties.anims[0].anim;
				this.action(agent);
			}
//			this.behaviour.setData(behaviour);
			this.graph.evaluation_behaviours.push(this.behaviour);
			return this.behaviour;
		}
		else
		{
			agent.evaluation_trace.push(this.id);
			agent.current_action_time += dt;

			this.behaviour.STATUS = STATUS.running;
			if(this.action)
			{
				this.description = 'Action: ' + this.properties.anims[0].anim;
				this.action(agent);
			}
			// this.behaviour.setData(behaviour);
			this.graph.evaluation_behaviours.push(this.behaviour);
			return this.behaviour;
		}
	}
}    

ActionAnimate.prototype.action = function(agent)
{
	var animation = this.facade.getAnimation(this.properties.filename);//animation_manager.animations[this.properties.filename.toLowerCase()];
	animation.weight = 1;
	var behaviour = {
		animation_to_merge: animation,
		speed: this.properties.speed,
		type: this.type,
		author: "DaVinci"
	};
	

	this.behaviour.type = B_TYPE.action;
	this.behaviour.priority = this.properties.priority; 
	this.behaviour.setData(behaviour);
	//agent.animationBlender.applyBehaviour(behaviour);
}

ActionAnimate.prototype.onPropertyChanged = function(name,value)
{
    if(name == "filename"){
        this.widget.value = value.toLowerCase();
        // this.data.limit_value = value;
    }

	if(name == "speed"){
        this.number2.value = value;
        // this.data.limit_value = value;
    }
}


ActionAnimate.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;
}

LiteGraph.registerNodeType("btree/ActionAnimate", ActionAnimate);

function Patrol()
{
	this.shape = 2;
	this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    this.addInput("","path");
    this.size = [100,25];
    this.editable = { property:"value", type:"number" };
  	this.widgets_up = true;
	this.horizontal = true;
	this.properties = { filename:"" };
	this.addProperty("intensity", 0.5, "number", {min:0, max:1} );
	this.addProperty("priority", "append", "enum", {
		values: [
			"append",
			"overwrite",
			"mix",
			"skip"
		]
	});
	this.addProperty("motion_speed", 2.5, "number", {min:0, max:10} );
	var that = this;
	//this.widget = this.addWidget("string","", this.properties.filename, function(v){ that.properties.filename = v.toLowerCase(); }, this.properties  );
	this.widget = this.addWidget("combo","anim", this.properties.filename, "filename", { values:function(widget, node){
        return Object.keys(animation_manager.animations);
    }} );
	this.motion_slider = this.addWidget("number","motion", this.properties.motion_speed, function(v){ that.properties.motion_speed = v; }, this.properties  );

	
	this.facade = null;
	this.behaviour = new Behaviour();
	this.serialize_widgets = true;
}

Patrol.prototype.onDeselected = function()
{
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}
Patrol.prototype.tick = function( agent )
{
	if(this.facade == null)
		this.facade = this.graph.context.facade;

	var animation = this.facade.getAnimation(this.properties.filename);
	
	if(!this.facade.getEntityPropertyValue("target", agent) || !animation)
	{
		this.behaviour.STATUS = STATUS.fail;
		this.graph.evaluation_behaviours.push(this.behaviour);
		return this.behaviour;
	}
	else
	{
		agent.evaluation_trace.push(this.id);
		var behaviour = {
			animation_to_merge: animation,
			motion: this.properties.motion_speed
		};
		this.description = 'Agent patroling';
		this.behaviour.type = B_TYPE.nextTarget;
		this.behaviour.STATUS = STATUS.success;
		this.behaviour.priority = this.properties.priority; 
		this.behaviour.setData(behaviour);
		this.graph.evaluation_behaviours.push(this.behaviour);
		return this.behaviour;
	}
}


Patrol.prototype.isInTarget = function( agent )
{
	if(this.facade.entityInTarget(agent, this.facade.getEntityPropertyValue("target", agent), 100))
	{
		//if the target has som interesting properties, apply them to the agent
		this.facade.applyTargetProperties(this.facade.getEntityPropertyValue("target", agent), agent);
		return true;
	}
	else
		return false;
}

Patrol.prototype.findNextTarget = function(agent)
{
	//find nearest agent
	if(this.graph.context.facade.checkNextTarget( agent ))
	{
//		agent.properties.target = agent.checkNextTarget();
		agent.in_target = false;
		return true;  
	}
	return false;
}
Patrol.prototype.onPropertyChanged = function(name,value)
{
    if(name == "filename"){
        this.widget.value = value.toLowerCase();
        // this.data.limit_value = value;
    }
}
Patrol.prototype.onConfigure = function(info)
{
	onConfig(info, this.graph);

}
LiteGraph.registerNodeType("btree/Patrol", Patrol);

function EQSNearestInterestPoint()
{
	this.shape = 2;
    this.color = "#323";
    this.bgcolor = "#543754";
    this.boxcolor = "#999";
    this.title = "EQS-NIP"
    this.data = {}
    this.ip_type = null;
    var w = 200;
    var h = 55;
    this.addOutput("value","vec3", {pos:[w,35], dir:LiteGraph.RIGHT});
    this.size = [w, h]; 
    var that = this;
    this.properties = {
        list: [],
        min: 0,
        max: 100,
        text: "threshold", 
		ip_type: null
    };
    // this.size = [80,60];
    this.slider = this.addWidget("combo","List", this.properties.ip_type, "ip_type", { values:function(widget, node){
        return Object.keys(CORE.Scene.properties.interest_points);
    }} );

    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.widgets_up = true;
	this.facade = null;
	this.serialize_widgets = true;

}

EQSNearestInterestPoint.prototype.onDrawBackground = function(ctx, canvas)
{
    // ctx.font = "12px Arial";
    // ctx.fillStyle = "#AAA";
    // ctx.fillText(`List evaluated`,10,15);
}

EQSNearestInterestPoint.prototype.onExecute = function()
{
    // debugger;
	if(this.facade == null)
		this.facade = this.graph.context.facade;
	
    var nearest = [0,0,-1000];
    var min = 999999999;
    var types = this.facade.getInterestPoints();
    if(!this.properties.ip_type)
        if(types[0])
            this.properties.ip_type = types[0];
    for(var i in types)	
    {
        var type = types[i];
        if(this.properties.ip_type != i)
            continue;
        for(var j in types[i])
        {
            var type_ip = types[i][j];
            var ip = type_ip.position;
			if(!this.graph.character_evaluated) return;
//			if(!this.graph.character_evaluated.scene_node) return;
            var agent_pos = this.facade.getEntityPosition(this.graph.character_evaluated);
            var dist = vec3.dist(ip, agent_pos);
    
            if(dist < min)
			{
                min = dist;
                nearest = type_ip;
            }
        }
    }
    this.setOutputData(0,nearest);
}

EQSNearestInterestPoint.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}

LiteGraph.registerNodeType("btree/EQSNearestInterestPoint", EQSNearestInterestPoint);

function EQSDistanceTo()
{
    this.shape = 2;
    this.color = "#323";
    this.bgcolor = "#543754";
    this.boxcolor = "#999";
    var w = 150;
    var h = 45;
    // this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("pos1","vec3", {pos:[0,10], dir:LiteGraph.LEFT});
    this.addInput("pos2","vec3", {pos:[0,30], dir:LiteGraph.LEFT});
    this.addOutput("dist","number", {pos:[w,10], dir:LiteGraph.LEFT});
    // this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    this.size = [w, h]; 
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.properties = {pos:[0, 0, 0]}
	this.widgets_up = true;

}

EQSDistanceTo.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
//    ctx.fillText(`Point evaluated`,10,35);
}
EQSDistanceTo.prototype.onExecute = function()
{
	if(! this.getInputData(0) ||  !this.getInputData(1))
		return;
	var point1 = this.getInputData(0).constructor == Float32Array ? this.getInputData(0) : this.getInputData(0).position;
	var point2 =this.getInputData(1).constructor == Float32Array ? this.getInputData(1) : this.getInputData(1).position;
	if(point1 && point2)
		var dist = vec3.dist(point1, point2);
	else
		var dist = 0;
    // console.log("Agent pos: ", agent_pos);
    // console.log("Point: ", point);
    // console.log(dist);  
    this.setOutputData(0,dist);
}

EQSDistanceTo.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}
LiteGraph.registerNodeType("btree/EQSDistanceTo", EQSDistanceTo);

function EQSNearestAgent()
{
    this.shape = 2;
    this.color = "#323";
    this.bgcolor = "#543754";
    this.boxcolor = "#999";
    var w = 200;
    var h = 80;

    this.addOutput("","", {pos:[w,10], dir:LiteGraph.LEFT});
    this.size = [w, h]; 
    this.editable = { property:"value", type:"number" };
    this.properties = {comparison_type:"<", value:50, prop:""}
	var that = this;
	this.prop_widget = this.addWidget("string","Property", this.properties.prop, function(v){ that.properties.prop = v.toLowerCase(); }, this.properties  );
	this.combo = this.addWidget("combo","Type:", ">", function(v){that.properties.comparison_type = v;}, { values:function(widget, node){
        return [">","<","==", "!=", "<=", ">="];
    }} ); 
	this.value_widget = this.addWidget("string","Value", this.properties.value, function(v){ that.properties.value = v.toLowerCase(); }, this.properties  );    
	this.flags = { resizable: false };
    this.widgets_up = true;
	this.facade = null;
	this.serialize_widgets = true;

}

EQSNearestAgent.prototype.onExecute = function()
{
	if(this.facade == null)
		this.facade = this.graph.context.facade;
	
	var agents = this.facade.getListOfAgents();
	if(agents)
	{
		var nearest = [999999, 999999, 999999];
		var last_dist = 99999999;
		for(var i in agents)
		{
			var ag = agents[i];
			if(this.facade.entityHasProperty(ag, this.properties.prop) && this.evaluateCondition(ag))
			{
				var evaluated_pos = this.facade.getEntityPosition(this.graph.character_evaluated);
				var ag_pos = this.facade.getEntityPosition(ag);
				if(!evaluated_pos || ! ag_pos) continue;
				var dist = vec3.dist( ag_pos, evaluated_pos );
				if(dist < last_dist)
				{
					nearest = ag_pos;
					last_dist = dist;	
				}
			}
		}
	}
    this.setOutputData(0,nearest);
}

EQSNearestAgent.prototype.evaluateCondition = function(entity)
{
	var result = true;
    var value = this.properties.value;

    try{
        value = JSON.parse( value );
    }catch{
       // value is a string (no true/false/number)
       // i.e. a name "pepe"
    }

    switch (this.properties.comparison_type) {
        case ">":
            result = entity.properties[this.properties.prop] > value;
            break;
        case "<":
            result = entity.properties[this.properties.prop] < value;
            break;
        case "==":
            result = entity.properties[this.properties.prop] == value;
            break;
        case "!=":
            result = entity.properties[this.properties.prop] != value;
            break;
        case "<=":
            result = entity.properties[this.properties.prop] <= value;
            break;
        case ">=":
            result = entity.properties[this.properties.prop] >= value;
            break;
        }
    return result;
}

EQSNearestAgent.prototype.onPropertyChanged = function(name,value)
{
    if(name == "prop")
        this.prop_widget.value = value;
	if(name == "value")
		this.value_widget.value = value;
    
}
EQSNearestAgent.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}

LiteGraph.registerNodeType("btree/EQSNearestAgent", EQSNearestAgent);

function EQSNearestCollidable()
{
    this.shape = 2;
    this.color = "#323";
    this.bgcolor = "#543754";
    this.boxcolor = "#999";
    var w = 150;
    var h = 45;
    // this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("pos1","vec3", {pos:[0,10], dir:LiteGraph.LEFT});
    this.addInput("pos2","vec3", {pos:[0,30], dir:LiteGraph.LEFT});
    this.addOutput("dist","number", {pos:[w,10], dir:LiteGraph.LEFT});
    // this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    this.size = [w, h]; 
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.properties = {pos:[0, 0, 0], rad:200, orientation:null}
    this.widgets_up = true;
}

EQSNearestCollidable.prototype.getCollisionData = function(agent_evaluated, nearest_agent, dist)
{
	if(dist < this.properties.rad*2)
	{
		var p = vec3.fromValues(0,0,1); 
		var agent_front = mat4.multiplyVec3(vec3.create(), agent_evaluated.scene_node.getGlobalMatrix(), p);
		var agent_to_nearest = this.facade.getEntityPosition(nearest_agent) - this.facade.getEntityPosition(agent_evaluated);
		vec3.normalize(agent_front, agent_front);
		vec3.normalize( agent_to_nearest,  agent_to_nearest);
		var v_agent_front = vec2.fromValues(agent_front[0],agent_front[2]);
		var v_agent_to_nearest = vec2.fromValues(agent_to_nearest[0],agent_to_nearest[2]);

		var deg = Math.acos(vec3.dot(v_agent_front, v_agent_to_nearest));
		//front case
		if(Math.abs(deg)<Math.PI/2)
		{
			var sign = Math.abs(deg)/(deg);
			var res = -Math.abs(Math.PI/2-deg)*sign;
			this.properties.orientation = res/10;
			return res;
			// agent_evaluated.scene_node.rotate();
		}
		//
	}
}

EQSNearestCollidable.prototype.onExecute = function ()
{
	if(this.facade == null)
		this.facade = this.graph.context.facade;

	var agents = this.facade.getListOfAgents();
	if(agents)
	{
		var nearest = [999999, 999999, 999999];
		var nearest_agent; 
		var last_dist = 99999999;
		for(var i in agents)
		{
			var ag = agents[i];
			if(this.facade.entityHasProperty(ag, this.properties.prop) && this.evaluateCondition(ag))
			{
				//position of the evaluated agent
				var evaluated_pos = this.facade.getEntityPosition(this.graph.character_evaluated);
				//position of other agent
				var ag_pos = this.facade.getEntityPosition(ag);
				if(!evaluated_pos || ! ag_pos) continue;
				var dist = vec3.dist( ag_pos, evaluated_pos );
				if(dist < last_dist)
				{
					nearest = ag_pos;
					nearest_agent = ag;
					last_dist = dist;	
				}
			}
		}
		debugger;
		var data = this.getCollisionData( this.graph.character_evaluated, nearest_agent, last_dist  );

	}
    this.setOutputData(0,nearest);
}

// LiteGraph.registerNodeType("btree/EQSNearestCollidablev", EQSNearestCollidable);

function LookAt()
{
    this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    var w = 200;
    var h = 55;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("target","vec3", {pos:[0,35], dir:LiteGraph.LEFT});
    this.size = [w, h];    
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
	this.properties = {look_at:[0,100,100]}
	this.addProperty("smoothness", 0.5, "number", {min:0, max:1} );
	this.addProperty("intensity", 0.5, "number", {min:0, max:1} );
	this.addProperty("priority", "append", "enum", {
		values: [
			"append",
			"overwrite",
			"mix",
			"skip"
		]
	});
	var that = this;
	this.widget = this.addWidget("slider","Smoothness", this.properties.smoothness, function(v){ that.properties.smoothnessv = v; that.properties.smoothness = v; },{min:0, max:1, step:0.1} );
	this.widgets_up = true;
	this.facade = null;
	this.behaviour = new Behaviour();
	this.current_look_at = vec3.create();
	this.serialize_widgets = true;

}

LookAt.prototype.tick = function(agent, dt)
{
	if(this.facade == null)
		this.facade = this.graph.context.facade;
	
	agent.evaluation_trace.push(this.id);
	vec3.copy(this.current_look_at, this.properties.look_at);
	this.behaviour.type = B_TYPE.lookAt;
	this.behaviour.setData({lookat:this.current_look_at, smoothness:this.properties.smoothness});
	this.behaviour.STATUS = STATUS.success; 
	this.behaviour.priority = this.properties.priority; 

	// this.facade.setEntityProperty(agent, "look_at_pos", this.properties.look_at );
	this.description = 'Look At updated: New look at position set to the input';
	this.graph.evaluation_behaviours.push(this.behaviour);
	return this.behaviour;
}
LookAt.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    // ctx.fillText(`Look at Node`,10,40);
}

LookAt.prototype.onExecute = function(ctx, canvas)
{
	var data = this.getInputData(1);
    if(data)
		vec3.copy(this.properties.look_at, data);
}

LookAt.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}

LookAt.prototype.onPropertyChanged = function(name, value)
{
	if(name == "smoothness")
        this.widget.value = value;
}
LiteGraph.registerNodeType("btree/LookAt", LookAt);

function SetMotionVelocity()
{
	this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
	var w = 200;
    var h = 60;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
	this.addInput("","number", {pos:[0,35], dir:LiteGraph.LEFT});
    this.size = [w,h];
    this.editable = { property:"value", type:"number" };
  
	this.properties = {motion:1.0};
	this.addProperty("priority", "append", "enum", {
		values: [
			"append",
			"overwrite",
			"mix",
			"skip"
		]
	});
  	var that = this;
  	this.motion_slider = this.addWidget("number","velocity", this.properties.motion, function(v){ that.properties.motion = v; }, this.properties  );
	this.widgets_up = true;
//	this.horizontal = true;
	this.flags = { resizable: false };
	this.serialize_widgets = true;
	this.behaviour = new Behaviour();
	this.behaviour.priority = this.properties.priority; 


}

SetMotionVelocity.title = "SetMotionVelocity ";

SetMotionVelocity.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
    ctx.fillText(`External motion velocity`,10,40);
}

SetMotionVelocity.prototype.tick = function(agent, dt)
{
	agent.evaluation_trace.push(this.id);
	this.behaviour.type = B_TYPE.setMotion;
	this.behaviour.setData(this.properties.motion);
	this.behaviour.STATUS = STATUS.success; 
	this.behaviour.priority = this.properties.priority; 
	this.graph.evaluation_behaviours.push(this.behaviour);
	return this.behaviour;
}

SetMotionVelocity.prototype.onPropertyChanged = function(name,value)
{
    if(name == "motion")
        this.motion_slider.value = value;
    
}

SetMotionVelocity.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;
}

LiteGraph.registerNodeType("btree/SetMotionVelocity", SetMotionVelocity);

//lack of type choice --> on progress
function SetProperty()
{
	this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    this.size = [200,65];
	this.addInput("","path", {pos:[200*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});	
	this.addInput("name","", {pos:[0,15], dir:LiteGraph.LEFT});
	this.addInput("value","", {pos:[0,40], dir:LiteGraph.LEFT});
	this.addProperty("priority", "append", "enum", {
		values: [
			"append",
			"overwrite",
			"mix",
			"skip"
		]
	});    
	this.editable = { property:"value", type:"number" };
  	this.properties = {value:1.0};
  	var that = this;
	this.dynamic = null;
	this.widget_type = "number";
	this.target_type = "agent";
	this.dynamic = this.addWidget("string","value", 5, function(v){ that.properties.value = v; }, this.properties );
	this.tmp_data = {};
	// this.widgets_up = true;
	this.facade = null;
	this.behaviour = new Behaviour();
	this.serialize_widgets = true;

}

SetProperty.prototype.onExecute = function()
{
    var name = this.getInputData(1);
    if(name)
        this.properties.property_to_compare = name;
	
	if(!this.graph.character_evaluated) return;
	if(this.graph.character_evaluated.properties[name])
	{	
		this.target_type = "agent";
	}
	else if(blackboard[name])
	{
		this.target_type = "global";
	}

	var value = this.getInputData(2);
	if(value)
		this.properties.value = value.toString();
}


SetProperty.prototype.tick = function(agent, dt)
{
	if(this.facade == null)
		this.facade = this.graph.context.facade;

	agent.evaluation_trace.push(this.id);
	// the property has to increment or decrement
	if(this.properties.value[0] == "-" || this.properties.value[0] == "+")
	{
		if(this.target_type == "agent")
		{
			var f_value = this.facade.getEntityPropertyValue(this.properties.property_to_compare, agent);
			f_value += parseFloat(this.properties.value);
			this.tmp_data = {type:"setProperty", name: this.properties.property_to_compare, value:f_value}
		}
		else
			this.tmp_data = {type:"setProperty", name: this.properties.property_to_compare, value:this.properties.value}
	}
	//just set the property to the value
	else{
		var final_value = this.properties.value;
		if(!isNaN(parseFloat(this.properties.value)))
			final_value = parseFloat(this.properties.value);

		if(this.target_type == "agent")
		{
			this.tmp_data = {type:"setProperty", name: this.properties.property_to_compare, value:final_value}
		}
		else
			this.tmp_data = {type:"setProperty", name: this.properties.property_to_compare, value:final_value}
	}

	this.behaviour.type = B_TYPE.setProperty;
	this.behaviour.setData(this.tmp_data);
	this.behaviour.STATUS = STATUS.success; 
	this.behaviour.priority = this.properties.priority; 
	this.graph.evaluation_behaviours.push(this.behaviour);
	return this.behaviour;
}
//
//SetProperty.prototype.onPropertyChanged = function(name,value)
//{
//    if(name == "motion")
//        this.motion_slider.value = value;
//    
//}
//
//SetProperty.prototype.onConfigure = function(info)
//{
//    onConfig(info, this.graph);
//    // this.data.g_node = this;
//}

LiteGraph.registerNodeType("btree/SetProperty", SetProperty);

/* It just succeeds */
function Succeeder()
{
	this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
	this.boxcolor = "#999";
	this.addInput("","path", {pos:[120*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});	
	this.addProperty("priority", "append", "enum", {
		values: [
			"append",
			"overwrite",
			"mix",
			"skip"
		]
	});
    this.size = [120,20];
    this.editable = { property:"value", type:"number" };
  	this.widgets_up = true;
	this.horizontal = true;
	this.properties = {};
	this.behaviour = new Behaviour();
	this.behaviour.priority = this.properties.priority;

}

Succeeder.prototype.tick = function(agent, dt)
{
	agent.evaluation_trace.push(this.id);
	this.behaviour.type = B_TYPE.succeeder;
	this.behaviour.setData({});
	this.behaviour.STATUS = STATUS.success; 
	this.behaviour.priority = this.properties.priority; 
	this.graph.evaluation_behaviours.push(this.behaviour);
	return this.behaviour;
}

LiteGraph.registerNodeType("btree/Succeeder", Succeeder);

/* For other purposes */

function PoseWeighter()
{
	this.shape = 2;
    this.color = "#727272"
    this.bgcolor = "#8d8d8d";
    this.boxcolor = "#999";
    this.addInput("","path", {pos:[150*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
	this.addOutput("dist","number", {pos:[150,15], dir:LiteGraph.LEFT});
	this.addProperty("intensity", 0.5, "number", {min:0, max:1} );
	this.addProperty("priority", "append", "enum", {
		values: [
			"append",
			"overwrite",
			"mix",
			"skip"
		]
	});
	this.size = [150,30];
    this.editable = { property:"value", type:"number" };
  	this.widgets_up = true;
	// this.horizontal = true;
	this.properties = { target_weight:1, time_at_max:0.5};
	this.flags = { resizable: false };
	this.behaviour = new Behaviour();
	this.behaviour.priority = this.properties.priority;
}

PoseWeighter.prototype.tick = function(agent, dt)
{
	agent.evaluation_trace.push(this.id);
	if(agent.pose_weighter == null || agent.pose_weighter == undefined)
	{
		agent.pose_weighter = 0;
		agent.target_pose_weighter = this.properties.target_weight;
		this.setOutputData(0,agent.pose_weighter);
		this.behaviour.type = B_TYPE.animateSimple;
		this.behaviour.STATUS = STATUS.running;
		this.behaviour.priority = this.properties.priority; 

		return this.behaviour;
	}

	else
	{
		if(agent.pose_weighter > agent.target_pose_weighter)
		{
			//future, go back to 0
			agent.target_pose_weighter = null;
			agent.pose_weighter = null;
			this.behaviour.type = B_TYPE.animateSimple;
			this.behaviour.STATUS = STATUS.success;
			this.behaviour.priority = this.properties.priority; 
			return this.behaviour;
		}
		else
		{
			agent.pose_weighter += dt;
			this.setOutputData(0,agent.pose_weighter);
			this.behaviour.type = B_TYPE.animateSimple;
			this.behaviour.STATUS = STATUS.running;
			this.behaviour.priority = this.properties.priority; 
			return this.behaviour;
		}
	}
}

LiteGraph.registerNodeType("btree/PoseWeighter", PoseWeighter);


/**********************************************************  UtilityAI  **************************************************************/
/* On Progress */
function UtilitySelector()
{
	this.shape = 2;
    this.color = "#1B662D"
    this.bgcolor = "#384837";
    this.boxcolor = "#999";
    this.addInput("","path");
    this.size = [120,20];
    this.editable = { property:"value", type:"number" };
  	this.widgets_up = true;
	this.horizontal = true;
  	this.properties = {};
	this.scores = {};
}

UtilitySelector.prototype.onStart = function()
{
	var children = this.getOutputNodes(0);
	if(!children) return;
	children.sort(function(a,b)
	{
		if(a.pos[0] > b.pos[0])
		{
		  return 1;
		}
		if(a.pos[0] < b.pos[0])
		{
		  return -1;
		}
	});

	this.outputs[0].links = [];
	for(var i in children)
		this.outputs[0].links.push(children[i].inputs[0].link);
}

UtilitySelector.prototype.tick = function(agent, dt)
{
	var children = this.getOutputNodes(0);
	for(let n in children)
	{
		var child = children[n];
		var child_score = child.score();
		this.scores[n] = child_score;
	}
	var high_scored_index = this.getHighestScoredChild();
	var f_child = chilren[high_scored_index];
	var value = f_child.tick(agent, dt);
	if(value.STATUS == STATUS.success)
	{
		if(agent.is_selected)
		{
			var chlid_input_link_id = child.inputs[0].link;
			this.triggerSlot(0, null, chlid_input_link_id);

			if(child.description)
			{
				var graph = child.graph;
				graph.description_stack.push(child.description); 
			} 
		}
		return value;
	}
	this.behaviour.STATUS = STATUS.fail;
	return this.behaviour; 
    
}

UtilitySelector.prototype.getHighestScoredChild = function(agent, dt)
{
	var max = -999999;
	var max_index = 0;
	for(var i in this.scores)
	{
		if(this.scores[i] > max)
		{
			max = this.scores[i];
			max_index = i;
		}
	}
    
}

function MultiBehaviour()
{
	this.shape = 2;
    this.color = "#1B662D"
    this.bgcolor = "#384837";
	this.boxcolor = "#999";
	var w = 200;
	var h = 100;
	this.addInput("","path", {pos:[100,-30], dir:LiteGraph.UP});
	this.addInput("body_gesture","string", {pos:[0,20], dir:LiteGraph.LEFT});
	this.addInput("face_expression","string", {pos:[0,40], dir:LiteGraph.LEFT});
	this.addInput("lookat","vec3", {pos:[0,60], dir:LiteGraph.LEFT});
	this.addInput("time","number", {pos:[0,80], dir:LiteGraph.LEFT});
	this.size = [w,h];
    this.editable = { property:"value", type:"number" };
	this.widgets_up = true;
  	this.properties = {};
}
LiteGraph.registerNodeType("btree/MultiBehaviour", MultiBehaviour);

//LiteGraph.registerNodeType("btree/UtilitySelector", UtilitySelector);

function Parallel()
{
  
    this.shape = 2;
    this.color = "#6e1212";
    this.bgcolor = "#702d2d";
    this.boxcolor = "#999";
    this.addInput("","path");
	this.addOutput("","path");
	this.addProperty( "value", 1.0 );
    this.editable = { property:"value", type:"number" };
    this.data = {}
    this.flags = { horizontal: true };
 	this.horizontal = true;
	this.widgets_up = true;
	this.behaviour = new Behaviour();
}

Parallel.prototype.onStart = Parallel.prototype.onDeselected = function()
{
	var children = this.getOutputNodes(0);
	if(!children) return;
	children.sort(function(a,b)
	{
		if(a.pos[0] > b.pos[0])
		{
		  return 1;
		}
		if(a.pos[0] < b.pos[0])
		{
		  return -1;
		}
	});

	this.outputs[0].links = [];
	for(var i in children)
		this.outputs[0].links.push(children[i].inputs[0].link);
	this.ordered = true;

	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
	
}
Parallel.prototype.tick = function(agent, dt)
{
	this.behaviour.STATUS = STATUS.fail;
	var children = this.getOutputNodes(0);
	for(let n in children)
	{
		var child = children[n];
		var value = child.tick(agent, dt);
	
		if(value && (value.STATUS == STATUS.running || value.STATUS == STATUS.success))
		{
			agent.evaluation_trace.push(this.id);
			this.behaviour.STATUS = STATUS.success;
			//Editor stuff [highlight trace]
			if(agent.is_selected)
				highlightLink(this, child);
			
			if(n == children.length-1)
				return value;
			
			continue;
		}
		if(n == children.length-1 && this.behaviour.STATUS == STATUS.fail)
			return value;
	}
}
LiteGraph.registerNodeType("btree/Parallel", Parallel);

//just leaf nodes
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
	conditional:9
}

/*To encapsulate the result somewhere*/
function Behaviour()
{
	if(this.constructor !== Behaviour)
		throw("You must use new to create a Behaviour");
	this._ctor(  );
}

Behaviour.prototype._ctor = function()
{
	// type can be moveTo, LookAt, setProperty, AnimateSimple...
	this.type = B_TYPE.moveTo;
	this.STATUS = STATUS.success;
	this.data = {};
	this.priority = "append";
	
}

Behaviour.prototype.setData = function( data )
{
	this.data = data;
}

/*******************************************************************************************************************/
/*
* David Moreno - UPF
*/

function Facade ()
{
	
}

/* 
* Receives as a parmaeter a game/system entity, a scene node which is being evaluated
* Returns a vec3 with the position
*/
Facade.prototype.getEntityPosition = function( entity )
{
	console.warn("getEntityPosition() Must be implemented to use HBTree system");
}

Facade.prototype.getEntityOrientation = function( entity )
{
	console.warn("getEntityOrientation() Must be implemented to use HBTree system");
}

Facade.prototype.setEntityProperty = function( entity, name, value )
{
	console.warn("setEntityProperty() Must be implemented to use HBTree system");
}


//For the HBTProperty Node
/*
* Search in all the properties (scene and entity) one with the name passed as a parameter
* Returns the value of the property (int, float or vec3) 
*/
Facade.prototype.getEntityPropertyValue = function( entity, property_name )
{	
	console.warn("getEntityPropertyValue() Must be implemented to use HBTree system");
	//Search for the value of the property "property_name" in the system
}

/*
* Returns an Array of the existing entities in the scene
* The type of the entity is irrelevant
*/
Facade.prototype.getListOfAgents = function(  )
{
	console.warn("getListOfAgents() Must be implemented to use HBTree system");

}
/*
* Check if a concrete entity is in a certain position
* The entity must have a global position (or the possibility to access to it)
* The target can be a vec3 directly or an object containing the position of the target
*/
Facade.prototype.entityInTarget = function( enitity, target, threshold)
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}

//For the Patrol Node
/*
* Check and find the next control point of a path (to patrol)
* If not path, return false
*/
Facade.prototype.checkNextTarget = function( enitity )
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}

//For the EQSNearestInterestPoint Node
/*
* Return the existing types of interest points
*/
Facade.prototype.entityHasProperty = function(  )
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}

//For the EQSNearestInterestPoint Node
/*
* Return all the existing interest points
*/
Facade.prototype.getInterestPoints = function(  )
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}
/*
* @entity: the virtual entity evaluated. The type you are using as an entity 
* @look_at_pos: vec3 with the target position to check if it's seen or not 
* @limit_angle: a number in degrees (field of view)
*/
Facade.prototype.canSeeElement = function( entity, look_at_pos, limit_angle)
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}


Facade.prototype.getAnimation = function( filename)
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}



