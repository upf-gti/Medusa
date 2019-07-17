
STATUS = {

	success:1, 
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
    this.bbvariables = ["stress", "rain", "temperature", "light", "noise"];
    this.area = [-2500,-2500,2500,2500];
}

Blackboard.prototype.setArea = function(p1, p2, p3, p4)
{
    this.area = [p1, p2, p3, p4];
}

/*************************************************** END OF BLACKBOARD *****************************************************************/


function HBTEditor( )
{
  if(this.constructor !== HBTEditor)
	 throw("You must use new to create a HBTEditor");
	this._ctor();
}

HBTEditor.prototype._ctor = function()
{
	this.name = "HybridBehaviorTree";
    this.node_pool = [];
    this.context2 = null;
    this.canvas2D = null;
    this.graph = null;
    this.graph_canvas = null;
    this.time = 0;
    this.last_time = 0;
	this.root_node = null;
}
HBTEditor.prototype.init = function()
{
    this.canvas2D = document.createElement("canvas");
    this.context2 = this.canvas2D.getContext("2d");
    var HBTEditor_cont = document.getElementById("graph-canvas");
    this.canvas2D.width = HBTEditor_cont.clientWidth;
    this.canvas2D.height = HBTEditor_cont.clientHeight;
    this.canvas2D.id = "HBTEditor"
    HBTEditor_cont.appendChild(this.canvas2D);
    LiteGraph.NODE_TITLE_COLOR = "#DDD";
    LiteGraph.NODE_TEXT_COLOR = "#DDD"

    this.graph = new LGraph();
	this.createInitGraph();
    this.graph.description_stack = [];

    var that = this;
    this.graph.onNodeAdded = function(node)
    {
		if(node.type == "btree/Root")
			that.graph.root_node = node;
    }

    this.graph_canvas = new LGraphCanvas(this.canvas2D , this.graph);
    this.graph_canvas.default_link_color = "#98bcbe";
    // console.log(this.root_node);

    this.graph_canvas.onNodeSelected = function(node)
    {
        console.log(node);
        current_graph_node = node;
        // CORE.GUI.showNodeInfo(node);
    }

    this.graph_canvas.onNodeDeselected = function(node)
    {
        console.log(node);
    }

    this.graph_canvas.onDropItem = function( data )
    { 
        var type = data.dataTransfer.getData("type");
		var name = data.dataTransfer.getData("name");
//        var properties = data.dataTransfer.getData("obj");
//        properties = JSON.parse(properties);
        that.addNodeByType(type, name, [data.canvasX,data.canvasY]); 
    }

    /*************** Draww summary of what is happening on the tree *****************/
    this.graph_canvas.onDrawOverlay = function( ctx )
    {
        if( this.graph.description_stack.length > 0 )
        {
            var array_of_messages = node_editor.graph.description_stack;
            // ctx.strokeStyle = "#333333";
            // ctx.strokeRect(70, 2, 250, ((array_of_messages.length)*25));
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(70, 2, 275, ((array_of_messages.length)*25)); 

            ctx.font = "12px Arial";
            ctx.fillStyle  = "#888888";
            if(array_of_messages)
                for (var i = array_of_messages.length-1; i >= 0; i-- )
                {
                    var h = Math.abs(i-(array_of_messages.length-1));
                    ctx.fillText(array_of_messages[i].capitalize(), 80, (15 + h*25)); 
                }
            ctx.closePath();
        }
    }
}

LGraph.prototype.runBehavior = function(character, dt, starting_node)
{
	this.character_evaluated = character;
//	this.scene = scene;25/03/201

	if(starting_node)
		starting_node.tick;

	else if(this.root_node)
	{
		this.runStep(1, false);

		this.root_node.tick(this.character_evaluated, dt);
	}
		
}

HBTEditor.prototype.createInitGraph = function()
{
	var initial = JSON.parse(CORE.Scene.initial_behaviour["InitialDemo"])
	this.graph.configure(initial.behavior);
}

