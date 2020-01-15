/*
* David Moreno - UPF
*/

/*Structure used in the HBTNodes*/
STATUS = {

	success:0, 
	running:1, 
	fail:2
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

	var hbtgraph = new HBTGraph("By_Default");
	hbtgraph.graph.context = this;
	this.current_graph = hbtgraph;
	this.list_of_graphs[hbtgraph.uid] = hbtgraph;
}

/*
* Function to evaluate what to do
* Returns an object with the status and info about the task to do
*/
HBTContext.prototype.evaluate = function(character, dt)
{
	this.agent_evaluated = character;
	var graph = this.getGraphByName(this.agent_evaluated.hbtgraph);
	this.tmp_result = graph.runBehavior(this.agent_evaluated, dt);
	return this.tmp_result;
}

HBTContext.prototype.addInterestPoint = function( info )
{
	var new_ip = new InterestPoint( info );

	if(!this.interest_points[new_ip.type])
		this.interest_points[new_ip.type] = [];

	this.interest_points[new_ip.type].push( new_ip );
}

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
    }
}

HBTGraph.prototype.runBehavior = function(character, dt, starting_node)
{
	this.graph.character_evaluated = character;

	if(starting_node)
		starting_node.tick;

	else if(this.root_node)
	{
		this.graph.runStep( 1, false );

		this.current_behaviour = this.root_node.tick(this.graph.character_evaluated, dt);
		return this.current_behaviour;
	}
}



/*******************************************************************************************************************/


/****************************************** HBTNodes REPOSITORY ****************************************************/
function HBTproperty()
{
    this.shape = 2;
    this.color = "#907300";
  	this.bgcolor = '#796B31';
    this.boxcolor = "#999";
  	var w = 125;
    var h = 45;
    this.addOutput("value","", {pos:[w,15], dir:LiteGraph.RIGHT});
	this.addOutput("name","string", {pos:[w,35], dir:LiteGraph.RIGHT});
    this.flags = {};
  	this.properties = {value:null};
    this.data = {};
    this.size = [w, h];
	this.widgets_up = true;
  
  	this._node = null;
  	this._component = null;
}

HBTproperty.prototype.onExecute = function()
{
//	console.log(this.graph);
	
	//	Check if its Scene or Agent
	var value = this.graph.context.facade.getEntityPropertyValue( this.title, this.graph.character_evaluated); 

	this.setOutputData(0,value);
	this.setOutputData(1,this.title);
}


HBTproperty.prototype.getEntityPosition = function( entity )
{
	if(entity)
	{
		console.log(entity.scene_node.position)
		return 	entity.scene_node.getGlobalPosition();
	}
}

LiteGraph.registerNodeType("btree/HBTproperty", HBTproperty);


function RootNode()
{
    this.shape = 2;
    this.color = "#1E1E1E"
    this.boxcolor = "#999";
    this.addOutput("","path");
	this.properties = {};
    this.horizontal = true;
	this.widgets_up = true;
}


RootNode.prototype.tick = function(agent, dt)
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
		else if(value && value.STATUS == STATUS.running)
		{
			this.running_node_in_banch = true;
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
	}

	if(this.running_node_in_banch)
			agent.bt_info.running_node_index = null;
	// console.log("Ninguna rama ha tenido exito");
	this.graph.current_behaviour.STATUS = STATUS.fail;
	return this.graph.current_behaviour;
}


RootNode.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
	this.graph.root_node =  this;
}

