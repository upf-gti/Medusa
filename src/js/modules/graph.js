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
        CORE.GUI.root.split("horizontal", [null, "45%"], true);
        this.panel = CORE.GUI.root.getSection(1);
        this.panel.id = "graph-area";
        CORE.GraphManager.panel.content.id = "graph-canvas";
        CORE.GUI.root = CORE.GUI.root.getSection(0);

        var stats = this.stats = document.createElement("div");
        stats.className = "stats";
        stats.innerText = "";
        CORE.GraphManager.panel.content.appendChild(stats);
    },

    init(){

        CORE.GUI.root.addEventListener("split_moved", this.resize.bind(this));
        window.addEventListener("resize", this.resize.bind(this));
    },

    postInit(){
        this.graphcanvas = node_editor.graph_canvas;
    },

    toogleGUI(){
        debugger;
    },

    createGUIParams( graph ){

        //Add the graph to menu
        // CORE.GUI.menu.add("Graphs/" + graph.uid, { callback: (()=> this.graphcanvas.setGraph(graph.graph)).bind(this) });
        // this.graphcanvas.setGraph(graph.graph);

        // //Put the add item on the last position again
        // CORE.GUI.menu.remove("Graphs/+ new Graph");
        // CORE.GUI.menu.add("Graphs/+ new Graph", () => new Graph() );


    },

    resize() {
        // console.log("graph resize");
        // if(!CORE.GraphManager.graphcanvas) return;
        // CORE.GraphManager.graphcanvas.setDirty(true);
        
        node_editor.graph_canvas.resize();
        
    },
    renderStats(){
        if(!this.stats)
            throw "stats div not created / ready yet";

        var text = "";

        if(agent_selected_name == null)
            text = "No agent selected"
        else
            text += "Current agent: " + agent_selected_name;
        this.stats.innerText = text;
    },

    getCanvasImage()
    {
        var canvas = node_editor.graph_canvas.canvas;
        var image = canvas.toDataURL("image/png");

        var aLink = document.createElement('a');

        aLink.download = 'image.png';
        aLink.href = image;
        document.body.appendChild(aLink);
        
        console.log(aLink);
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