HBTEditor.prototype.addNodeByType = function(type, properties, pos)
{
    switch(type){
		case "HBTProperty":{
			var graphnode = LiteGraph.createNode( "btree/HBTproperty" );
			var title = properties;
			graphnode.title = title;
			graphnode.pos = pos;
			graphnode.setProperty( "property_name", title );
			node_editor.graph.add(graphnode);

		} break;
        case "action":{
            var node_leaf = LiteGraph.createNode("btree/SimpleAnimate");
            node_leaf.properties = properties;
            node_leaf.pos = pos;
            // node_leaf.data.g_node = node_leaf;
            node_editor.graph.add(node_leaf);
        } break;

        case "intarget":{
            var node_cond = LiteGraph.createNode("btree/InTarget");
            node_cond.properties = properties;
            node_cond.pos = pos;
            // node_cond.data.g_node = node_cond;
            node_editor.graph.add(node_cond);
        } break;
//        case "sequencer":{
//            var node_seq = LiteGraph.createNode("btree/Sequencer");
//            node_seq.data = properties;
//            node_seq.pos = pos;
//            // node_seq.data.g_node = node_seq;
//            node_editor.graph.add(node_seq);
//        } break;

        case "bool":{
            var node_cond = LiteGraph.createNode("btree/BoolConditional");
            node_cond.properties.property_to_compare = properties.property_to_compare;
            node_cond.pos = pos;
            // node_cond.data.g_node = node_cond;
            node_editor.graph.add(node_cond);
        } break;
        default:{
            var node_cond = LiteGraph.createNode("btree/Conditional");
            node_cond.properties.property_to_compare = properties.property_to_compare;
            node_cond.pos = pos;
            // node_cond.data.g_node = node_cond;
            node_editor.graph.add(node_cond);
        } break;
    }
}

function HBTproperty()
{
    this.shape = 2;
    this.color = "#907300";
  	this.bgcolor = '#796B31';
    this.boxcolor = "#999";
  	var w = 125;
    var h = 25;
    this.addOutput("","number", {pos:[w,15], dir:LiteGraph.RIGHT});
    this.flags = {};
  	this.properties = {value:null};
    this.data = {};
    this.size = [w, h];
    this.horizontal = true;
	this.widgets_up = true;
  
  	this._node = null;
  	this._component = null;
}

HBTproperty.prototype.onExecute = function()
{
	console.log(this.graph);
	var value = null;
	//	Check if its Scene or Agent
	if(CORE.Scene.bprops.includes(this.title))
	{
		value = CORE.Scene.zones["zone1"][this.title];
	}
	else
	{
		if(this.graph.character_evaluated)
			value = this.graph.character_evaluated.properties[this.title];
	}

//	this.properties.value = this.graph.character_evaluated.

	this.setOutputData(0,value);
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
		if(value == STATUS.success)
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
	// console.log("Ninguna rama ha tenido exito");
	return STATUS.fail; //placeholder ta que lo pensemos bien
}


RootNode.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
	this.graph.root_node =  this;
}

RootNode.title = "Root";
RootNode.desc = "Start node of the Hybrid Behavior Tree";
//reorder the links
RootNode.prototype.onStart = function()
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
  console.log(children);
  for(var i in children)
  {
    this.outputs[0].links.push(children[i].inputs[0].link);
  }
}

LiteGraph.registerNodeType("btree/Root", RootNode);

/*******************************************************************************************************************/
function Conditional()
{
    this.shape = 2;
    this.color = "#005557";
    this.bgcolor = "#2d4243";
    this.boxcolor = "#999";
    this.data = {}
    var w = 200;
    var h = 85;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("value","number", {pos:[0,60], dir:LiteGraph.LEFT});
    this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
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
        // console.log(CORE.Scene.properties.interest_points);
        return [">","<","==", "!=", "<=", ">="];
    }} ); 
    this.slider = this.addWidget("slider","Threshold", this.properties.limit_value, function(v){ that.properties.limit_value = v; }, this.properties  );

    this.editable = { property:"value", type:"number" };
    this.widgets_up = true;

}

Conditional.prototype.onStart = function()
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
  {
    this.outputs[0].links.push(children[i].inputs[0].link);
  }
}

Conditional.title = "Conditional"
Conditional.desc = "Compares an input or a property value with a threshold";	