RootNode.title = "Root";
RootNode.desc = "Start node of the Hybrid Behavior Tree";
//reorder the links
RootNode.prototype.onStart = RootNode.prototype.onDeselected = function()
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
//	console.log(children);
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
    var h = 75;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("value","number", {pos:[0,60], dir:LiteGraph.LEFT});
    this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    // this.size = [w, h];    
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
    this.slider = this.addWidget("string","Threshold", this.properties.limit_value, function(v){ that.properties.limit_value = parseFloat(v); }, this.properties  );

    this.editable = { property:"value", type:"number" };
    this.widgets_up = true;

}

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
	if(this.evaluateCondition && !this.evaluateCondition())
	{
		if(this.running_node_in_banch)
			agent.bt_info.running_node_index = null;

		this.graph.current_behaviour.STATUS = STATUS.fail;
		return this.graph.current_behaviour;
	}
	else if(this.evaluateCondition && this.evaluateCondition())
	{               
		//this.description = this.properties.property_to_compare + ' property passes the threshold';
		var children = this.getOutputNodes(0);
		if(children.length == 0){
			console.log("No Children")
			this.graph.current_behaviour.type = B_TYPE.conditional;
			this.graph.current_behaviour.STATUS = STATUS.success; 
			return this.graph.current_behaviour;
		}
    
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);
			//Value deber�a ser success, fail, o running
			if(value && value.STATUS == STATUS.success)
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
			else if(value && value.STATUS == STATUS.running)
			{
				this.running_node_in_banch = true;
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
		}

		//if this is reached, means that has failed
		
		if(this.running_node_in_banch)
			agent.bt_info.running_node_index = null;

		this.graph.current_behaviour.STATUS = STATUS.fail;
		return this.graph.current_behaviour;
	}
}

Conditional.prototype.evaluateCondition = function()
{
  var result = true;
  switch (this.properties.comparison_type) {
    case ">":
      result = this.properties.value_to_compare > this.properties.limit_value;
      break;
    case "<":
      result = this.properties.value_to_compare < this.properties.limit_value;
      break;
    case "==":
      result = this.properties.value_to_compare == this.properties.limit_value;
      break;
    case "!=":
      result = this.properties.value_to_compare != this.properties.limit_value;
      break;
    case "<=":
      result = this.properties.value_to_compare <= this.properties.limit_value;
      break;
    case ">=":
      result = this.properties.value_to_compare >= this.properties.limit_value;
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
    if(data)
        this.properties.value_to_compare = data;
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
    // this.addInput("value","number", {pos:[0,30], dir:LiteGraph.LEFT});
    this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    // this.size = [w, h];    
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

}

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

		this.graph.current_behaviour.STATUS = STATUS.fail;
		return this.graph.current_behaviour;
	}

	else if(this.evaluateCondition && this.evaluateCondition())
	{   
		this.description = this.properties.property_to_compare + ' property is true';
		var children = this.getOutputNodes(0);

		if(children.length == 0){
			console.log("No Children")
			return STATUS.success;
		}
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);
			//Value deber�a ser success, fail, o running
			if(value && value.STATUS == STATUS.success)
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
			else if(value && value.STATUS == STATUS.running)
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
				this.running_node_in_banch = true;
				return value;
			}
		}

		//if this is reached, means that has failed
		
		if(this.running_node_in_banch)
			agent.bt_info.running_node_index = null;

		this.graph.current_behaviour.STATUS = STATUS.fail;
		return this.graph.current_behaviour;
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
function InTarget()
{
    this.shape = 2;
	this.color= "#233";
	this.bgcolor = "#355",
    this.boxcolor = "#999";
    var w = 200;
    var h = 45;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("target","vec3", {pos:[0,10], dir:LiteGraph.LEFT});
    this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    this.size = [w, h];     
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.data = {threshold:100};
	this.properties = {threshold:250}
    this.widgets_up = true;
}

InTarget.prototype.onStart = InTarget.prototype.onDeselected = function()
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
InTarget.title = "InTarget";
InTarget.desc = "Testing own nodes";

InTarget.prototype.tick = function(agent, dt)
{
	if(this.isInTarget && this.isInTarget(agent))
	{
		this.description = 'Agent in target';
		agent.in_target = true;
		var children = this.getOutputNodes(0);
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);

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
		}
	}
	else{
		this.graph.current_behaviour.STATUS = STATUS.fail;
		return this.graph.current_behaviour;
	
	}
}
InTarget.prototype.isInTarget = function(agent)
{
//	if(this.inTarget(agent, agent.properties.target, this.properties.threshold))
	if(this.graph.context.facade.entityInTarget(agent, agent.properties.target, this.properties.threshold))
	{
		// check if the target is in some special list and  some properties to apply to
		// the agent or to the blackboard
		if(CORE && CORE.Scene)
		{
			CORE.Scene.applyTargetProperties(agent.properties.target, agent);
			return true;
		}
	}
	else
		return false;
}

