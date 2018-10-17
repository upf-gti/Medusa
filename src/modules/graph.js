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

    preInit(){
        CORE.GUI.root.split("horizontal", [null, "40%"], true);
        this.panel = CORE.GUI.root.getSection(1);
        CORE.GraphManager.panel.content.id = "graph-canvas";
        CORE.GUI.root = CORE.GUI.root.getSection(0);

        var stats = this.stats = document.createElement("div");
        stats.className = "stats";
        stats.innerText = "jkwdhvfjwev";
        CORE.GraphManager.panel.content.appendChild(stats);
    },

    init(){

        CORE.GUI.root.addEventListener("split_moved", this.resize.bind(this));
        window.addEventListener("resize", this.resize.bind(this));

        CORE.GUI.menu.add("Graphs/+ new Graph", () => console.log("On developement") );


        CORE.GUI.menu.add("Nodes", (()=>{

            //Actions dialog
            this.actions = this.actions || {
                "Running" : "Running",
                "Walking" : "Walking",
                "Idle": "Idle", 
                "Old_Man_Walk": "Old_Man_Walk"
            };
            this.generic_nodes = this.generic_nodes || {
                "InTarget" : "InTarget"
            }

            if(!this.dialog){
    
                this.dialog = new LiteGUI.Dialog({id:"Nodes", title:"Nodes", close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
                var inspector = this.inspector = new LiteGUI.Inspector(),
                   properties = this.actions,
                   properties2 = this.generic_nodes,
                       dialog = this.dialog,
                          uid = this.uid;

                inspector.on_refresh = function(){
                    inspector.clear();
                    inspector.addSection("Actions", {collapsed: false})
                    for( var p in properties )
                    {
                        let widget = null;
                        switch(properties[p].constructor.name)
                        {
                            case "String" : widget = inspector.addInfo( p, null, { key: p, callback: function(v){ properties[ this.options.key ] = v;  } });    break;
                        }
                        if(!widget) continue;
                        widget.addEventListener("dragstart", function(a)
                        {  
                            a.dataTransfer.setData("text", a.srcElement.children[0].title);
                            a.dataTransfer.setData("type", "action"); 
                        });
                        widget.setAttribute("draggable", true);
                    }
                    inspector.endCurrentSection();

                    inspector.addSection("Generic nodes", {collapsed: false})
                    for( var t in properties2)
                    {
                        let widget2 = null;
                        switch(properties2[t].constructor.name)
                        {
                            case "String" : widget2 = inspector.addInfo( t, null, { key: t, callback: function(v){ properties2[ this.options.key ] = v;  } });    break;
                        }
                        if(!widget2) continue;
                        widget2.addEventListener("dragstart", function(a)
                        {  
                            a.dataTransfer.setData("text", a.srcElement.children[0].title);
                            a.dataTransfer.setData("type", "intarget"); 
                        });
                        widget2.setAttribute("draggable", true);
                    }
                    inspector.endCurrentSection();

                    dialog.adjustSize();
                };
                this.dialog.add(inspector);
                inspector.refresh();
            }

            this.dialog.show('fade');


        }).bind(this));

        // var canvas = document.querySelectorAll("#graph-canvas");

        // if(!canvas.length){
        //     canvas = document.createElement("canvas");
        //     canvas.id = "graph-canvas";
        //     this.panel.content.appendChild(canvas);
        // }

       //this.graphcanvas = new LGraphCanvas("#graph-canvas", null, {autoresize:true});
    },

    postInit(){
        this.graphcanvas = node_editor.graph_canvas;
    },

    toogleGUI(){
        debugger;
    },

    createGUIParams( graph ){

        //Add the graph to menu
        CORE.GUI.menu.add("Graphs/" + graph.uid, { callback: (()=> this.graphcanvas.setGraph(graph.graph)).bind(this) });
        this.graphcanvas.setGraph(graph.graph);

        //Put the add item on the last position again
        CORE.GUI.menu.remove("Graphs/+ new Graph");
        CORE.GUI.menu.add("Graphs/+ new Graph", () => new Graph() );


    },

    resize() {
        if(!CORE.GraphManager.graphcanvas) return;
        CORE.GraphManager.graphcanvas.setDirty(true);
        if(!this.graphcanvas || !this.graphcanvas.canvas) return;

        // Lookup the size the browser is displaying the canvas.
        var displayWidth  = this.graphcanvas.canvas.parentElement.offsetWidth;
        var displayHeight = this.graphcanvas.canvas.parentElement.offsetHeight;
       
        // Check if the canvas is not the same size.
        if (this.graphcanvas.canvas.width  != displayWidth ||
            this.graphcanvas.canvas.height != displayHeight) {
       
          // Make the canvas the same size
          this.graphcanvas.canvas.width  = displayWidth;
          this.graphcanvas.canvas.height = displayHeight;
        }
        
    },
    renderStats(){
        if(!this.stats)
            throw "stats div not created / ready yet";

        var text = "";

        if(agent_selected == null)
            text = "No agent selected"
        else
            text += "Current agent: " + agent_selected;
        this.stats.innerText = text;
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