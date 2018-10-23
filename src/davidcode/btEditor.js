function BTEditor( BT_list)
{
  if(this.constructor !== BTEditor)
	 throw("You must use new to create a BTEditor");
	this._ctor(BT_list);
}

BTEditor.prototype._ctor = function(BT_list)
{
    this.node_pool = [];
    this.context2 = null;
    this.canvas2D = null;
    this.graph = null;
    this.graph_canvas = null;
    this.BT_list = BT_list;
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

    this.graph = new LGraph();
    // this.graph.onNodeAdded = function(node)
    // {
    //      console.log(node);
    // }

    // this.graph.onNodeRemoved = function(node)
    // {
    //     console.log(node);
    //     //Check if has children and disconnect
    //     //Check if has parent and disconnect
    // }
    // var dos = 2;
    // debugger;
    // this.graph.onNodeConnectionChange = function( type , node, slot, target_node, target_slot )
    // {
    //     debugger;
    //     // console.log(node);
    // }


    this.graph_canvas = new LGraphCanvas(this.canvas2D , this.graph);

    // this.graph_canvas.onNodeSelected = function(node)
    // {
    //     console.log(node);
    // }

    // this.graph_canvas.onNodeDeselected = function(node)
    // {
    //     console.log(node);
    // }

    this.graph_canvas.onDropItem = function( data )
    { 
        var type = data.dataTransfer.getData("type");
        /*Super harcodeado para que funcione en la demo, aquí podrían ir las Task creadas */
        if(type == "action")
        {   
            var params = {};
            var property = data.dataTransfer.getData("text");
            var node_leaf = LiteGraph.createNode("btree/leaf");
            node_leaf.properties["merge_animations"] = [{anim:property,weight:1}];
            node_leaf.title = property;
            node_leaf.pos = [data.canvasX,data.canvasY];
            if(property == "Idle")
                params = {motion:0, speed:1}
            else if(property == "Walking")
                params = {motion:3, speed:1}
            else if(property == "Running")
                params = {motion:5, speed:1.25}
            else    
                params = {motion:1, speed:0.9}
            node_leaf.properties["params"] = params;
            node_editor.graph.add(node_leaf);
            var n = BT.addAnimationNode(node_leaf.id, [{anim:property,weight:1}], params.speed,params.motion);
        }
        else if(type == "intarget")
        {            
            var property = data.dataTransfer.getData("text");
            var node_cond = LiteGraph.createNode("btree/intarget");
            node_cond.title = "In Target?";
            node_cond.pos = [data.canvasX,data.canvasY];
            node_editor.graph.add(node_cond);
            var node = BT.addInTargetNode(node_cond.id, 200 );
            // console.log("intarget entered");
            return data;
        }
        else
        {
            var property = data.dataTransfer.getData("text");
            var node_cond = LiteGraph.createNode("btree/conditional");
            node_cond.title = property + " cond.";
            node_cond.pos = [data.canvasX,data.canvasY];
            node_cond.properties["limit_value"] = 50;
            node_cond.properties["property_to_compare"] = property;
            node_editor.graph.add(node_cond);
            var node = BT.addConditionalNode(node_cond.id, node_cond.title, property, 50 );
            console.log(node);
            return data;
        }
    }
    
    this.root_node = LiteGraph.createNode("btree/root");
    this.root_node.pos = [200,200];
    this.graph.add(this.root_node);
    console.log(this.graph_canvas);
}

BTEditor.prototype.updateTree = function(gnode_id)
{
    var g_node = node_editor.graph.getNodeById(gnode_id);
    if(g_node.children && g_node.children.length > 0) 
    {
        var bt_node = BT.getNodeById(gnode_id);
        if(BT.rootnode.children.length == 0)
            BT.rootnode.children.push(bt_node);
        for(var i = 0; i < g_node.children.length; i++)
        {   
            bt_node.children[i] = BT.getNodeById(g_node.children[i]);
            var new_gnode = g_node.children[i];
            this.updateTree(new_gnode);
        }
    }
}