InTarget.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}
// LiteGraph.registerNodeType("btree/InTarget", InTarget);

/*******************************************************************************************************************/
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

}

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
			else if(value && value.STATUS == STATUS.running)
			{
				this.running_node_in_banch = true;
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
		}		

	}
	else
	{
		if(this.running_node_in_banch)
		{
			agent.bt_info.running_node_index = null;
		}
		agent.properties.look_at_pos = null;
		this.graph.current_behaviour.STATUS = STATUS.fail;
		return this.graph.current_behaviour;
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
	
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
	
}
Sequencer.prototype.tick = function(agent, dt)
{
	/* means that there is some node on running state */
	if(agent.bt_info.running_node_index != null && agent.bt_info.running_node_id == this.id)
	{
		var children = this.getOutputNodes(0);
		var child = children[agent.bt_info.running_node_index];
		var value = child.tick(agent, dt);
		if(value && value.STATUS == STATUS.running)
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
			// value.STATUS = STATUS.success;
			return value;
		}
		if(agent.bt_info.running_node_index == children.length-1 && value && value.STATUS == STATUS.success)
		{
			agent.bt_info.running_node_index = null;
			agent.bt_info.running_node_id = null;
			// value.STATUS = STATUS.success;
			return value;
		}
		if(value && value.STATUS == STATUS.success )
		{
			agent.bt_info.running_node_index ++;
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
			value.STATUS = STATUS.success;
			return value;
		}
		//Value deber�a ser success, fail, o running
		if(value && value.STATUS == STATUS.fail){
			agent.bt_info.running_node_index = null;
			return value;
		}
	}

	else
	{
		var children = this.getOutputNodes(0);
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);
			if(value && value.STATUS == STATUS.running)
			{
				if(agent.bt_info.running_node_index && agent.bt_info.running_node_id != this.id)
					this.running_node_in_banch = true;
				else
				{
					agent.bt_info.running_node_index = parseInt(n);
					agent.bt_info.running_node_id = this.id;
				}
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
				// value.STATUS = STATUS.success;
				return value;
			}
			if(value && value.STATUS == STATUS.success)
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
			}
			if(n == children.length-1 && value && value.STATUS == STATUS.success && agent.bt_info.running_node_index == null)
				return value;
			//Value deber�a ser success, fail, o running
			if(value && value.STATUS == STATUS.fail)
			{
				if(this.running_node_in_banch)
					agent.bt_info.running_node_index = null;

				return value;
			}
		}
	}
}
//Sequencer.prototype.onDrawBackground = function(ctx, canvas)
//{
//
//}

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

Selector.prototype.tick = function(agent, dt)
{
	// var children = this.getOutputNodes(0);
	// for(let n in children)
	// {
	// 	var child = children[n];
	// 	var value = child.tick(agent, dt);
	// 		//Value deber�a ser success, fail, o running
	// 	if(value.STATUS == STATUS.success){
	// 		if(agent.is_selected)
	// 		{
	// 			var chlid_input_link_id = child.inputs[0].link;
	// 			this.triggerSlot(0, null, chlid_input_link_id);

	// 			if(child.description)
	// 			{
	// 				var graph = child.graph;
	// 				graph.description_stack.push(child.description); 
	// 			} 
	// 		}
	// 		return value;
	// 	}
	// }
	// // console.log("Ninguna rama ha tenido exito");
	// this.graph.current_behaviour.STATUS = STATUS.fail;
	// return this.graph.current_behaviour; //placeholder ta que lo pensemos bien

	if(agent.bt_info.running_node_index != null && agent.bt_info.running_node_id == this.id)
	{
		var children = this.getOutputNodes(0);
		var child = children[agent.bt_info.running_node_index];
		var value = child.tick(agent, dt);
		if(value.STATUS == STATUS.running)
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
			// value.STATUS = STATUS.success;
			return value;
		}
		if(value.STATUS == STATUS.success )
		{
			agent.bt_info.running_node_index = null;
			agent.bt_info.running_node_id = null;
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
			value.STATUS = STATUS.success;
			return value;
		}
		//Value deber�a ser success, fail, o running
		if(value.STATUS == STATUS.fail){
			agent.bt_info.running_node_index = null;
			return value;
		}
	}

	else
	{
		var children = this.getOutputNodes(0);
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);
			if(value.STATUS == STATUS.running)
			{
				//in case there is a sequencer or selector in running state in lower levels
				if(agent.bt_info.running_node_index && agent.bt_info.running_node_id != this.id)
				{
					this.running_node_in_banch = true;
				}
				else{

					agent.bt_info.running_node_index = parseInt(n);
					agent.bt_info.running_node_id = this.id;
				}

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
				// value.STATUS = STATUS.success;
				return value;
			}
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
			//Value debera ser success, fail, o running	
		}
		this.graph.current_behaviour.STATUS = STATUS.fail;
		return this.graph.current_behaviour; //placeholder ta que lo pensemos bien
	}
    
}
//Selector.prototype.onDrawBackground = function(ctx, canvas)
//{
//
//}

