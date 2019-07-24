//18/09/2018

class GUI{
    constructor(){
       
        LiteGUI.init();
        var main_area = this.root = new LiteGUI.Area({id:"main-area"});
        LiteGUI.add(main_area);

        main_area.split("vertical",["0px", null] );

        var menu = this.menu = new LiteGUI.Menubar("menu");
        this.menu.panel = main_area.getSection(0);
        this.menu.panel.content.parentElement.id = "menu-panel";
        this.node_info_dlg = null;
        this.node_info_insp= null;
        main_area.getSection(0).add(menu);


        this.root = main_area.getSection(1);
    }

    postInit(){
        this.toggleGUI( true );
    }
    init()
    {
        CORE.GUI.menu.add("Animations", (()=>{

            //Actions dialog
            this.actions = this.actions || {
                "Running" : {name:"Running", anims:[{anim:"Running",weight: 1}] , motion:6.2, speed:1},
                "Walking" : {name:"Walking",  anims:[{anim:"Walking",weight: 1}], motion:2.6, speed:1},
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
    
                this.dialog = new LiteGUI.Dialog({id:"available_anims", title:"Animations", close: true, minimize: false, width: 200, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
                var inspector = this.inspector = new LiteGUI.Inspector(),
                   properties = this.actions,
                   properties2 = this.generic_nodes,
                       dialog = this.dialog,
                          uid = this.uid;

                inspector.on_refresh = function(){
                    inspector.clear();


//                    inspector.addSection("Generic nodes", {collapsed: false})
//                    for( var t in properties2)
//                    {
//                        let widget2 = null;
//                        switch(properties2[t].name.constructor.name)
//                        {
//                            case "String" : widget2 = inspector.addInfo( t, null, { key: t, callback: function(v){ properties2[ this.options.key ] = v;  } });    break;
//                        }
//                        if(!widget2) continue;
//                        widget2.addEventListener("dragstart", function(a)
//                        {  
//                            var obj = properties2[t];
//                            obj = JSON.stringify(obj);
//                            console.log(obj);
//                            a.dataTransfer.setData("obj", obj);
//                            a.dataTransfer.setData("type", "intarget"); 
//                        });
//                        widget2.setAttribute("draggable", true);
//                    }
//                    inspector.endCurrentSection(s);
					
//					inspector.addSection("Animations", {collapsed: false})
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
							obj.filename = properties[p].name;
                            obj = JSON.stringify(obj);
                            a.dataTransfer.setData("obj", obj);
                            a.dataTransfer.setData("type", "action"); 
                        });
                        widget.setAttribute("draggable", true);
                    }
                    inspector.endCurrentSection();
                    dialog.adjustSize();
                };
                this.dialog.add(inspector);
                inspector.refresh();
            }

            this.dialog.show('fade');


        }).bind(this));

        CORE.GUI.menu.add("Tools/· Restart simulation", { 
            callback:( ()=>{ 
                CORE.Scene.restartScenario();
            }).bind(this) 
        });
        CORE.GUI.menu.add("Tools/· Populate scenario", { 
            callback:( ()=>{ 
                this.showPopulateDialog()
            }).bind(this) 
        });
        CORE.GUI.menu.add("Scene/· Load Resources/ · Behaviors", { 
            callback:( ()=>{ 
                this.showLoadBehaviorsDialog()
            }).bind(this) 
        });
        CORE.GUI.menu.add("Scene/· Load Resources/ · Animations", { 
            callback:( ()=>{ 
                this.showLoadAnimationsDialog()
            }).bind(this) 
        });
        
        CORE.GUI.menu.add("Scene/· Save", { 
            callback:( ()=>{ 
                this.showSaveDialog()
            }).bind(this) 
        });

