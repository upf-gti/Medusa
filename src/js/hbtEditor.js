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
HBTEditor.prototype.init = function( hbt_graph )
{
    this.canvas2D = document.createElement("canvas");
    this.context2 = this.canvas2D.getContext("2d");
    var HBTEditor_cont = document.getElementById("graph-canvas");
    this.canvas2D.width = HBTEditor_cont.clientWidth;
    this.canvas2D.height = HBTEditor_cont.clientHeight;
    this.canvas2D.id = "HBTEditor"
    HBTEditor_cont.appendChild(this.canvas2D);
    LiteGraph.NODE_TITLE_COLOR = "#DDD";
    LiteGraph.NODE_TEXT_COLOR = "#DDD";

    this.graph = hbt_graph.graph;
	this.graph.current_behaviour = new Behaviour();
	this.createInitGraph();
    this.graph.description_stack = [];

    var that = this;

    this.graph_canvas = new LGraphCanvas(this.canvas2D , this.graph);
    this.graph_canvas.default_link_color = "#98bcbe";

    this.graph_canvas.onNodeSelected = function(node)
    {
        console.log(node);
        that.current_graph_node = node;
    }

    this.graph_canvas.onNodeDeselected = function(node)
    {
        that.current_graph_node = null;
        console.log(node);
    }

    this.graph_canvas.onDropItem = function( data )
    { 
        var type = data.dataTransfer.getData("type");
		var name = data.dataTransfer.getData("name");

		if(name == "")
			name = data.dataTransfer.getData("obj");
//      var properties = data.dataTransfer.getData("obj");
//      properties = JSON.parse(properties);
        that.addNodeByType(type, name, [data.canvasX,data.canvasY]); 
    }

    /*************** Draww summary of what is happening on the tree *****************/
    this.graph_canvas.onDrawOverlay = function( ctx )
    {
        if(!this.graph || !this.graph.description_stack) return;
        if( this.graph.description_stack.length > 0 )
        {
            var array_of_messages = hbt_editor.graph.description_stack;

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

HBTEditor.prototype.createInitGraph = function()
{
	var initial = JSON.parse(CORE.Scene.initial_behaviour["InitialDemo"])
	this.graph.configure(initial.behaviour);
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
            var dataType = null;
            // if(this.graph.context.user && this.graph.context.user.properties.hasOwnProperty(title))
            // {
            //     graphnode.property_type ="user";
            //     dataType =  this.graph.graph.context.user.properties[title];
            // }else
            // {
            //     dataType =  this.graph.graph.context.agent_evaluated.properties[title];
            // }
            // graphnode.setProperty("type", dataType.constructor.name.toLocaleLowerCase());
            // graphnode.setProperty("value", dataType);
            var graphcanvas = LGraphCanvas.active_canvas;
            graphcanvas.graph.add(graphnode);
            
            if(graphcanvas.graph._is_subgraph)
            {
                graphnode.graph.character_evaluated = this.graph.character_evaluated;
                graphnode.graph.context = this.graph.context;
                graphnode.graph.current_behaviour = this.graph.current_behaviour;
                graphnode.graph.character_evaluated = this.graph.character_evaluated;
                graphnode.graph.root_node = this.graph.root_node;
                graphnode.graph.evaluation_behaviours = this.graph.evaluation_behaviours;
            }

        } break; 
        case "cycle":{
			var props = JSON.parse(properties);
            var node_leaf = LiteGraph.createNode("btree/SimpleAnimate");
			node_leaf.setProperty("filename", props.filename);
			node_leaf.setProperty("speed", props.speed);
			node_leaf.setProperty("motion", props.motion);
//            node_leaf.properties = props;
            node_leaf.pos = pos;
            // node_leaf.data.g_node = node_leaf;
            var graphcanvas = LGraphCanvas.active_canvas;
            graphcanvas.graph.add(node_leaf);
            
            if(graphcanvas.graph._is_subgraph)
            {
                node_leaf.graph.character_evaluated = this.graph.character_evaluated;
                node_leaf.graph.context = this.graph.context;
                node_leaf.graph.current_behaviour = this.graph.current_behaviour;
                node_leaf.graph.character_evaluated = this.graph.character_evaluated;
                node_leaf.graph.root_node = this.graph.root_node;
                node_leaf.graph.evaluation_behaviours = this.graph.evaluation_behaviours;
            }
            if(hbt_editor.current_graph_node && hbt_editor.current_graph_node.outputs && hbt_editor.current_graph_node.outputs[0].type == "path")
            {

                hbt_editor.current_graph_node.connect(0, node_leaf, 0 );
            }
        } break;

		case "action":{
			var props = JSON.parse(properties);
            var node_leaf = LiteGraph.createNode("btree/ActionAnimate");
			node_leaf.setProperty("filename", props.filename);
			node_leaf.setProperty("speed", props.speed);
//            node_leaf.properties = props;
            node_leaf.pos = pos;
            // node_leaf.data.g_node = node_leaf;
            hbt_editor.graph.add(node_leaf);
            // if(hbt_editor.graph.)
        } break;

        case "intarget":{
            var node_cond = LiteGraph.createNode("btree/InTarget");
            node_cond.properties = properties;
            node_cond.pos = pos;
            // node_cond.data.g_node = node_cond;
            var graphcanvas = LGraphCanvas.active_canvas;
            graphcanvas.graph.add(node_leaf);
            
            if(graphcanvas.graph._is_subgraph)
            {
                node_leaf.graph.character_evaluated = this.graph.character_evaluated;
                node_leaf.graph.context = this.graph.context;
                node_leaf.graph.current_behaviour = this.graph.current_behaviour;
                node_leaf.graph.character_evaluated = this.graph.character_evaluated;
                node_leaf.graph.root_node = this.graph.root_node;
                node_leaf.graph.evaluation_behaviours = this.graph.evaluation_behaviours;
            }
            if(hbt_editor.current_graph_node && hbt_editor.current_graph_node.outputs && hbt_editor.current_graph_node.outputs[0].type == "path")
            {

                hbt_editor.current_graph_node.connect(0, node_leaf, 0 );
            }
        } break;
    }
}

function removeChild(node)
{
    var parent = hbt_editor.graph.getNodeById(node.parent);
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

