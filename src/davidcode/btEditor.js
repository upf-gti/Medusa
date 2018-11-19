function BTEditor( BT_list)
{
  if(this.constructor !== BTEditor)
	 throw("You must use new to create a BTEditor");
	this._ctor(BT_list);
}

BTEditor.prototype._ctor = function(btree)
{
    this.node_pool = [];
    this.context2 = null;
    this.canvas2D = null;
    this.graph = null;
    this.graph_canvas = null;
    this.BT_list = BT_list;
    this.btree = btree;
}

BTEditor.prototype.init = function()
{
    this.canvas2D = document.createElement("canvas");
    this.context2 = this.canvas2D.getContext("2d");
    var bteditor_cont = document.getElementById("graph-canvas");
    this.canvas2D.width = bteditor_cont.clientWidth;
    this.canvas2D.height = bteditor_cont.clientHeight;
    this.canvas2D.id = "BTEditor"
    bteditor_cont.appendChild(this.canvas2D);
    LiteGraph.NODE_TITLE_COLOR = "#CCC";
    LiteGraph.NODE_TEXT_COLOR = "#CCC"

    this.graph = new LGraph();

    var that = this;
    this.graph.onNodeAdded = function(node)
    {
        node.btree = that.btree;
        switch(node.type)
        {
            case "btree/Root": {
                that.btree.rootnode = that.btree.addRootNode(node.id); 
            } break;

            case "btree/Conditional": {
            that.btree.addConditionalNode(node.id, node.data);
            } break;

            case "btree/SimpleAnimate": {
            that.btree.addAnimationNode(node.id, node.data);
            } break;

            case "btree/InTarget":{
                that.btree.addInTargetNode(node.id, node.data)
            } break;

            case "btree/Sequencer":{
                that.btree.addSequencerNode(node.id, node.data);
            } break;

            case "btree/selector": break;

            case "btree/FindNextTarget":{
                that.btree.addFindNextTargetNode(node.id, node.data);
            } break;
            case "btree/EQSNearestInterestPoint":{
                that.btree.addEQSNearestInterestPointNode(node.id, node.data);
            } break;
            case "btree/MoveTo":{
                that.btree.addMoveToNode(node.id, node.data);
            } break;

            case "btree/EQSDistanceTo":{
                that.btree.addEQSDistanceToNode(node.id, node.data);
            }
        }
    }

    this.graph.onNodeRemoved = function(node)
    {
        var parent_id = node.parent;
        that.btree.deleteNode(node.id, parent_id);
    }
    
    this.graph.onNodeConnectionChange = function( type , node, slot, target_node, target_slot )
    {
        if(!node)
            condole.log("Disconnect");
        console.log(that.btree);
        var btnode = that.btree.getNodeById(node.id);
        if(target_node){
            var target_btnode = that.btree.getNodeById(target_node.id);
            btnode.children.push(target_btnode);
            target_btnode.parent = btnode;
        }
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
        var properties = data.dataTransfer.getData("obj");
        console.log(properties);
        properties = JSON.parse(properties);
        that.addNodeByType(type, properties, [data.canvasX,data.canvasY]); 
    }
    

}

BTEditor.prototype.addNodeByType = function(type, properties, pos)
{
    switch(type){
        case "action":{
            var node_leaf = LiteGraph.createNode("btree/SimpleAnimate");
            node_leaf.data = properties;
            node_leaf.pos = pos;
            node_editor.graph.add(node_leaf);
        } break;

        case "intarget":{
            var node_cond = LiteGraph.createNode("btree/InTarget");
            node_cond.data = properties;
            node_cond.pos = pos;
            node_editor.graph.add(node_cond);
        } break;
        case "sequencer":{
            var node_seq = LiteGraph.createNode("btree/Sequencer");
            node_seq.data = properties;
            node_seq.pos = pos;
            node_editor.graph.add(node_seq);
        } break;
        default:{
            var node_cond = LiteGraph.createNode("btree/Conditional");
            node_cond.data = properties;
            node_cond.pos = pos;
            node_editor.graph.add(node_cond);
        } break;
    }
}

