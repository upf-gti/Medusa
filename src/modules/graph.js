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
                "Running" : {name:"Running", anims:[{anim:"Running",weight: 1}] , motion:5, speed:1},
                "Walking" : {name:"Walking",  anims:[{anim:"Walking",weight: 1}], motion:3, speed:1},
                "Idle" : {name:"Idle", anims:[{anim:"Idle",weight: 1}], motion:0, speed:0.5},
                "Old Walk" : {name:"Old_Man_Walk", anims:[{anim:"Old_Man_Walk",weight: 1}], motion:1, speed:0.9},
                "Umbrella" : {name:"Umbrella", anims:[{anim:"Umbrella",weight: 1}], motion:3, speed:1},
                "Debug" : {name:"Marcha", anims:[{anim:"Walking",weight: 1}, {anim:"Running",weight: 0.5}], motion:4, speed:1},
            };
            this.generic_nodes = this.generic_nodes || {
                "InTarget" : {name:"InTarget", threshold:200}
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
                    console.log(properties);
                    for( let p in properties )
                    {
                        let widget = null;
                        switch(properties[p].name.constructor.name)
                        {
                            case "String" : widget = inspector.addInfo( p, null, { key: p, callback: function(v){ properties[ this.options.key ] = v;  } });    break;
                        }
                        if(!widget) continue;
                        widget.addEventListener("dragstart", function(a)
                        {  
                            console.log(a);
                            var obj = properties[p];
                            obj = JSON.stringify(obj);
                            a.dataTransfer.setData("obj", obj);
                            a.dataTransfer.setData("type", "action"); 
                        });
                        widget.setAttribute("draggable", true);
                    }
                    inspector.endCurrentSection();

                    inspector.addSection("Generic nodes", {collapsed: false})
                    for( var t in properties2)
                    {
                        let widget2 = null;
                        switch(properties2[t].name.constructor.name)
                        {
                            case "String" : widget2 = inspector.addInfo( t, null, { key: t, callback: function(v){ properties2[ this.options.key ] = v;  } });    break;
                        }
                        if(!widget2) continue;
                        widget2.addEventListener("dragstart", function(a)
                        {  
                            var obj = properties2[t];
                            obj = JSON.stringify(obj);
                            console.log(obj);
                            a.dataTransfer.setData("obj", obj);
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

        CORE.GUI.menu.add("Load/+ Demos", { 
            callback:( ()=>{ 
                this.showLoadDialog()
            }).bind(this) 
        });
        CORE.GUI.menu.add("Save", { 
            callback:( ()=>{ 
                this.showSaveDialog()
            }).bind(this) 
        });

        // CORE.GUI.menu.add("Save", () => console.log("On developement") );


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
    },

    showLoadDialog(){
        if(!this.load_dialog){
            var load_dialog = this.load_dialog = new LiteGUI.Dialog( { id:"Settings", title:'Load Behavior', close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.load_dialog.setPosition(10,270);

        }
        var dlg = this.load_dialog;

        if(!this.load_inspector){
            var load_inspector = this.load_inspector = new LiteGUI.Inspector(),
                load_dialog = this.load_dialog;

            load_inspector.on_refresh = function()
            {
                load_inspector.clear();
                load_inspector.addTitle("Select Behavior"); 
                load_inspector.addSeparator();
                for(let i in CORE.Scene.behaviors)
                {
                    let behavior = CORE.Scene.behaviors[i];
                    load_inspector.addButton(i,"Load",{callback:function(){
                        // console.log("Loading: ", JSON.parse(behavior));
                        behavior = JSON.parse(behavior);
                        node_editor.graph.configure(behavior);
                        dlg.close();
                    }})
                }
                dlg.adjustSize();
            }

            this.load_dialog.add(load_inspector);
            load_inspector.refresh();
        }

        this.load_dialog.show('fade');
        this.load_dialog.setPosition(100,270);
    },

    showSaveDialog()
    {
        if(!this.save_dialog){
            var save_dialog = this.save_dialog = new LiteGUI.Dialog( { id:"Settings", title:'Save Behavior', close: true, minimize: false, width: 300, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.save_dialog.setPosition(10,270);

        }
        var dlg = this.save_dialog;

        if(!this.save_inspector){
            var save_inspector = this.save_inspector = new LiteGUI.Inspector(),
                save_dialog = this.save_dialog;

            save_inspector.on_refresh = function()
            {
                save_inspector.clear();
                var name = "";
                save_inspector.addTitle("Add a name to the Graph");
                save_inspector.addString("Name", null, {callback:function(v)
                {
                    name = v;
                }}); 
                save_inspector.addButton(null, "Save", {callback:function()
                {
                    if(name)
                    {
                        console.log("Name", name);
                        console.log(node_editor.graph.serialize());
                    }
                }})
                dlg.adjustSize();
            }

            this.save_dialog.add(save_inspector);
            save_inspector.refresh();
        }

        this.save_dialog.show('fade');
        this.save_dialog.setPosition(100,270);
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