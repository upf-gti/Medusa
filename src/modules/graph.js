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
    },

    init(){

        CORE.GUI.root.addEventListener("split_moved", this.resize.bind(this));
        window.addEventListener("resize", this.resize.bind(this));

        CORE.GUI.menu.add("Graphs/+ new Graph", () => new Graph() );


        CORE.GUI.menu.add("Actions", (()=>{

            //Actions dialog
            this.actions = this.actions || {
                "Running" : "Running",
                "Walking" : "Walking",
                "Idle": "Idle"
            };

            if(!this.dialog){
    
                this.dialog = new LiteGUI.Dialog({id:"Actions", title:"Actions", close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
                var inspector = this.inspector = new LiteGUI.Inspector(),
                   properties = this.actions,
                       dialog = this.dialog,
                          uid = this.uid;

                inspector.on_refresh = function(){
                    inspector.clear();
                    for( var p in properties ){
                        let widget = null;
                        switch(properties[p].constructor.name){
                            case "String" : widget = inspector.addInfo( p, null, { key: p, callback: function(v){ properties[ this.options.key ] = v;  } });    break;
                        }
                        if(!widget) continue;
                        widget.addEventListener("dragstart", function(a){  
                            a.dataTransfer.setData("text", a.srcElement.children[0].title);
                            a.dataTransfer.setData("type", "action"); 
                        });
                        widget.setAttribute("draggable", true);
                    }
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