BTEditor.prototype.getBTNodeById = function( id )
{
    for(var i = 0; i < this.btree.node_pool.length; i++)
    {
        var node = this.btree.node_pool[i];  
        if(node.id == id)
            return node;
    }
}

function RootNode()
{
    this.shape = 2;
    this.color = "#1E1E1E"
    this.boxcolor = "#999";
    this.addOutput("","path");
    this.flags = { horizontal: true };
}

RootNode.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}
RootNode.title = "Root";
RootNode.desc = "Testing own nodes";

LiteGraph.registerNodeType("btree/Root", RootNode);

function Conditional()
{
    this.shape = 2;
    this.color = "#005557";
    this.bgcolor = "#2d4243";
    this.boxcolor = "#999";
    var w = 200;
    var h = 75;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("value","number", {pos:[0,10], dir:LiteGraph.LEFT});
    // this.addInput("value","number", {pos:[0,30], dir:LiteGraph.LEFT});
    this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    this.size = [w, h];    
//     this.properties = {
//         value: 50,
//         min: 0,
//         max: 75,
//         text: "threshold"
//     };
//     var that = this;
//     this.size = [80,60];
//    this.slider = this.addWidget("slider","V", this.properties.value, function(v){ that.properties.value = v; }, this.properties  );

    this.editable = { property:"value", type:"number" };
    this.data = {title:"", property_to_compare:"", limit_value: 50, value_to_compare:null}
    // this.flags = { resizable: false };

}

Conditional.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
    ctx.fillText(`Property: ${this.data.property_to_compare}`,10,35);
    // if(this.data.limit_value)
    //     ctx.fillText(`Threshold: ${this.data.limit_value}`,10,55);
}

Conditional.prototype.onDblClick = function(node)
{
    CORE.GUI.showNodeInfo(this);
}

// Conditional.prototype.onPropertyChanged = function(name,value)
// {
//     if(name == "value")
//         this.slider.value = value;
// }
Conditional.prototype.onExecute = function()
{
    var data = this.getInputData(1);
    // console.log(data);
    if(data)
        this.data.value_to_compare = data;
    if(this.btree)
    {
        this.btree.updateNodeInfo(this.id, this.data);
        return;
    }
}

Conditional.title = "Conditional"
Conditional.desc = "Testing own nodes";

Conditional.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}

LiteGraph.registerNodeType("btree/Conditional", Conditional);

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
}

InTarget.title = "InTarget";
InTarget.desc = "Testing own nodes";
InTarget.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}

LiteGraph.registerNodeType("btree/InTarget", InTarget);

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
}

Sequencer.prototype.onDrawBackground = function(ctx, canvas)
{

}

Sequencer.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
}

// Sequencer.prototype.onConfigure = bl();
LiteGraph.registerNodeType("btree/Sequencer", Sequencer);


function MoveTo()
{
    this.shape = 2;
    this.color = "#1B662D"
    this.bgcolor = "#384837";
    this.boxcolor = "#999";
    var w = 200;
    var h = 65;
    this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addInput("target","vec3", {pos:[0,10], dir:LiteGraph.LEFT});
    this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    this.size = [w, h];    
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.data = {target:null, motion:1}

}

MoveTo.title = "MoveTo ";
MoveTo.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
    ctx.fillText(`move to: ${this.data.target}`,10,35);
    ctx.fillText(`Motion speed: ${this.data.motion}`,10,55);
}
MoveTo.prototype.onExecute = function()
 {
    var data = this.getInputData(1);
    if(data)
        this.data.target = data;
    if(this.btree)
    {
        this.btree.updateNodeInfo(this.id, this.data);
        return;
    }

}

MoveTo.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
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
    this.data = {}

}

FindNextTarget.title = "FindNextTarget ";
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
}

LiteGraph.registerNodeType("btree/FindNextTarget", FindNextTarget);



