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

    this.graph = new LGraph();

    var that = this;
    this.graph.onNodeAdded = function(node)
    {
         console.log(node);
        //  node.title = node.node_props.name;

         switch(node.type)
         {
             case "btree/root": {
                 that.btree.rootnode = that.btree.addRootNode(node.id); 
                 node.title = node.title = "Root";  
             }
                 break;
             case "btree/conditional": {
                that.btree.addConditionalNode(node.id, node.node_props);
                if(node.node_props.name)
                    node.title = node.node_props.name + " cond";
             }
                break;
             case "btree/leaf": {
                that.btree.addAnimationNode(node.id, node.node_props);
                if(node.node_props.name)
                    node.title = node.node_props.name;
             }
                break;
             case "btree/intarget":{
                 that.btree.addInTargetNode(node.id, node.node_props)
             }
                break;
             case "btree/sequencer":
                break;
             case "btree/selector":
                break;
         }
    }

    this.graph.onNodeRemoved = function(node)
    {
        var parent_id = node.parent;
        that.btree.deleteNode(node.id, parent_id);
    }
    
    this.graph.onNodeConnectionChange = function( type , node, slot, target_node, target_slot )
    {
        console.log(that.btree);
        var btnode = that.btree.getNodeById(node.id);
        var target_btnode = that.btree.getNodeById(target_node.id);
        btnode.children.push(target_btnode);
        target_btnode.parent = btnode;
    }


    this.graph_canvas = new LGraphCanvas(this.canvas2D , this.graph);
    this.graph_canvas.default_link_color = "#98bcbe";
    this.root_node = LiteGraph.createNode("btree/root");
    this.root_node.pos = [200,200];
    this.graph.add(this.root_node);
    // console.log(this.root_node);

    this.graph_canvas.onNodeSelected = function(node)
    {
        console.log(node);
    }

    this.graph_canvas.onNodeDeselected = function(node)
    {
        console.log(node);
    }

    this.graph_canvas.onDropItem = function( data )
    { 
        var type = data.dataTransfer.getData("type");
        var properties = data.dataTransfer.getData("obj");
        properties = JSON.parse(properties);
        that.addNodeByType(type, properties, [data.canvasX,data.canvasY]); 
    }
    

}

BTEditor.prototype.addNodeByType = function(type, properties, pos)
{
    switch(type){
        case "action":{
            var node_leaf = LiteGraph.createNode("btree/leaf");
            node_leaf.node_props = properties;
            node_leaf.pos = pos;
            node_editor.graph.add(node_leaf);
        } break;

        case "intarget":{
            var node_cond = LiteGraph.createNode("btree/intarget");
            node_cond.node_props = properties;
            node_cond.pos = pos;
            node_editor.graph.add(node_cond);
        } break;

        default:{
            var node_cond = LiteGraph.createNode("btree/conditional");
            node_cond.node_props = properties;
            node_cond.pos = pos;
            node_editor.graph.add(node_cond);
        } break;
    }
}
// BTEditor.prototype.updateTree = function(gnode_id)
// {
//     var g_node = node_editor.graph.getNodeById(gnode_id);
//     if(g_node.children && g_node.children.length > 0) 
//     {
//         var bt_node = BT.getNodeById(gnode_id);
//         if(BT.rootnode.children.length == 0)
//             BT.rootnode.children.push(bt_node);
//         for(var i = 0; i < g_node.children.length; i++)
//         {   
//             bt_node.children[i] = BT.getNodeById(g_node.children[i]);
//             var new_gnode = g_node.children[i];
//             this.updateTree(new_gnode);
//         }
//     }
// }

BTEditor.prototype.getBTNodeById = function( id )
{
    for(var i = 0; i < this.btree.node_pool.length; i++)
    {
        var node = this.btree.node_pool[i];  
        if(node.id == id)
            return node;
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
    this.flags = { horizontal: true };
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

function Conditional()
{
    this.shape = 2;
    // this.boxcolor = "#ff0000";
    this.addInput("",0);
	this.addOutput("","number");
	this.addProperty( "value", 1.0 );
    this.editable = { property:"value", type:"number" };
    this.node_props = {title:"", property_to_compare:"", limit_value: null}
    this.flags = { horizontal: true };

}

// Conditional.title = "Conditional";
Conditional.desc = "Testing own nodes";

LiteGraph.registerNodeType("btree/conditional", Conditional);

function InTarget()
{
    this.shape = 2;
    this.addInput("",0);
	this.addOutput("","number");
	this.addProperty( "value", 1.0 );
    this.editable = { property:"value", type:"number" };
    this.flags = { horizontal: true };

}

InTarget.title = "InTarget";
InTarget.desc = "Testing own nodes";

LiteGraph.registerNodeType("btree/intarget", InTarget);

function Leaf()
{
    this.shape = 2;
    this.addInput("",0);
	this.addProperty( "value", 1.0 );
    this.editable = { property:"value", type:"number" };
    this.flags = { horizontal: true };
    this.node_props = {anims:[{anim:null, weight: 1}], motion:0, speed:1}

}

Leaf.title = "Leaf";
Leaf.desc = "Testing own nodes";

// Leaf.prototype.onSelected = function()
// {
//     // console.log(this);
//     //GUI.current_node_id = this.id;
//     //GUI.node_inspector.refresh();
// }


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