Selector.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}

// Selector.prototype.onConfigure = bl();
LiteGraph.registerNodeType("btree/Selector", Selector);

function MoveToLocation()
{
    this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    var w = 200;
    var h = 45;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("target","vec3", {pos:[0,10], dir:LiteGraph.LEFT});
    this.size = [w, h];    
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.data = {target:null, motion:1}
	this.widgets_up = true;
	this.facade = null;
	this.target_to_draw = null;
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
		if(this.facade.entityInTarget && this.facade.entityInTarget(agent, this.properties.target, 200))
		{
			//build and return success
//			console.log("a");
			this.graph.current_behaviour.type = B_TYPE.moveTo;
			this.graph.current_behaviour.STATUS = STATUS.success;
//			this.graph.current_behaviour.setData(behaviour);
			return this.graph.current_behaviour;
		}
		else
		{
			//build and return running
			this.graph.current_behaviour.type = B_TYPE.moveTo;
			this.graph.current_behaviour.STATUS = STATUS.running;
//			this.graph.current_behaviour.setData(behaviour);
			return this.graph.current_behaviour;
		}
		agent.properties.target = this.properties.target;
		this.description = 'Target updated: New destination set to the input';

		this.graph.current_behaviour.type = B_TYPE.MoveToLocation;
		this.graph.current_behaviour.STATUS = STATUS.success;
		this.graph.current_behaviour.setData(this.properties.target);
		// console.log(agent);
		return this.graph.current_behaviour;
	}
	return STATUS.fail;
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
    this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    var w = 200;
    var h = 35;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    // this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    this.size = [w, h];    
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.data = {};
  	this.horizontal = true;
    this.widgets_up = true;


}

FindNextTarget.title = "FindNextTarget ";