BTEditor.prototype.bTreeFromJSON = function( obj )
{
    var type = obj.type;
    var node;
    if(type == "root")
    {

    }
    else if(type == "conditional")
    {

    }
    else if(type == "intarget")
    {

    }
    else if(type == "animation")
    {

    }

    if(obj.children)
    {
        for(var i in children)
        {
            var child = this.bTreeFromJSON(children);
            // node.connect();
        }
    }
    return obj;
}

BTEditor.prototype.getBTNodeById = function( id )
{
    for(var i = 0; i < this.BT_list.length; i++)
    {
        var BT = this.BT_list[i];
        for(var i = 0; i < BT.node_pool.length; i++)
        {
            if(BT.node_pool[i].id == id)
                return BT.node_pool[i];
        }
    }
}

// LiteGraphNode.prototype.onRemove = function()
// {
//     console.log("Removed");
// }

function RootNode()
{
    this.shape = 2;
    this.addOutput("","boolean");
}
RootNode.title = "Root";
RootNode.desc = "Testing own nodes";

// RootNode.prototype.onSelected = function()
// {
//     // console.log(this);
//     //GUI.current_node_id = this.id;  
//     //GUI.node_inspector.refresh();
// }
LiteGraph.registerNodeType("btree/root", RootNode);

RootNode.prototype.onConnectInput = function()
{
    node_editor.updateTree(node_editor.root_node.id);
}

function Conditional()
{
    this.shape = 2;
    // this.boxcolor = "#ff0000";
    this.addInput("",0);
	this.addOutput("","number");
	this.addProperty( "value", 1.0 );
    this.editable = { property:"value", type:"number" };
}

Conditional.title = "Conditional";
Conditional.desc = "Testing own nodes";

// Conditional.prototype.onSelected = function()
// {
//     console.log(this);
//     //GUI.current_node_id = this.id;  
//     //GUI.node_inspector.refresh();
// }

// Conditional.prototype.onRemoved = function()
// {
//     if(this.parent)
//         removeChild(this);
//     node_editor.updateTree(node_editor.root_node.id);

// }
Conditional.prototype.onConnectInput = function()
{
    node_editor.updateTree(node_editor.root_node.id);
}

LiteGraph.registerNodeType("btree/conditional", Conditional);

function InTarget()
{
    this.shape = 2;
    this.addInput("",0);
	this.addOutput("","number");
	this.addProperty( "value", 1.0 );
	this.editable = { property:"value", type:"number" };
}

InTarget.title = "InTarget";
InTarget.desc = "Testing own nodes";
// InTarget.prototype.onSelected = function()
// {
//     // console.log(this);
//     //GUI.current_node = this;
//     //GUI.node_inspector.refresh();
// }

InTarget.prototype.onRemoved = function()
{
    if(this.parent)
        removeChild(this);
    node_editor.updateTree(node_editor.root_node.id);
}
InTarget.prototype.onConnectInput = function()
{
    node_editor.updateTree(node_editor.root_node.id);
}

LiteGraph.registerNodeType("btree/intarget", InTarget);

function Leaf()
{
    this.shape = 2;
    this.addInput("",0);
	this.addProperty( "value", 1.0 );
	this.editable = { property:"value", type:"number" };
}

Leaf.title = "Leaf";
Leaf.desc = "Testing own nodes";

// Leaf.prototype.onSelected = function()
// {
//     // console.log(this);
//     //GUI.current_node_id = this.id;
//     //GUI.node_inspector.refresh();
// }

Leaf.prototype.onRemoved = function()
{
    if(this.parent)
        removeChild(this);
    node_editor.updateTree(node_editor.root_node.id);
}

Leaf.prototype.onConnectInput = function()
{
    node_editor.updateTree(node_editor.root_node.id);
}

LiteGraph.registerNodeType("btree/leaf", Leaf);

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