		CORE.GUI.menu.add("Scene/· Settings", {
			callback:( ()=>{ 
                this.showSettingsDialog()
            }).bind(this) 
		});

//        CORE.GUI.menu.add("Help");
        CORE.GUI.menu.add("Help", {callback: function(){
            LiteGUI.alert("<a href='https://github.com/upf-gti/Sauce'>Github</a>", {title: "Help"});
//			LiteGUI.alert("Working on tutorials and guides", {title: "About"})
        }});
    }

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
                var num_agents = 10;
                var min_age = 5;
                var max_age = 90;
                populate_inspector.addNumber("Number of agents",10, {name_width:"40%", step:1, min:1, max:70, precision:0, callback:function(v)
                {
                    num_agents = v;
                }}); 
                populate_inspector.addSlider("Minimum age",5, {name_width:"40%", step:1 ,min:5, max:90, precision:0, callback:function(v)
                {
                    min_age = v;
                }}); 
                populate_inspector.addSlider("Maximum age",5, {name_width:"40%", step:1, min:5, max:90, precision:0, callback:function(v)
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

    }

    showLoadBehaviorsDialog()
    {
        var scene = null;
        var dialog = new LiteGUI.Dialog( { id: "dialog_load_scene", title:"Load Scene", close: true, minimize: true, width: 520, height: 350, scroll: false, draggable: true});
		dialog.show();

		var split = new LiteGUI.Split([50,50]);
		dialog.add( split );

		var right_pane_style = split.getSection(1).style;
		right_pane_style.backgroundColor = "black";
		right_pane_style.paddingLeft = "2px";
        var widgets = new LiteGUI.Inspector();
        var searchbox = widgets.addString( null, "", { placeHolder: "search...", immediate: true, callback: function(v){
            list.filter(v);
        }});
        var list = widgets.addList(null,CORE.Scene.behaviors, { height: 270, callback: inner_selected});//, callback_dblclick: inner_dblclick});
        widgets.addButton(null,"Load", { width: "100%",  callback: function(){
            console.log(scene);
            for(var i in scene.agents)
            {
                var agent = scene.agents[i];
                CORE.Scene.loadAgent(agent);
            }
            CORE.Scene.loadScene(scene.scene);
            node_editor.graph.configure(scene.behavior);
            animation_manager.loadAnimations(scene.animations);
            dialog.close();
        } });
        split.getSection(0).add( widgets );

        split.getSection(1).style.height = "100%";
        split.getSection(1).style.backgroundColor = "#333";
        split.getSection(1).style.paddingRight = "1px"; 
        split.getSection(1).style.paddingLeft = "1px"; 

        function inner_selected( item )
		{
            var root = split.getSection(1);
            scene = JSON.parse(item);
			var html = "<div class='load-icon' style='height:260px; background-size: cover;background-image: url(\"assets/bticon.png\")'></div><span class= 'load-behavior-info' style='font-size:1.2em'>Nodes: 38</span></br><span class= 'load-behavior-info' style='font-size:1.2em'>Description: Street with some interest points set</span>";
			root.innerHTML = html;
		}

    }
	openImportDialog(data, file)
	{
		var choice = LiteGUI.choice("", ["Import", "Cancel"], function(v){
			if(v == "Import")
			{
				CORE.Scene.loadScene(data.scene);
				node_editor.graph.configure(data.behavior);
				animation_manager.loadAnimations(data.animations);
			}
			
		}, { title: "Importing behaviour" });


		var import_inspector = new LiteGUI.Inspector();

		
		import_inspector.clear();
		import_inspector.addInfo("Filename  ", file.name || file.filename, {name_width:"40%"});
		import_inspector.addInfo("Size", file.size/1000 + " KB", {name_width:"40%"});

		choice.content.prepend(import_inspector.root);
	
	}

    showLoadAnimationsDialog()
    {
 

    }

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
    }

	showSettingsDialog()
    {
        if(!this.settings_dialog){
            var settings_dialog = this.settings_dialog = new LiteGUI.Dialog( { id:"settings_dialog", title:'Settings', close: true, minimize: false, width: 200, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
//            this.settings_dialog.setPosition(document.body.clientWidth/2 - 150,200);

        }
        var dlg = this.settings_dialog;

        if(!this.save_inspector){
            var save_inspector = this.save_inspector = new LiteGUI.Inspector(),
                settings_dialog = this.settings_dialog;

            save_inspector.on_refresh = function()
            {
                save_inspector.clear();
                var name = "";
                save_inspector.addCheckbox("Render_performance", RENDER_FPS, {name_width:"77%",callback:function(v)
                {
                    RENDER_FPS = v;
					if(v)
						$(stats.dom).show();
					else
						$(stats.dom).hide();
                }}); 

                save_inspector.addCheckbox("Render_paths", RENDER_PATHS, {name_width:"77%", callback:function(v)
                {
                    RENDER_PATHS = v;
					if(v){
					
						var node = GFX.scene._nodes_by_id["Path"];
						if(node)
							node.visible = true;
					}
					else{
						var node = GFX.scene._nodes_by_id["Path"];
						if(node)
							node.visible = false;
					}
                }}); 

				save_inspector.addCheckbox("Render_scenario", RENDER_PATHS, {name_width:"77%", callback:function(v)
                {
                    RENDER_PATHS = v;
					if(v)
						scenario.visible = true;
					else
						scenario.visible = false;
                }}); 
               
                dlg.adjustSize();
            }

            this.settings_dialog.add(save_inspector);
            save_inspector.refresh();
        }

        this.settings_dialog.show('fade');
//        this.settings_dialog.setPosition(document.body.clientWidth/2 - 150,200);
    }
    /**
     * Toggle between displaying or hidding the content.
     * @param {boolean} v - true : display, false : hide
     */
    toggleGUI ( v ){
        document.body.style.opacity = (!!v)? 1.0 : 0.0;
    }


    showNodeInfo( node )
    {
        // console.log(node);
        // if(!this.node_info_dlg){
        //     var node_info_dlg = this.node_info_dlg = new LiteGUI.Dialog( { id:"Node_info", title:'Node info', close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
        //     this.node_info_dlg.setPosition(window.width,window.height);

        // }
        // var dlg = this.node_info_dlg;

        // if(!this.node_info_insp){
        //     var node_info_insp = this.node_info_insp = new LiteGUI.Inspector(),
        //         node_info_dlg = this.node_info_dlg;

        //     node_info_insp.on_refresh = function()
        //     {
        //         node_info_insp.clear();
        //         node_info_insp.addTitle(node.title);
        //         console.log(node.data.limit_value); 
        //         node_info_insp.addNumber("Threshold", node.data.limit_value, {callback: function(v)
        //         {
        //             node.data.limit_value = v;
        //         }}); 
        //         node_info_insp.addSeparator();
        //         dlg.adjustSize();
        //     }

        //     this.node_info_dlg.add(node_info_insp);
        //     node_info_insp.refresh();
        // }
        // this.node_info_dlg.show('fade');
        // this.node_info_dlg.setPosition(100,270);
    }
}

CORE.registerModule( GUI );