FindNextTarget.prototype.tick = function(agent, dt)
{
	if(this.findNextTarget && !this.findNextTarget(agent))
	{
		this.graph.current_behaviour.STATUS = STATUS.fail;
		return this.graph.current_behaviour;
	}
	else
	{   
		this.description = ' Next waypoint of the path found';

		// var g_child = child.g_node;
		// var chlid_input_link_id = g_child.inputs[0].link;
		// this.g_node.triggerSlot(0, null, chlid_input_link_id);
		this.graph.current_behaviour.type = B_TYPE.nextTarget;
		this.graph.current_behaviour.STATUS = STATUS.success;
		this.graph.current_behaviour.setData({});
		return this.graph.current_behaviour;
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
    this.size = [200,45];
    this.editable = { property:"value", type:"number" };
    this.flags = { horizontal: true };
    this.horizontal = true;
    this.widgets_up = true;
    this.data = {}
    var that = this;

    this.properties = {
		total_time:5, 
    };
    // this.size = [80,60];
    this.slider = this.addWidget("number","Time to wait", this.properties.total_time, function(v){ that.properties.total_time = v; that.properties.total_time = v; }, this.properties  );
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

	if(!agent.waiting_time){
		agent.waiting_time = this.properties.total_time;
		agent.current_waiting_time = 0;
		this.graph.current_behaviour.type = B_TYPE.animateSimple;
		this.graph.current_behaviour.STATUS = STATUS.running;
//		this.graph.current_behaviour.setData(behaviour);
		return this.graph.current_behaviour;
	}

	else{
		if(agent.current_waiting_time > agent.waiting_time)
		{
			agent.waiting_time = null;
			agent.current_waiting_time = 0;
			this.graph.current_behaviour.type = B_TYPE.animateSimple;
			this.graph.current_behaviour.STATUS = STATUS.success;
//			this.graph.current_behaviour.setData(behaviour);
			return this.graph.current_behaviour;
		}
		else{
			agent.current_waiting_time += dt;

			this.graph.current_behaviour.type = B_TYPE.animateSimple;
			this.graph.current_behaviour.STATUS = STATUS.running;
//			this.graph.current_behaviour.setData(behaviour);
			return this.graph.current_behaviour;
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
    this.shape = 2;
	this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
	this.addInput("","path");
	
    //this.addProperty( "value", 1.0 );
    // this.size = [200,80];
    this.editable = { property:"value", type:"number" };
  	this.widgets_up = true;
	this.horizontal = true;
  	this.properties = {anims:[{name:null, weight: 1}], motion:0, speed:1, src:"david8more/projects/SAUCE/Animations/", filename:""};
  	var that = this;
    this.widget = this.addWidget("string","", this.properties.filename, function(v){ that.properties.filename = v.toLowerCase(); }, this.properties  );
  	this.number = this.addWidget("number","motion", this.properties.motion, function(v){ that.properties.motion = v; }, this.properties  );
	this.number2 = this.addWidget("number","speed", this.properties.speed, function(v){ that.properties.speed = v; }, this.properties  );
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
  
//   if(agent.animationBlender)
//   {
  	if(this.action)
	{
      this.description = 'Playing ' + this.properties.anims[0].anim;
      return this.action(agent);
	}
//   }
}

SimpleAnimate.prototype.action = function(agent)
{
	var animation = animation_manager.animations[this.properties.filename.toLowerCase()];
	animation.weight = 1;
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

	this.graph.current_behaviour.type = B_TYPE.animateSimple;
	this.graph.current_behaviour.STATUS = STATUS.success;
	this.graph.current_behaviour.setData(behaviour);
	console.log(behaviour);
	agent.animationBlender.applyBehaviour(behaviour);
//	agent.animator._base_animation._animation = this.properties.src + this.properties.filename;
	return this.graph.current_behaviour;
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

function Action()
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
  	this.properties = {anims:[{name:null, weight: 1}], translation_enabled:true, speed:1, src:"david8more/projects/SAUCE/Animations/", filename:""};
  	var that = this;
    this.widget = this.addWidget("string","", this.properties.filename, function(v){ that.properties.filename = v.toLowerCase(); }, this.properties  );
//  	this.number = this.addWidget("number","motion", this.properties.motion, function(v){ that.properties.motion = v; }, this.properties  );
//	this.toggle = this.addWidget("toggle","Translation:", this.properties.translation_enabled, function(v){ console.log(v);that.properties.translation_enabled = v; }, this.properties  );
	this.number2 = this.addWidget("number","speed", this.properties.speed, function(v){ that.properties.speed = v; }, this.properties  );
}

Action.title = "Action ";

Action.prototype.onDeselected = function()
{
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}

Action.prototype.tick = function(agent, dt)
{
  if(agent.animationBlender)
  {
  	if(this.action)
	{
      this.description = 'Playing ' + this.properties.anims[0].anim;
      return this.action(agent);
	}
  }
}    

Action.prototype.action = function(agent)
{
	var animation = animation_manager.animations[this.properties.filename.toLowerCase()];
	animation.weight = 1;
	var behaviour = {
		animation_to_merge: animation,
		speed: this.properties.speed,
		type: this.type,
		author: "DaVinci"
	};
	
//	LEvent.trigger( agent, "applyBehaviour", behaviour);

	this.graph.current_behaviour.type = B_TYPE.action;
	this.graph.current_behaviour.STATUS = STATUS.success;
	this.graph.current_behaviour.setData(behaviour);
	agent.animationBlender.applyBehaviour(behaviour);
//	agent.animator._base_animation._animation = this.properties.src + this.properties.filename;
	return this.graph.current_behaviour;
}

Action.prototype.onPropertyChanged = function(name,value)
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


Action.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;
}

LiteGraph.registerNodeType("btree/Action", Action);

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
  	this.properties = {anims:[{name:null, weight: 1}], translation_enabled:true, speed:1, src:"david8more/projects/SAUCE/Animations/", filename:""};
	this.facade = null;
}

Patrol.prototype.onDeselected = function()
{
	var parent = this.getInputNode(0);
	if(parent)
		parent.onDeselected();
}

Patrol.prototype.tick = function( agent )
{
	if(this.isInTarget && this.isInTarget( agent ))
	{
		if(this.findNextTarget && this.findNextTarget(agent))
		{
			this.description = 'Agent in target';
			this.graph.current_behaviour.type = B_TYPE.nextTarget;
			this.graph.current_behaviour.STATUS = STATUS.success;
			this.graph.current_behaviour.setData({});
			return this.graph.current_behaviour;
		}
	}
	else
	{
		this.description = 'Agent patroling';
		this.graph.current_behaviour.STATUS = STATUS.success;
		return this.graph.current_behaviour;
	
	}
}

Patrol.prototype.isInTarget = function( agent )
{
	//in the FUTURE: this.graph.context.facade.entityInTarget(agent, target, threshold)
	if(this.facade == null)
	{
		this.facade = this.graph.context.facade;
		return;
	}

	if(this.facade.entityInTarget(agent, agent.properties.target, 100))
	{
		//if the target has som interesting properties, apply them to the agent
		this.facade.applyTargetProperties(agent.properties.target, agent);
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

}

EQSNearestInterestPoint.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    ctx.fillText(`List evaluated`,10,15);
}

EQSNearestInterestPoint.prototype.onExecute = function()
{
    // debugger;
	if(this.facade == null)
	{
		this.facade = this.graph.context.facade;
		return;
	}

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
}

EQSNearestAgent.prototype.onExecute = function()
{
	if(this.facade == null)
	{
		this.facade = this.graph.context.facade;
		return;
	}

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
	switch (this.properties.comparison_type) {
		case ">":
			result = entity.properties[this.properties.prop] > this.properties.value;
			break;
		case "<":
			result = entity.properties[this.properties.prop] < this.properties.value;
			break;
		case "==":
			result = entity.properties[this.properties.prop] == this.properties.value;
			break;
		case "!=":
			result = entity.properties[this.properties.prop] != this.properties.value;
			break;
		case "<=":
			result = entity.properties[this.properties.prop] <= this.properties.value;
			break;
		case ">=":
			result = entity.properties[this.properties.prop] >= this.properties.value;
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

function LookAt()
{
    this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    var w = 200;
    var h = 65;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("target","vec3", {pos:[0,10], dir:LiteGraph.LEFT});
    this.size = [w, h];    
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.properties = {look_at:null}
    this.widgets_up = true;
}

LookAt.prototype.tick = function(agent, dt)
{
	this.graph.current_behaviour.type = B_TYPE.lookAt;
	this.graph.current_behaviour.setData(this.properties.look_at.pos);
	this.graph.current_behaviour.STATUS = STATUS.success; 

	agent.properties.look_at_pos = this.properties.look_at.pos;
	this.description = 'Look At updated: New look at position set to the input';
	return this.graph.current_behaviour;
}
LookAt.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    ctx.fillText(`Look at Node`,10,40);
}

LookAt.prototype.onExecute = function(ctx, canvas)
{
    var data = this.getInputData(1);
    if(data)
        this.properties.look_at = data;
}

LookAt.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}
LiteGraph.registerNodeType("btree/LookAt", LookAt);

function SetMotionVelocity()
{
	this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
	var w = 200;
    var h = 65;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
	this.addInput("","number", {pos:[0,35], dir:LiteGraph.LEFT});
    this.size = [w,h];
    this.editable = { property:"value", type:"number" };
  
  	this.properties = {motion:1.0};
  	var that = this;
  	this.motion_slider = this.addWidget("number","velocity", this.properties.motion, function(v){ that.properties.motion = v; }, this.properties  );
	this.widgets_up = true;
//	this.horizontal = true;
	this.flags = { resizable: false };
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
  
	this.graph.current_behaviour.type = B_TYPE.lookAt;
	this.graph.current_behaviour.setData(this.properties.motion);
	this.graph.current_behaviour.STATUS = STATUS.success; 
	return this.graph.current_behaviour;
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

//select type, property and value 
function SetProperty()
{
	this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    this.addInput("","path");
	this.addInput("","", {pos:[0,40], dir:LiteGraph.LEFT});
    //this.addProperty( "value", 1.0 );
    this.size = [200,60];
    this.editable = { property:"value", type:"number" };
  	this.widgets_up = true;
	this.horizontal = true;
  	this.properties = {value:1.0};
  	var that = this;
	this.dynamic = null;
	this.widget_type = "number";
	this.target_type = "agent";
	this.dynamic = this.addWidget("string","value", 5, function(v){ that.properties.value = v; }, this.properties );
	this.tmp_data = {};
	this.facade = null;
}

SetProperty.prototype.onExecute = function()
{
    var data = this.getInputData(1);
    if(data)
        this.properties.property_to_compare = data;
	
	if(!this.graph.character_evaluated) return;
	if(this.graph.character_evaluated.properties[data])
	{	
		this.target_type = "agent";
	}
	else if(blackboard[data])
	{
		this.target_type = "global";
	}
}


SetProperty.prototype.tick = function(agent, dt)
{
	if(this.facade == null)
	{
		this.facade = this.graph.context.facade;
		return;
	}
	
	if(this.properties.value[0] == "-")
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
	else if(this.properties.value[0] == "+")
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
	else{

		if(this.target_type == "agent")
		{
			this.tmp_data = {type:"setProperty", name: this.properties.property_to_compare, value:this.properties.value}
		}
		else
			this.tmp_data = {type:"setProperty", name: this.properties.property_to_compare, value:this.properties.value}
	}

	this.graph.current_behaviour.type = B_TYPE.setProperties;
	this.graph.current_behaviour.setData(this.tmp_data);
	this.graph.current_behaviour.STATUS = STATUS.success; 
	return this.graph.current_behaviour;
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


function Succeeder()
{
	this.shape = 2;
    this.color = "#2e542e"
    this.bgcolor = "#496b49";
    this.boxcolor = "#999";
    this.addInput("","path");
    this.size = [120,20];
    this.editable = { property:"value", type:"number" };
  	this.widgets_up = true;
	this.horizontal = true;
  	this.properties = {};
}

Succeeder.prototype.tick = function(agent, dt)
{
	this.graph.current_behaviour.type = B_TYPE.succeeder;
	this.graph.current_behaviour.setData({});
	this.graph.current_behaviour.STATUS = STATUS.success; 
	return this.graph.current_behaviour;
}

LiteGraph.registerNodeType("btree/Succeeder", Succeeder);


/**********************************************************  UtilityAI  **************************************************************/
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
	// console.log("Ninguna rama ha tenido exito");
	this.graph.current_behaviour.STATUS = STATUS.fail;
	return this.graph.current_behaviour; //placeholder ta que lo pensemos bien
    
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

//LiteGraph.registerNodeType("btree/UtilitySelector", UtilitySelector);



var B_TYPE = 
{
	moveTo:0, 
	lookAt:1,
	animateSimple:2, 
	wait:3, 
	nextTarget:4,
	setMotion:5, 
	setProperties:6, 
	succeeder:7, 
	action:8
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
	
}

Behaviour.prototype.setData = function( data )
{
	this.data = data;
}

/*******************************************************************************************************************/

