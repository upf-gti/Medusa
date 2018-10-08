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
        CORE.GUI.menu.add("Graphs/+ new Graph", () => new Graph() );

        CORE.GUI.root.split("horizontal", [null, "25%"], true);
        this.panel = CORE.GUI.root.getSection(1);
        CORE.GUI.root = CORE.GUI.root.getSection(0);
    },

    init(){

        var canvas = document.querySelectorAll("#graph-canvas");

        if(!canvas.length){
            canvas = document.createElement("canvas");
            canvas.id = "graph-canvas";
            this.panel.content.appendChild(canvas);
        }

        CORE.GUI.root.addEventListener("split_moved", this.resize.bind(this));
        window.addEventListener("resize", this.resize.bind(this));
    
       this.graphcanvas = new LGraphCanvas("#graph-canvas", null, {autoresize:true});
    },

    toogleGUI(){
        debugger;
    },

    createGUIParams( graph ){

        //Add the graph to menu
        CORE.GUI.menu.add("Graphs/" + graph.uid, { callback: (()=> this.graphcanvas.setGraph(graph.graph)).bind(this) });
        debugger;
        this.graphcanvas.setGraph(graph.graph);

        //Put the add item on the last position again
        CORE.GUI.menu.remove("Graphs/+ new Graph");
        CORE.GUI.menu.add("Graphs/+ new Graph", () => new Graph() );

    },

    resize() {
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

        this.graph = new LGraph();
        this.graph._module = this;

        GraphManager.graphs.push(this);
    }
}