Conditional.prototype.tick = function(agent, dt )
{
	if(this.evaluateCondition && !this.evaluateCondition())
            return STATUS.fail;
	else if(this.evaluateCondition && this.evaluateCondition())
	{               
		//this.description = this.properties.property_to_compare + ' property passes the threshold';
		var children = this.getOutputNodes(0);
		if(children.length == 0){
			console.log("No Children")
			return STATUS.success;
		}
    
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);
			//Value debería ser success, fail, o running
			if(value == STATUS.success)
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
		return STATUS.fail;
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
    this.color = "#005557";
    this.bgcolor = "#2d4243";
    this.boxcolor = "#999";
    this.data = {title:"", property_to_compare:"", value_to_compare:null, bool_state:true}
    var w = 200;
    var h = 65;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("value","boolean", {pos:[0,40], dir:LiteGraph.LEFT});
    // this.addInput("value","number", {pos:[0,30], dir:LiteGraph.LEFT});
    this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
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

}

BoolConditional.prototype.onStart = function()
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
  {
    this.outputs[0].links.push(children[i].inputs[0].link);
  }
}

BoolConditional.title = "BoolConditional"
BoolConditional.desc = "Success if the boolean parameter is equal to the widget toggle";

BoolConditional.prototype.tick = function(agent, dt )
{
	if(this.evaluateCondition && !this.evaluateCondition())
            return STATUS.fail;

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
			//Value debería ser success, fail, o running
			if(value == STATUS.success)
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
		return STATUS.fail;
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
    // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
    //ctx.fillText(`Property: ${this.data.property_to_compare}`,10,65);
    // if(this.data.limit_value)
    //     ctx.fillText(`Threshold: ${this.data.limit_value}`,10,55);
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
    if(data)
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
    this.color = "#005557";
    this.bgcolor = "#2d4243";
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
		this.properties = {threshold:100}
    this.widgets_up = true;
}
InTarget.prototype.onStart = function()
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
  {
    this.outputs[0].links.push(children[i].inputs[0].link);
  }
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

			if(value == STATUS.success)
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
	else
		return STATUS.fail;
}
InTarget.prototype.isInTarget = function(agent)
{
	if(this.inTarget(agent, agent.properties.target, this.properties.threshold))
	{
		// check if the target is in some special list and  some properties to apply to
		// the agent or to the blackboard
		CORE.Scene.applyTargetProperties(agent.properties.target, agent);
		return true;
	}
	else
		return false;
}

InTarget.prototype.inTarget = function( agent, target, threshold)
{
	var current_pos = []; 
	current_pos[0] = agent.skeleton.skeleton_container.getGlobalPosition()[0];
	current_pos[1] = agent.skeleton.skeleton_container.getGlobalPosition()[2];

	var a = vec2.fromValues(current_pos[0],current_pos[1]);
	var b = vec2.fromValues(target.pos[0],target.pos[2]);
	
	var dist = vec2.distance(a,b);
	// console.log("dist", dist);

	if(dist < threshold)
	{
		for(var i  in agent.path)
			if(agent.path[i].id == target.id)
				agent .path[i].visited = true;
		
		return true;
	} 
	return false;
}

InTarget.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}



LiteGraph.registerNodeType("btree/InTarget", InTarget);

/*******************************************************************************************************************/
function LineOfSight()
{
    this.shape = 2;
    this.color = "#005557";
    this.bgcolor = "#2d4243";
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

}

LineOfSight.prototype.onStart = function()
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
  {
    this.outputs[0].links.push(children[i].inputs[0].link);
  }
}

LineOfSight.prototype.tick = function(agent, dt)
{
	var lookat = this.properties.look_at;
	if(agent.canSeeElement(lookat, this.properties.limit_angle))
	{
		this.description = 'Agent can see the input';
		var children = this.getOutputNodes(0);
		for(let n in children)
		{
			var child = children[n];
			var value = child.tick(agent, dt);

			//Value debería ser success, fail, o running
			if(value == STATUS.success)
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
				return STATUS.success;
			}
		}
	}
	else
	{
		agent.properties.look_at_pos = null;
		return STATUS.fail;
	}
}

LineOfSight.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    ctx.fillText(`Agent looks at the input position`,10,35);
}

