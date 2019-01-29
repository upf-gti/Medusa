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
        stats.innerText = "";
        CORE.GraphManager.panel.content.appendChild(stats);
    },

    init(){

        CORE.GUI.root.addEventListener("split_moved", this.resize.bind(this));
        window.addEventListener("resize", this.resize.bind(this));

        // CORE.GUI.menu.add("Graphs/· New Graph", () => console.log("On developement") );

        CORE.GUI.menu.add("Actions/· List of Nodes", (()=>{

            //Actions dialog
            this.actions = this.actions || {
                "Running" : {name:"Running", anims:[{anim:"Running",weight: 1}] , motion:5, speed:1},
                "Walking" : {name:"Walking",  anims:[{anim:"Walking",weight: 1}], motion:3, speed:1},
                "Idle" : {name:"Idle", anims:[{anim:"Idle",weight: 1}], motion:0, speed:0.5},
                "Old Walk" : {name:"Old_Man_Walk", anims:[{anim:"Old_Man_Walk",weight: 1}], motion:1, speed:0.9},
                "Umbrella" : {name:"Umbrella", anims:[{anim:"Umbrella",weight: 1}], motion:3, speed:1},
                // "StandUp" : {name:"StandUp", anims:[{anim:"StandUp",weight: 1}], motion:0, speed:1},
                // "Fall" : {name:"Fall", anims:[{anim:"Tripping",weight: 1}], motion:0, speed:1},
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
                            // console.log(a);
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

        CORE.GUI.menu.add("Actions/· Restart simulation", { 
            callback:( ()=>{ 
                CORE.Scene.restartScenario();
            }).bind(this) 
        });
        CORE.GUI.menu.add("Actions/· Populate scenario", { 
            callback:( ()=>{ 
                this.showPopulateDialog()
            }).bind(this) 
        });
        CORE.GUI.menu.add("Scene/· Load Resources", { 
            callback:( ()=>{ 
                this.showLoadDialog()
            }).bind(this) 
        });
        CORE.GUI.menu.add("Scene/· Save", { 
            callback:( ()=>{ 
                this.showSaveDialog()
            }).bind(this) 
        });
        // CORE.GUI.menu.add("Actions/· Capture Behavior", { 
        //     callback:( ()=>{ 
        //         this.getCanvasImage()
        //     }).bind(this) 
        // });

    },

    postInit(){
        this.graphcanvas = node_editor.graph_canvas;
        CORE.GUI.menu.add("Help");
        CORE.GUI.menu.add("Help/· About", {callback: function(){
            LiteGUI.alert("<a href='https://github.com/upf-gti/Sauce'>SAUCE PROJECT Github</a>", {title: "About"})
        }});
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
    showPopulateDialog(){
        if(!this.populate_dialog){
            var populate_dialog = this.populate_dialog = new LiteGUI.Dialog( { id:"populate_scenario", title:'Populate Scenario', close: true, minimize: false, width: 300, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.populate_dialog.setPosition(document.body.clientWidth/2 - 150,200);

        }
        var dlg = this.populate_dialog;

        if(!this.populate_inspector){
            var populate_inspector = this.populate_inspector = new LiteGUI.Inspector(),
                populate_dialog = this.populate_dialog;

            populate_inspector.on_refresh = function()
            {
                populate_inspector.clear();
                var num_agents = 1;
                var min_age = 1;
                var max_age = 100;
                populate_inspector.addNumber("Number of agents",1, {name_width:"40%",step:1, min:1, max:10, callback:function(v)
                {
                    num_agents = v;
                }}); 
                populate_inspector.addSlider("Minimum age",1, {name_width:"40%", step:1 ,min:5, max:100, callback:function(v)
                {
                    min_age = v;
                }}); 
                populate_inspector.addSlider("Maximum age",1, {name_width:"40%", step:1, min:5, max:100, callback:function(v)
                {
                    max_age = v;
                }}); 
                populate_inspector.addButton(null, "Populate", {callback:function(){
                    console.log(num_agents);
                    console.log(min_age);
                    console.log(max_age);
                    CORE.Scene.populateScenario(num_agents, min_age, max_age); //dentro de la función rellenar los parametros de las propiedades, elegir paths, etc
                    dlg.close();
                }}) 
                
                dlg.adjustSize();
            }

            this.populate_dialog.add(populate_inspector);
            populate_inspector.refresh();
        }

        this.populate_dialog.show('fade');
        this.populate_dialog.setPosition(document.body.clientWidth/2 - 150,200);

    },

    showLoadDialog(){
        if(!this.load_dialog){
            var load_dialog = this.load_dialog = new LiteGUI.Dialog( { id:"load_dialog", title:'Load', close: true, minimize: false, width: 600, height: 700, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.load_dialog.setPosition(document.body.clientWidth/2 - 300,200);

        }
        var dlg = this.load_dialog;

        if(!this.load_inspector){
            var docked = new LiteGUI.Panel("load_panel");
            var tabs_widget = new LiteGUI.Tabs();
            tabs_widget.addTab("Animations",{width:"100%"});
            tabs_widget.addTab("Behaviors", {width:"100%"});
            
            
            var load_inspector = this.load_inspector = new LiteGUI.Inspector(),
            load_dialog = this.load_dialog;
            
            load_inspector.on_refresh = function()
            {
                load_inspector.clear();
                // load_inspector.addTitle("Select Behavior"); 
                load_inspector.addString("Filter", "", {callback:function(v){
                    
                }}); 
                load_inspector.addSeparator();
                
                if(isEmpty(CORE.Scene.behaviors))
                return;
                load_inspector.widgets_per_row = 2;
                for(let i in CORE.Scene.behaviors)
                {
                    let scene = CORE.Scene.behaviors[i];
                    load_inspector.addIcon(null, null, {width:40, height:40,image:"src/assets/bticon.png"});    
                    load_inspector.addButton(i,"Load",{width:500,name_width:"70%", callback:function(){
                        // console.log("Loading: ", JSON.parse(behavior));
                        scene = JSON.parse(scene);
                        console.log(scene);
                        // debugger;
                        for(var i in scene.agents)
                        {
                            var agent = scene.agents[i];
                            CORE.Scene.loadAgent(agent);
                        }
                        CORE.Scene.loadScene(scene.scene);
                        node_editor.graph.configure(scene.behavior);
                        animation_manager.loadAnimations(scene.animations);
                        dlg.close();
                    }})
                }
                dlg.adjustSize();
            }

            var load_inspector2 = this.load_inspector2 = new LiteGUI.Inspector();
            load_inspector2.on_refresh = function()
            {
                load_inspector2.clear();
                // load_inspector2.addTitle("Select Behavior"); 
                load_inspector2.addString("Filter", "", {callback:function(v){
                    
                }}); 
                load_inspector2.addSeparator();
                
                if(isEmpty(CORE.Scene.behaviors))
                return;
                
                for(let i in animation_manager.animations)
                {
                    console.log("bla");
                    let scene = CORE.Scene.behaviors[i];
                    load_inspector2.addButton(i,"Load",{name_width:"70%",callback:function(){
                        // console.log("Loading: ", JSON.parse(behavior));
                       
                        dlg.close();
                    }})
                }
                dlg.adjustSize();
            }
            
            $(tabs_widget.getTabContent("Behaviors")).append(load_inspector.root);
            $(tabs_widget.getTabContent("Animations")).append(load_inspector2.root);

            docked.add( tabs_widget );
            this.load_dialog.add(docked);
        }
        this.load_inspector.refresh();
        this.load_inspector2.refresh();
        this.load_dialog.show('fade');
        this.load_dialog.setPosition(document.body.clientWidth/2 - 300,200);
    },

    showSaveDialog()
    {
        if(!this.save_dialog){
            var save_dialog = this.save_dialog = new LiteGUI.Dialog( { id:"save_dialog", title:'Save Behavior', close: true, minimize: false, width: 300, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.save_dialog.setPosition(document.body.clientWidth/2 - 150,200);

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
                        var scene_obj = {};
                        console.log("Name", name);
                        var graph = node_editor.graph.serialize();
                        var nodes = graph.nodes;
                        for(var i in nodes)
                        {   
                            if(nodes[i].data)
                                delete nodes[i].data["g_node"];
                        }
                        scene_obj.behavior = graph;
                        // var agents = CORE.AgentManager.save_agents();
                        // scene_obj.agents = agents;
                        scene_obj.scene = CORE.Scene.properties;
                        scene_obj.animations = animation_manager.animations_names;
                        console.log(scene_obj);
                        console.log(JSON.stringify(scene_obj));
                        var saveScene = function (scene, exportName){
                            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scene));
                            var downloadAnchorNode = document.createElement('a');
                            downloadAnchorNode.setAttribute("href",     dataStr);
                            downloadAnchorNode.setAttribute("download", exportName + ".json");
                            document.body.appendChild(downloadAnchorNode); // required for firefox
                            downloadAnchorNode.click();
                            downloadAnchorNode.remove();
                        }
                        saveScene(scene_obj, name);
                        dlg.close();
                    }
                }})
                dlg.adjustSize();
            }

            this.save_dialog.add(save_inspector);
            save_inspector.refresh();
        }

        this.save_dialog.show('fade');
        this.save_dialog.setPosition(document.body.clientWidth/2 - 150,200);
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