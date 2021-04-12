var GraphManager = {
    name : "GraphManager",
    graphs:new Proxy([], {
        set: (target, property, value, receiver) => {
            target[property] = value;

            if(property == "length")
                return true;
            
                GraphManager.createGUIParams( value );

            return true; 
        }     
    }),

	preInit()
	{
        this.panel    = CORE.GUI.graph_area;
        this.panel.id = "graph-area";

        this.inspector_area = CORE.GUI.inspector_area;
		this.inspector_area.content.id = "inspector-area1";
		this.inspector_area.content.classList.add("inspector-area");

        CORE.GraphManager.panel.content.id = "graph-canvas";

		var top_panel = this.top_panel = document.createElement("div");
		top_panel.id = "graph-top-panel";
		this.panel.add(this.top_panel);
		var that = this;

		var top_inspector = this.top_inspector = new LiteGUI.Inspector();
		this.top_inspector.on_refresh = function()
		{
			var agent_name = "none";
			top_inspector.clear();
			top_inspector.widgets_per_row = 5;
			var test_array = [];
			if(hbt_context)
					test_array = Object.keys(hbt_graphs);

			var current;
			if(agent_selected)
				current = agent_selected.hbtgraph;
			else 
				current = "by_default";

			top_inspector.addCombo("Current", current, {name_width:"25%", width:"25%",values:test_array, callback:function(v){
				console.log("Graph name: " + v);
				// debugger;
				that.putGraphOnEditor( v );
			}});
			top_inspector.addButton(null, "Run step", {name_width:"0%", width:"10%", callback:function(v){

				state = PLAYING;
				update(GFX.dt);
				state = STOP;
			}});
			top_inspector.addButton(null, "New", {name_width:"0%", width:"10%", callback:function(v)
			{
				var gcanvas = LGraphCanvas.active_canvas;
				if(!gcanvas) return;
				if(gcanvas.graph._is_subgraph)
				{
					alert("Subgraph in canvas. Please, close it before you create a new graph" );
					return;
				}
				that.showNewBehaviorsDialog();

			}}); 
			top_inspector.addButton(null, "Load", {name_width:"0%", width:"11%", callback:function(v)
			{
				var gcanvas = LGraphCanvas.active_canvas;
				if(!gcanvas) return;
				if(gcanvas.graph._is_subgraph)
				{
					alert("Subgraph in canvas. Please, close it before you Load a graph" );
					return;
				}
				that.showLoadBehaviorsDialog();

			}}); 
			top_inspector.addButton(null, "Upload", {name_width:"0%", width:"11%", callback:function(v)
			{
				var gcanvas = LGraphCanvas.active_canvas;
				if(!gcanvas) return;
				if(gcanvas.graph._is_subgraph)
				{
					alert("Subgraph in canvas. Please, close it before you Upload a graph" );
					return;
				}
				CORE.GUI.showSaveBehaviourDialog();
			}}); 

			top_inspector.addButton(null, "Download", {name_width:"0%", width:"12%", callback:function(v)
			{
				CORE.GUI.showDownloadBehaviourDialog();
			}}); 

			if(agent_selected)
				agent_name = agent_selected.properties.name;

			top_inspector.addInfo("Agent: ", agent_name, {name_width:"35%", width:"20%", callback:function(v)
			{
				num_agents = v;
			}}); 
		}
		
		this.top_panel.appendChild(this.top_inspector.root);
    },

    init(){

        CORE.GUI.root.addEventListener("split_moved", this.resize.bind(this));
        window.addEventListener("resize", this.resize.bind(this));
    },

    postInit(){
        this.graphcanvas = hbt_editor.graph_canvas;
    },

    toogleGUI(){
        debugger;
    },

	putGraphOnEditor( name )
	{
		var new_hbt = hbt_graphs[name];
		current_graph = new_hbt;
//		console.log(name);
		// var HBT_graph = hbt_context.getGraphByName(name);
		// hbt_context.current_graph = HBT_graph;
		if(!current_graph)
			return;	
		hbt_editor.graph_canvas.setGraph(current_graph.graph);
		hbt_editor.graph = current_graph.graph;
	},

    createGUIParams( graph ){
    },

    resize() {
        
        hbt_editor.graph_canvas.resize();
        
    },

    getCanvasImage()
    {
        var canvas = hbt_editor.graph_canvas.canvas;
        var image = canvas.toDataURL("image/png");

        var aLink = document.createElement('a');

        aLink.download = 'image.png';
        aLink.href = image;
        document.body.appendChild(aLink);
        
        console.log(aLink);
    }, 

	showNewBehaviorsDialog()
    {
        var scene = null;
        var dialog = new LiteGUI.Dialog( { id: "dialog_load_scene", title:"New Empty Graph", close: true, minimize: true, width: 250, height: 30, scroll: false, draggable: true});
		dialog.show();

        var widgets = new LiteGUI.Inspector();
		var name = "";

		widgets.on_refresh = function()
		{
			widgets.clear();

			widgets.addString("Name","", {placeholder:"Graph name", name_width:"40%", step:1, min:1, max:70, precision:0, callback:function(v)
			{
				name = v;
			}}); 

			widgets.addButton(null, "Create", {callback:function(){

				var new_hbtgraph = new HBTGraph(name);
				new_hbtgraph.graph.context = hbt_context;
				hbt_graphs[name] = new_hbtgraph;
				current_graph = hbt_graphs[name];
				var root = LiteGraph.createNode('btree/Root')
				root.pos = [280, 70]
				new_hbtgraph.graph.add(root);		
				// debugger;
				hbt_editor.graph_canvas.setGraph(current_graph.graph);
				hbt_editor.graph = current_graph.graph;
				CORE.Scene.agent_inspector.refresh();
				CORE.GraphManager.top_inspector.refresh();

				// var HBT_graph = hbt_context.addHBTGraph(name);
				// hbt_context.current_graph = HBT_graph;
				// hbt_editor.graph_canvas.setGraph(HBT_graph.graph);
				// hbt_editor.graph = HBT_graph.graph;
				// CORE.Scene.agent_inspector.refresh();
				// CORE.GraphManager.top_inspector.refresh();

//				CORE.Scene.populateScenario(num_agents, min_age, max_age); //dentro de la funci�n rellenar los parametros de las propiedades, elegir paths, etc
				dialog.close();
			}}) 
			
			dialog.adjustSize();
			dialog.setPosition(window.outerWidth/2, window.outerHight/3);
		}

		dialog.add(widgets);
		widgets.refresh(); 

    },

	showLoadBehaviorsDialog()
    {
        var scene = null;
        var dialog = new LiteGUI.Dialog( { id: "dialog_load_scene", title:"Load Graph", close: true, minimize: true, width: 520, height: 350, scroll: false, draggable: true});
		dialog.show();

		var split = new LiteGUI.Split([50,50]);
		dialog.add( split );

		var right_pane_style = split.getSection(1).style;
		right_pane_style.backgroundColor = "black";
		right_pane_style.paddingLeft = "2px";
		var widgets = new LiteGUI.Inspector();
		var behaviours = null;
		var full_path = "";
		// var base_url = 'https://webglstudio.upf.edu/users/hermann/files/sauce_dev/files/public/behaviors';
		var base_url = 'https://webglstudio.org/users/hermann/files/sauce_dev/files/public/behaviors';

		CORE.FS.getFiles("behaviors").then(function(e)
		{
			behaviours_names = getBehaviourNames(e);
			behaviours = e;

			var searchbox = widgets.addString( null, "", { placeHolder: "search...", immediate: true, callback: function(v){
				list.filter(v);
			}});
			var list = widgets.addList(null, behaviours_names, { height: 270, callback: inner_selected});//, callback_dblclick: inner_dblclick});
			widgets.addButton(null,"Load", { width: "100%",  callback: function(){
				//call server files
				LiteGUI.requestJSON(base_url+"/"+full_path, oncomplete )
				dialog.close();
			} });
			split.getSection(0).add( widgets );

			split.getSection(1).style.height = "100%";
			split.getSection(1).style.backgroundColor = "#333";
			split.getSection(1).style.paddingRight = "1px"; 
			split.getSection(1).style.paddingLeft = "1px"; 
		})

        function inner_selected( item )
		{
			console.log(behaviours);
			console.log(item);
			var data = null;
			for(var i  in behaviours)
			{
				if(behaviours[i].filename == item)
				{
					data = behaviours[i];
				}
			}
			var root = split.getSection(1);

			var info_inspector = new LiteGUI.Inspector();
			info_inspector.addInfo("Description", data.metadata.description, {name_width:"30%", width:"100%"});
			// info_inspector.addInfo(null, data.metadata.tags, {name_width:"30%", width:"100%"});
			full_path = item;
			root.innerHTML = info_inspector.root.outerHTML;
		}

		function getBehaviourNames(behaviours) {
			var names = [];
			for(var i in behaviours)
			{
				var beauty_name = behaviours[i].filename.replaceAll({"_":"_"});	
				names.push(beauty_name);
			}
			return names;
		}

		function oncomplete(data)
		{
			console.log(data);
			var new_hbt = new HBTGraph();
			new_hbt.graph.configure(data.behaviour);
			new_hbt.graph.context = hbt_context;
			hbt_graphs[new_hbt.name] = new_hbt;
			hbt_editor.graph_canvas.setGraph(new_hbt.graph);
			current_graph = hbt_graphs[new_hbt.name];
			hbt_editor.graph = current_graph;
		}
		function getBehaviourByFilename(behaviours, filename) {
			for(var i in behaviours)
				if(behaviours[i].filename == filename)
					return behaviours[i];
		}

    },

	exportBehaviour(graph_)
	{
		var behaviour_obj = {};
		var graph = graph_.serialize();
		var nodes = graph.nodes;
		for(var i in nodes)
		{   
			if(nodes[i].data)
				delete nodes[i].data["g_node"];
		}
		behaviour_obj = {"behaviour":graph};
		console.log(behaviour_obj);
		return behaviour_obj;
	}
	
}

CORE.registerModule( GraphManager );

class Graph{
    constructor(){
        var uid = this.uid = GraphManager.graphs.length;
        this.nodes = [];

        this.actions = {};

        this.graph = new LGraph();
        this.graph._module = this;

        GraphManager.graphs.push(this);
    }
}