// CanSee.prototype.onDblClick = function(node)
// {
//     CORE.GUI.showNodeInfo(this);
// }

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
    this.color = "#6F0E12";
    this.bgcolor = "#3f2c2c";
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
Sequencer.prototype.onStart = function()
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
  {
    this.outputs[0].links.push(children[i].inputs[0].link);
  }
}
Sequencer.prototype.tick = function(agent, dt)
{
	/* means that there is some node on running state */
	if(agent.bt_info.running_node_index != null)
	{
    var children = this.getOutputNodes(0);
    var child = children[agent.bt_info.running_node_index];
		var value = child.tick(agent, dt);
		if(value == STATUS.running)
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
			return STATUS.success;
		}
		if(agent.bt_info.running_node_index == this.children.length-1 && value == STATUS.success)
		{
			agent.bt_info.running_node_index = null;
			return STATUS.success;
		}
		if(value == STATUS.success )
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
		}
		//Value debería ser success, fail, o running
		if(value == STATUS.fail){
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
			if(value == STATUS.running)
			{
				agent.bt_info.running_node_index = parseInt(n);
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
				return STATUS.success;
			}
			if(value == STATUS.success)
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
			if(n == children.length-1 && value == STATUS.success && agent.bt_info.running_node_index == null)
				return STATUS.success;
			//Value debería ser success, fail, o running
			if(value == STATUS.fail)
				return value;
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
    this.color = "#6F0E12";
    this.bgcolor = "#3f2c2c";
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
Selector.prototype.onStart = function()
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
  {
    this.outputs[0].links.push(children[i].inputs[0].link);
  }
}
Selector.prototype.tick = function(agent, dt)
{
	var children = this.getOutputNodes(0);
  for(let n in children)
  {
    var child = children[n];
    var value = child.tick(agent, dt);
		//Value debería ser success, fail, o running
		if(value == STATUS.success){
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
	// console.log("Ninguna rama ha tenido exito");
	return STATUS.fail; //placeholder ta que lo pensemos bien
    
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


function MoveTo()
{
    this.shape = 2;
    this.color = "#1B662D"
    this.bgcolor = "#384837";
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


}

MoveTo.title = "MoveTo ";

MoveTo.prototype.tick = function(agent, dt)
{
	if(this.properties.target){
		agent.properties.target = this.properties.target;
		this.description = 'Target updated: New destination set to the input';

		// console.log(agent);
		return STATUS.success;
	}
	return STATUS.fail;
}
MoveTo.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
    if(this.properties.target)
        ctx.fillText(`move to: ${this.properties.target.pos}`,10,35);
    // ctx.fillText(`Motion speed: ${this.data.motion}`,10,55);
}
MoveTo.prototype.onExecute = function()
 {
    var data = this.getInputData(1);
    if(data)
        this.properties.target = data;

}
MoveTo.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;

}

LiteGraph.registerNodeType("btree/MoveTo", MoveTo);

function FindNextTarget()
{
    this.shape = 2;
    this.color = "#1B662D"
    this.bgcolor = "#384837";
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
            return STATUS.fail;
	else
	{   
		this.description = ' Next waypoint of the path found';

		// var g_child = child.g_node;
		// var chlid_input_link_id = g_child.inputs[0].link;
		// this.g_node.triggerSlot(0, null, chlid_input_link_id);
		return STATUS.success;
	}
}

FindNextTarget.prototype.findNextTarget = function(agent)
{
	//find nearest agent
	if(agent.checkNextTarget())
	{
		agent.properties.target = agent.checkNextTarget();
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
    this.color = "#1B662D"
    this.bgcolor = "#384837";
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

Wait.prototype.tick = function(agent, dt)
{
	this.description = 'Waiting ' + this.properties.total_time + ' seconds ';

	if(!agent.waiting_time){
		agent.waiting_time = this.properties.total_time;
		agent.current_waiting_time = 0;
		return STATUS.running;
	}

	else{
		if(agent.current_waiting_time > agent.waiting_time)
		{
			agent.waiting_time = null;
			agent.current_waiting_time = 0;
			return STATUS.success;
		}
		else{
			agent.current_waiting_time += dt;
			return STATUS.running;
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
    this.color = "#1B662D"
    this.bgcolor = "#384837";
    this.boxcolor = "#999";
    this.addInput("","path");
    //this.addProperty( "value", 1.0 );
    this.size = [200,80];
    this.editable = { property:"value", type:"number" };
  	this.widgets_up = true;
	this.horizontal = true;
  	this.properties = {anims:[{name:null, weight: 1}], motion:0, speed:1, src:"david8more/projects/SAUCE/Animations/", filename:"Walking"};
  	var that = this;
    this.widget = this.addWidget("string","", this.properties.filename, function(v){ that.properties.filename = v; }, this.properties  );
  	this.number = this.addWidget("number","motion", this.properties.motion, function(v){ that.properties.motion = v; }, this.properties  );
	this.number2 = this.addWidget("number","speed", this.properties.speed, function(v){ that.properties.speed = v; }, this.properties  );
}

SimpleAnimate.title = "SimpleAnimate ";

SimpleAnimate.prototype.tick = function(agent, dt)
{
  
  if(agent.animator)
  {
  	if(this.action)
	{
      this.description = 'Playing ' + this.properties.anims[0].anim;
      return this.action(agent);
	}
  }
}

SimpleAnimate.prototype.action = function(agent)
{
	var animation = animation_manager.animations[this.properties.filename];
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
	
	LEvent.trigger( agent, "applyBehaviour", behaviour);
//	agent.animationBlender.applyBehaviour(behaviour);
//	agent.animator._base_animation._animation = this.properties.src + this.properties.filename;
	return STATUS.success;
}


SimpleAnimate.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
    // this.data.g_node = this;
}

LiteGraph.registerNodeType("btree/SimpleAnimate", SimpleAnimate);


function EQSNearestInterestPoint()
{
    this.shape = 2;
    this.color = "#3E0E35";
    this.bgcolor = "#3d2e3d";
    this.boxcolor = "#999";
    this.title = "EQS-NIP"
    this.data = {}
    this.ip_type = null;
    var w = 200;
    var h = 55;
    this.addOutput("value","vec3", {pos:[w,15], dir:LiteGraph.LEFT});
    this.size = [w, h]; 
    var that = this;
    this.properties = {
        list: [],
        min: 0,
        max: 100,
        text: "threshold"
    };
    // this.size = [80,60];
    this.slider = this.addWidget("combo","List", Object.keys(CORE.Scene.properties.interest_points)[0], function(v){that.ip_type = v;}, { values:function(widget, node){
        // console.log(CORE.Scene.properties.interest_points);
        return Object.keys(CORE.Scene.properties.interest_points);
    }} );

    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.widgets_up = true;

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
    var nearest = [0,0,-1000];
    var min = 999999999;
    var types = Object.keys(CORE.Scene.properties.interest_points);
    if(!this.ip_type)
        if(types[0])
            this.ip_type = types[0];
    for(var i in types)
    {
        var type = types[i];
        if(this.ip_type != type)
            continue;
        for(var j in CORE.Scene.properties.interest_points[type])
        {
            var type_ip = CORE.Scene.properties.interest_points[type][j];
            var ip = type_ip.pos;
			if(!agent_evaluated) return;
            var agent_pos = agent_evaluated.skeleton.skeleton_container.getGlobalPosition();
            var dist = vec3.dist(ip, agent_pos);
    
            if(dist < min){
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
    this.color = "#3E0E35";
    this.bgcolor = "#3d2e3d";
    this.boxcolor = "#999";
    var w = 150;
    var h = 45;
    // this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("pos","vec3", {pos:[0,10], dir:LiteGraph.LEFT});
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
    ctx.fillText(`Point evaluated`,10,35);
}
EQSDistanceTo.prototype.onExecute = function()
{
    var point = this.getInputData(0);
    var agent_pos = agent_evaluated.skeleton.skeleton_container.getGlobalPosition();
    var dist = vec3.dist(point, agent_pos);
    // console.log("Agent pos: ", agent_pos);
    // console.log("Point: ", point);
    // console.log(dist);  
    this.setOutputData(0,dist);
}
EQSDistanceTo.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}

function LookAt()
{
    this.shape = 2;
    this.color = "#1B662D"
    this.bgcolor = "#384837";
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
	agent.properties.look_at_pos = this.properties.look_at.pos;
	this.description = 'Look At updated: New look at position set to the input';
	return STATUS.success;
}
LookAt.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    ctx.fillText(`Look at Node`,10,35);
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



function removeChild(node)
{
    var parent = node_editor.graph.getNodeById(node.parent);
    for(var i = 0; i< parent.children.length; i++)
    {
        var children = parent.children[i];
        if(children.id == node.id)
        {
            var index = parent.children.indexOf(children);
            if (index !== -1) {
                parent.children.splice(index, 1);
            }
        }
    }
    node.parent = null;
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
//            graph.onNodeConnectionChange( 1 , target_node, origin_slot, node, target_slot );
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