function SimpleAnimate()
{
    this.shape = 2;
    this.color = "#1B662D"
    this.bgcolor = "#384837";
    this.boxcolor = "#999";
    this.addInput("","path");
    this.addProperty( "value", 1.0 );
    this.size = [200,65];
    this.editable = { property:"value", type:"number" };
    this.flags = { horizontal: true };
    this.data = {anims:[{anim:null, weight: 1}], motion:0, speed:1}

}

SimpleAnimate.title = "SimpleAnimate ";
SimpleAnimate.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
    ctx.fillText(`Animation: ${this.data.anims[0].anim}`,10,15);
    ctx.fillText(`Motion speed: ${this.data.motion}`,10,35);
    ctx.fillText(`Animation speed: ${this.data.speed}`,10,55);
}

SimpleAnimate.prototype.onConfigure = function(info)
{
    // debugger;
    onConfig(info, this.graph);
}

LiteGraph.registerNodeType("btree/SimpleAnimate", SimpleAnimate);

// function EQSNearestAgent()
// {
//     this.shape = 2;
//     this.color = "#3E0E35";
//     this.bgcolor = "#3d2e3d";
//     this.boxcolor = "#999";
//     var w = 200;
//     var h = 45;
//     this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
//     this.addOutput("value","vec3", {pos:[w,10], dir:LiteGraph.LEFT});
//     this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
//     this.size = [w, h];    
//     this.editable = { property:"value", type:"number" };
//     this.flags = { resizable: false };
//     this.data = {}
// }

// EQSNearestAgent.prototype.onDrawBackground = function(ctx, canvas)
// {
//     ctx.font = "12px Arial";
//     ctx.fillStyle = "#AAA";
//     // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
//     ctx.fillText(`Return the nearest agent`,10,30);
// }

// LiteGraph.registerNodeType("btree/EQSNearestAgent", EQSNearestAgent);

function EQSNearestInterestPoint()
{
    this.shape = 2;
    this.color = "#3E0E35";
    this.bgcolor = "#3d2e3d";
    this.boxcolor = "#999";
    this.title = "EQS-NIP"
    var w = 150;
    var h = 45;
    // this.addInput("","path", {pos:[w*0.5,-LiteGraph.NODE_TITLE_HEIGHT], dir:LiteGraph.UP});
    this.addOutput("value","vec3", {pos:[w,10], dir:LiteGraph.LEFT});
    // this.addOutput("","path", {pos:[w*0.5,h], dir:LiteGraph.DOWN});
    this.size = [w, h]; 
    this.editable = { property:"value", type:"number" };
    this.flags = { resizable: false };
    this.data = {list:[]}
}

EQSNearestInterestPoint.prototype.onDrawBackground = function(ctx, canvas)
{
    ctx.font = "12px Arial";
    ctx.fillStyle = "#AAA";
    // ctx.fillText(this.data.property_to_compare + " - Limit value" + this.data.limit_value,10,15);
    ctx.fillText(`List evaluated`,10,15);
}
EQSNearestInterestPoint.prototype.onExecute = function()
{
    var nearest = [0,0,-1000];
    var min = 99999999999;
    // console.log(CORE.Scene.properties.interest_points);
    for(var i in CORE.Scene.properties.interest_points)
    {
        var ip = CORE.Scene.properties.interest_points[i];
        var agent_pos = agent_evaluated.skeleton.skeleton_container.getGlobalPosition();
        var dist = vec3.dist(ip, agent_pos);

        if(dist < min){
            min = dist;
            nearest = ip;
        }
    }
    this.setOutputData(0,nearest);
}

EQSNearestInterestPoint.prototype.onConfigure = function(info)
{
    onConfig(info, this.graph);
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
    this.data = {pos:[0, 0, 0]}
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



LiteGraph.registerNodeType("btree/EQSDistanceTo", EQSDistanceTo);



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
    // console.log("Links: ",  info.graph.links);
    // console.log("Links",graph.links);
    // debugger;
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

            graph.onNodeConnectionChange( type , node, origin_slot, target_node, target_slot );
            // console.log("Link", link);
        }
    }

    // var node = graph.getNodeById(info.id);
    // console.log("Node", node);
    // console.log("Info: ", info);
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
