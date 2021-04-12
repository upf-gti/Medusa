//18/09/2018

class GUI{
    constructor(){
       

    }
	preInit()
	{
        LiteGUI.init();
        var main_area = this.root = new LiteGUI.Area({id:"main-area"});
        LiteGUI.add(main_area);
        //split into right and left
        main_area.split("horizontal",[null, "60%"], true );
        this.left_area = main_area.getSection(0);
        this.right_area = main_area.getSection(1);

        //menu & 3D scene
        this.left_area.split("vertical", ["31px", null]);
        this.menu_area = this.left_area.getSection(0);
        this.player_area = this.left_area.getSection(1);

        //graph & inspector
        this.right_area.split("horizontal",["75%", null], true );
        this.graph_area = this.right_area.getSection(0);
        this.inspector_area = this.right_area.getSection(1);

        //add menu
        var menu = this.menu = new LiteGUI.Menubar("menu");
        this.menu.panel = this.menu_area;
        this.menu.panel.content.parentElement.id = "menu-panel";
        this.menu_area.add(menu);


        this.node_info_dlg = null;
        this.node_info_insp= null;

        
		CORE.GUI.menu.add("Scene/· New empty", { 
            callback:( ()=>{ 
               this.openNewSceneDialog();
            }).bind(this) 
        });
        
		CORE.GUI.menu.add("Scene/· Load Project", { 
            callback:( ()=>{ 
//                CORE.Scene.loadProject();
            }).bind(this) 
        });


		CORE.GUI.menu.add("Scene/· Load Resources/ · Scene Setup", { 
            callback:( ()=>{ 
                this.showLoadBehaviorsDialog()
            }).bind(this) 
        });

		CORE.GUI.menu.add("Scene/· Save Project", { 
            callback:( ()=>{ 
//                CORE.Scene.saveProject();	
            }).bind(this) 
        });

        CORE.GUI.menu.add("Scene/· Load Resources/ · Animations", { 
            callback:( ()=>{ 
                this.showLoadAnimationsDialog()
            }).bind(this) 
        });
        
        CORE.GUI.menu.add("Scene/· Save Scenario", { 
            callback:( ()=>{ 
                this.showSaveSceneDialog()
            }).bind(this) 
        });


		CORE.GUI.menu.add("Scene/· Settings", {
			callback:( ()=>{ 
                this.showSettingsDialog()
            }).bind(this) 
		});
	}

    postInit(){
        this.toggleGUI( true );
    }
    init()
    {

		CORE.GUI.menu.add("Tools/· Create/· Path", { 
            callback:( ()=>{ 
				CORE.Player.showPopUpMessage();
				document.getElementById("main_canvas").style.cursor = "cell";
				scene_mode = PATH_CREATION_MODE;
				var new_path = new Path();
				path_manager.addPath(new_path);
				current_path = new_path;
                this.showCreatePathDialog();            
			}).bind(this) 
        });
        CORE.GUI.menu.add("Tools/· Populate/· Add Group", { 
            callback:( ()=>{ 
				CORE.Player.showPopUpMessage("Click the floor to set the center of the group", "rgba(220, 170, 0, 0.5)", "50%");
				document.getElementById("main_canvas").style.cursor = "cell";
				scene_mode = POPULATE_CREATION_MODE;
//                this.showPopulateDialog();
            }).bind(this) 
        });

		CORE.GUI.menu.add("Tools/· Restart simulation", { 
            callback:( ()=>{ 
                CORE.Scene.restartSimulation()
            }).bind(this) 
        });

		CORE.GUI.menu.add("Tools/· Stream simulation", { 
            callback:( ()=>{ 
                this.showOpenStreamDialog();
            }).bind(this) 
        });



//        CORE.GUI.menu.add("Tools/· Populate/· Static group", { 
//            callback:( ()=>{ 
//				CORE.Player.showPopUpMessage();
//				document.getElementById("main_canvas").style.cursor = "cell";
//				scene_mode = STATIC_GROUP_CREATION_MODE;
////                this.showPopulateStaticDialog();
//            }).bind(this) 
//        });
//
//		CORE.GUI.menu.add("Tools/· Populate/· Respawn path", { 
//            callback:( ()=>{ 
//				CORE.Player.showPopUpMessage();
//				document.getElementById("main_canvas").style.cursor = "cell";
//				scene_mode = PATH_CREATION_MODE;
//				var new_path = new RespawningPath();
//				path_manager.addPath(new_path);
//				current_respawn_path = new_path;
//                this.showPopulateRespawnDialog();
//            }).bind(this) 
//        });


        CORE.GUI.menu.add("Help");
        CORE.GUI.menu.add("Help/· About", {callback: function(){
//            LiteGUI.alert("<a href='https://github.com/upf-gti/Sauce'>SAUCE PROJECT Github</a>", {title: "About"});
			LiteGUI.alert("Working on tutorials and guides", {title: "About"})
        }});

		CORE.GUI.menu.add("Help/· Keyboard shortcurts", { 
            callback:( ()=>{ 
                this.showShortcuts();
            }).bind(this) 
        });
    }
    showShortcuts()
    {
        if(!this.shortcut_dialog){
            var shortcut_dialog = this.shortcut_dialog = new LiteGUI.Dialog( { id:"shortcut_dialog", title:'Medusa Keyboard Shortcuts', close: true, minimize: false, width: 400, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.shortcut_dialog.setPosition(document.body.clientWidth/2 - 150,200);

        }
        var dlg = this.shortcut_dialog;

        if(!this.shortcut_inspector){
            var shortcut_inspector = this.shortcut_inspector = new LiteGUI.Inspector(),
                shortcut_dialog = this.shortcut_dialog;

            shortcut_inspector.on_refresh = function()
            {
                shortcut_inspector.clear();
                // shortcut_inspector.addTitle("Medusa");
                shortcut_inspector.addInfo("KEYBOARD", "ACTION",{name_width:"40%"})
                shortcut_inspector.addSeparator()
                shortcut_inspector.addInfo("Arrows", "Camera move on plane XZ",{name_width:"40%"})
                shortcut_inspector.addInfo("Double click on graph", "Search node by name",{name_width:"40%"})
                shortcut_inspector.addInfo("Esc", "Set Navigation camera mode",{name_width:"40%"})
                shortcut_inspector.addInfo("F6", "Reload the project",{name_width:"40%"})
                shortcut_inspector.addInfo("G", "Show Gizmo",{name_width:"40%"})
                shortcut_inspector.addInfo("Shift+Backspace", "Delete selected agent",{name_width:"40%"})
                shortcut_inspector.addInfo("Shift+C (No agent selected)", "Center the camera target",{name_width:"40%"})
                shortcut_inspector.addInfo("Shift+C", "Center agent on the origin",{name_width:"40%"})
                shortcut_inspector.addInfo("Shift+N", "Clean scene / New scene",{name_width:"40%"})
                shortcut_inspector.addInfo("Shift+R", "Reset scenario",{name_width:"40%"})
                shortcut_inspector.addInfo("Supr", "Remove selected graph node",{name_width:"40%"})
                shortcut_inspector.addSeparator()
                shortcut_inspector.addInfo("MOUSE", "ACTION",{name_width:"40%"})
                shortcut_inspector.addSeparator()
                shortcut_inspector.addInfo("Left click drag", "Camera Orbit",{name_width:"40%"})
                shortcut_inspector.addInfo("Right click drag", "Camera move on plane XZ",{name_width:"40%"})
                dlg.adjustSize();
            }

            this.shortcut_dialog.add(shortcut_inspector);
            shortcut_inspector.refresh();
        }

        this.shortcut_dialog.show('fade');
        this.shortcut_dialog.setPosition(document.body.clientWidth/2 - 150,200);
    }
	showCreatePathDialog()
	{
		if(!this.create_path_dialog){
            var create_path_dialog = this.create_path_dialog = new LiteGUI.Dialog( { id:"populate_scenario", title:'Create Path',  close: true, minimize: false, width: 150, height: 100, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.create_path_dialog.setPosition(5,260);

        }
        var dlg = this.create_path_dialog;

        if(!this.create_path_inspector){
            var create_path_inspector = this.create_path_inspector = new LiteGUI.Inspector(),
                create_path_dialog = this.create_path_dialog;

            create_path_inspector.on_refresh = function()
            {
                create_path_inspector.clear();

                create_path_inspector.addButton(null, "End path creation", {callback:function(){
					
					scene_mode = NAV_MODE;
                    document.getElementById("main_canvas").style.cursor = "default";
					if(current_path.guide_line)
						current_path.guide_line.destroy(true);
					delete current_path.guide_line;
					CORE.Player.disableModeButtons(this.id);
                    var btn = document.getElementById("navigate-mode-btn");                    
					if(!btn.classList.contains("active"))
					{
						btn.classList.add("active");
					}
					dlg.close();
                }}) 
                
                dlg.adjustSize();
            }
			create_path_dialog.on_close = function(){
					scene_mode = NAV_MODE;
					document.getElementById("main_canvas").style.cursor = "default";
					if(current_path.guide_line)
                        current_path.guide_line.destroy(true);
                    
                    if( current_path.control_points.length < 2 )
                    {
                        if( current_path.control_points.length == 1 )
                            GFX.scene.root.removeChild(current_path.control_points[0]);
                        delete(path_manager._paths[current_path.id])
                        CORE.Player.showPopUpMessage("Path not added. Path must have a minimum of 2 control points", "rgba(255,0,0,0.5)", "40%");
                    }

					CORE.Player.disableModeButtons(this.id);
					var btn = document.getElementById("navigate-mode-btn");
					if(!btn.classList.contains("active"))
					{
						btn.classList.add("active");
					}
//					dlg.close();
			}
            this.create_path_dialog.add(create_path_inspector);
            create_path_inspector.refresh();
        }

        this.create_path_dialog.show('fade');
        this.create_path_dialog.setPosition(5,260);
		console.log("ToDo");
    }
    /* DIALOG FOR THE AREAS */
    showCreateAreaDialog()
    {
        if(!this.create_agent_dialog){
            var create_agent_dialog = this.create_agent_dialog = new LiteGUI.Dialog( { id:"populate_scenario", title:'Create Area', close: true, minimize: false, width: 150, height: 100, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.create_agent_dialog.setPosition(5,260);

        }
        var dlg = this.create_agent_dialog;

        if(!this.create_area_inspector){
            var create_area_inspector = this.create_area_inspector = new LiteGUI.Inspector(),
                create_agent_dialog = this.create_agent_dialog;

            create_area_inspector.on_refresh = function()
            {
                create_area_inspector.clear();
                create_area_inspector.addInfo("Property", "Value");
                create_area_inspector.addButton(null, "Create smart area", {callback:function(){
					
					scene_mode = NAV_MODE;
					document.getElementById("main_canvas").style.cursor = "default";
                    if(current_area)
                    {
                        current_area.fromvertices();
                        current_area.node.color = current_area.color;
                        current_area.node.flags.two_sided = true;
                        GFX.scene.root.addChild(current_area.node);	
                        current_area = null;
                    }
                        
					CORE.Player.disableModeButtons(this.id);
					var btn = document.getElementById("navigate-mode-btn");
					if(!btn.classList.contains("active"))
					{
						btn.classList.add("active");
					}
					dlg.close();
                }}) 
                
                dlg.adjustSize();
            }
			create_agent_dialog.on_close = function(){
					scene_mode = NAV_MODE;
					document.getElementById("main_canvas").style.cursor = "default";
                    // if(current_area)
                    // {
                    //     //first delete nodes
                    //     current_area = null;
                    // }
                        

					CORE.Player.disableModeButtons(this.id);
					var btn = document.getElementById("navigate-mode-btn");
					if(!btn.classList.contains("active"))
					{
						btn.classList.add("active");
					}
//					dlg.close();
			}
            this.create_agent_dialog.add(create_area_inspector);
            create_area_inspector.refresh();
        }

        this.create_agent_dialog.show('fade');
        this.create_agent_dialog.setPosition(5,270);
    }
	showPopulateRespawnDialog()
	{
		 if(!this.populate_respawn_dialog){
            var populate_respawn_dialog = this.populate_respawn_dialog = new LiteGUI.Dialog( { id:"populate_scenario", title:'Populate Scenario', close: true, minimize: false, width: 300, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.populate_respawn_dialog.setPosition(document.body.clientWidth/4 - 150,200);

        }
        var dlg = this.populate_respawn_dialog;

        if(!this.populate_respawn_inspector){
            var populate_respawn_inspector = this.populate_respawn_inspector = new LiteGUI.Inspector(),
                populate_respawn_dialog = this.populate_respawn_dialog;

            populate_respawn_inspector.on_refresh = function()
            {
                populate_respawn_inspector.clear();
                var num_agents = 10;
                var min_age = 5;
                var max_age = 90;
                populate_respawn_inspector.addNumber("Density",10, {name_width:"40%", step:1, min:1, max:70, precision:0, callback:function(v)
                {
                    current_respawn_path.density = v;
                }}); 
//                populate_respawn_inspector.addSlider("Minimum age",5, {name_width:"40%", step:1 ,min:5, max:90, precision:0, callback:function(v)
//                {
//                    min_age = v;
//                }}); 
//                populate_respawn_inspector.addSlider("Maximum age",5, {name_width:"40%", step:1, min:5, max:90, precision:0, callback:function(v)
//                {
//                    max_age = v;
//                }}); 
                populate_respawn_inspector.addButton(null, "End path creation", {callback:function(){
//                    console.log(num_agents);
//                    console.log(min_age);
//                    console.log(max_age);
//                    CORE.Scene.populateScenario(num_agents, min_age, max_age); //dentro de la función rellenar los parametros de las propiedades, elegir paths, etc
					scene_mode = NAV_MODE;
					document.getElementById("main_canvas").style.cursor = "default";

					dlg.close();
                }}) 
                
                dlg.adjustSize();
            }

            this.populate_respawn_dialog.add(populate_respawn_inspector);
            populate_respawn_inspector.refresh();
        }

        this.populate_respawn_dialog.show('fade');
        this.populate_respawn_dialog.setPosition(document.body.clientWidth/4 - 150,200);
		console.log("ToDo");
	}

	showPopulateDialog( position )
	{
		if(!this.populate_static_dialog){
            var populate_static_dialog = this.populate_static_dialog = new LiteGUI.Dialog( { id:"populate_scenario", title:'Add Group', close: true, minimize: false, width: 300, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.populate_static_dialog.setPosition(document.body.clientWidth/2 - 150,200);

        }
        var dlg = this.populate_static_dialog;
		var shapes = ["Circle", "Scattered"];
        var orientations = ["+Z", "-Z", "+X", "-X", "Center", "Random"];
        var extra_properties = [];
        window.g_pos = position;
        
        if(!this.populate_static_inspector){
            var populate_static_inspector = this.populate_static_inspector = new LiteGUI.Inspector(),
                populate_static_dialog = this.populate_static_dialog;

            populate_static_inspector.on_refresh = function(g_position)
            {
                populate_static_inspector.clear();
                var num_agents = 10;
                var shape = shapes[0];
				var orientation = orientations[0];
                var size = 400;
				var min_age = 5;
                var max_age = 90;
                var valence = 0;
                var arousal = 0;
                var behaviour = "by_default";
                var behaviours = Object.keys(hbt_graphs);
                
                var data_types = ["boolean", "number", "string"];


                populate_static_inspector.addSlider("Number of agents",Math.floor(num_agents), {name_width:"40%", step:1, min:1, max:70, precision:0, integer:true, callback:function(v)
                {
                    num_agents = Math.floor(v);
                }});
                populate_static_inspector.addSlider("Size",1500, {name_width:"40%", width:"100%", step:10 ,min:500, max:3000, precision:0, integer:true, callback:function(v)
                {
                    size = v;
                }}); 
				populate_static_inspector.addCombo("Looking at",orientations[0], {values: orientations, name_width:"40%", callback:function(v)
                {
                    orientation = v;
                }}); 


				populate_static_inspector.addSlider("Min age",5, {name_width:"40%", step:1 ,min:5, max:99, precision:0, integer:true, callback:function(v)
                {
                    min_age = v;
                }}); 
                populate_static_inspector.addSlider("Max age",5, {name_width:"40%", step:1, min:5, max:100, precision:0, integer:true, callback:function(v)
                {
                    max_age = v;
                }}); 
                populate_static_inspector.addSlider("Valence",0, {name_width:"40%", step:1, min:-100, max:100, precision:0, callback:function(v)
                {
                    valence = v;
                }}); 
                populate_static_inspector.addSlider("Arousal",0, {name_width:"40%", step:1, min:-100, max:100, precision:0, callback:function(v)
                {
                    arousal = v;
                }}); 
				populate_static_inspector.addCombo("Behaviour",behaviours[0], {values: behaviours, name_width:"40%", callback:function(v)
                {
                    behaviour = v;
                }}); 
                //for extra custom properties
                populate_static_inspector.addInfo("Extra properties", null );
                populate_static_inspector.addSeparator();	
                populate_static_inspector.widgets_per_row = 2;
                

                for(var i = 0; i<extra_properties.length; i++)
                    populate_static_inspector.addInfo(extra_properties[i].name, extra_properties[i].type );
                populate_static_inspector.addButton(null,"Clear", {callback:function(){extra_properties = []; populate_static_inspector.refresh()}})
                populate_static_inspector.addSeparator();	

                populate_static_inspector.widgets_per_row = 3;

				var _k,_v;
				populate_static_inspector.addString(null, "",  { width:"50%", placeHolder:"param name",  callback: v => _k = v });
                populate_static_inspector.addCombo(null,data_types[0], {values: data_types, width:"30%", name_width:"1%", callback:function(v)
                {
                    _v = v;
                }}); 				
                populate_static_inspector.addButton(null, "+", { width:40, callback: e => {
					if(!_k || !_v) 
						return;
					try{ 
						_v = JSON.parse('{ "v":'+_v+'}').v;
					}catch(e){
						//if fails it was a string, so leave it as the string it was.
                    }
					extra_properties.push({name:_k, type:_v}); 
					populate_static_inspector.refresh(); 
                }});
                populate_static_inspector.widgets_per_row = 1;

                populate_static_inspector.addButton(null, "Add static group", {callback:function()
				{
                    console.log(shape);
                    console.log(size);
                    console.log(orientation);
                    var data = {min_age_:min_age, max_age_:max_age, valence_:valence, arousal_:arousal, behaviour_:behaviour, extra:extra_properties};
                    console.log(data);
                    CORE.Scene.populateStaticGroup(window.g_pos, num_agents, shape, orientation, size, data); //dentro de la función rellenar los parametros de las propiedades, elegir paths, etc
                    dlg.close();
                }});

                dlg.adjustSize();
            }

            this.populate_static_dialog.add(populate_static_inspector);
            
        }
		this.populate_static_inspector.refresh();
        this.populate_static_dialog.show('fade');
        this.populate_static_dialog.setPosition(document.body.clientWidth/4 - 150,200);
		console.log("ToDo");
	}

    showLoadBehaviorsDialog()
    {
        debugger;
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
        var list = widgets.addList(null,CORE.Scene.ip_setups, { height: 270, callback: inner_selected});//, callback_dblclick: inner_dblclick});
        widgets.addButton(null,"Load", { width: "100%",  callback: function(){
            console.log(scene);

            CORE.Scene.loadScene(scene.scene);

            dialog.close();
        } });
        dialog.add( widgets );

        // split.getSection(1).style.height = "100%";
        // split.getSection(1).style.backgroundColor = "#333";
        // split.getSection(1).style.paddingRight = "1px"; 
        // split.getSection(1).style.paddingLeft = "1px"; 

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
		var title = "";
		if(data.scene) title = "Import Interest Points";
		else if(data.behaviour) title = "Import Behaviour";
		var choice = LiteGUI.choice("", [file ? "Import" : "Import All", "Cancel"], function(v){
			if(v.includes("Import"))
			{
                var k = file ? 1 : data.length;
                for(let i = 0; i < k; i++)
                {
                    var filename = file ? file.name : data[i].file.name;
                    var e_data = file ? data : data[i].data;
                    if(filename.split(".")[1] == "json")
                    {
                        if(e_data.behaviour)
                        {
                            // current_graph.graph.configure(e_data.behaviour);
                            var file_name = filename.split(".")[0]; 
                            var new_hbtgraph = new HBTGraph(file_name);
                            new_hbtgraph.graph.context = hbt_context;
                            new_hbtgraph.graph.configure(e_data.behaviour);

                            for(var n in new_hbtgraph.graph._nodes)
                            {
                                var node = new_hbtgraph.graph._nodes[n]
                                if(node.type == "btree/HBTproperty")
                                {
                                    var name = node.title;
                                    var type = node.combo.value;
                                    addPropertyToAgents(type, name)
                                }
                            }
                            hbt_graphs[file_name] = new_hbtgraph;
                        }
                            
                        if(e_data.scene)
                        {
                            CORE.Scene.loadScene(e_data.scene);
                            // CORE.Scene.sceneFromJSON(e_data.scene);
                            CORE.AgentManager.agentsFromJSON(e_data.agents);
                            path_manager.pathsFromJSON(e_data.paths);
                        }
                    }
                }
                CORE.GraphManager.top_inspector.refresh();
			}
			
		}, { title: title});

		var import_inspector = new LiteGUI.Inspector();
        import_inspector.clear();
        if(!file)
        {
            for(var j = 0; j<data.length; j++)
            {
                import_inspector.addInfo("Filename  ", data[j].file.name, {name_width:"40%"});
                import_inspector.addInfo("Size", data[j].file.size/1000 + " KB", {name_width:"40%"});
            }
        }
        else
        {
		    import_inspector.addInfo("Filename  ", file.name || file.filename, {name_width:"40%"});
            import_inspector.addInfo("Size", file.size/1000 + " KB", {name_width:"40%"});
        }
        
		choice.content.prepend(import_inspector.root);
	
    }
    
	openNewSceneDialog()
	{
		var choice = LiteGUI.choice("", [ "Accept", "Cancel"], function(v){
			if(v.includes("Accept"))
			{
                CORE.Scene.cleanScene();
                CORE.Scene.cleanScene();
                CORE.Scene.cleanScene();
                CORE.GraphManager.top_inspector.refresh();
			}
			
		}, { title: 'Delete current scene?'});	
    }
    
    openImportAnimationDialog(data, file)
	{
		var title = "Import Skanim animation";
		var choice = LiteGUI.choice("", ["Import", "Cancel"], function(v){
			if(v == "Import")
			{
				if(file.name.split(".")[1] == "skanim")
				{
					var anim = new SkeletalAnimation();
                    anim.fromData(data);
                    var filename = file.name.split(".")[0]; 
                    anim.name = filename;
	                animation_manager.animations[filename] = anim;
                    console.log(anim);
                    CORE.Scene.locomotions[filename.capitalize()] = {name:filename.capitalize(), anims:[{anim:filename,weight: 1}], motion:1, speed:1};
                    CORE.Scene.anim_inspector.refresh();
                    //upload to animations
				}

//				animation_manager.loadAnimations(data.animations);
			}
			
		}, { title: title});


		var import_inspector = new LiteGUI.Inspector();

		
		import_inspector.clear();
		import_inspector.addInfo("Filename  ", file.name || file.filename, {name_width:"40%"});
		import_inspector.addInfo("Size", file.size/1000 + " KB", {name_width:"40%"});

		choice.content.prepend(import_inspector.root);
	
	}

    showOpenStreamDialog( status )
    {
        /*Setup streamer*/
        
        
		if(!this.stream_dialog){
            var stream_dialog = this.stream_dialog = new LiteGUI.Dialog( { id:"populate_scenario", title:'Stream Characters', close: true, minimize: false, width: 300, height: 30, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.stream_dialog.setPosition(document.body.clientWidth/2 - 250,200);

        }
        var dlg = this.stream_dialog;
		this.stream_status = status;
		var s_status = this.stream_status

        if(!this.stream_inspector){
            var stream_inspector = this.stream_inspector = new LiteGUI.Inspector(),
                stream_dialog = this.stream_dialog;
		}	

		var that = this;
		this.stream_inspector.on_refresh = function()
		{
			var IP = "localhost:5557";
			var scale = 10;
            var frame_rate = 30;
            var scale_in_z = false;
            var scale_in_x = false;
            var rotateX180 = false;
            var rotateY180 = false;
            var rotateZ180 = false;
            var invertQuat = false;
            var invertQuat = false;
            var apply_character_rot = false;
			that.stream_inspector.clear();
		
			if(s_status && s_status.connected == true)
			{
				console.log(s_status);
				var text = "Connected to: " + s_status.ip +""
				that.stream_inspector.addInfo(text, null, {name_width:"100%"});
				that.stream_inspector.addButton(null, "Stop", {callback:function(){

					// streamer.close();
					scene_transfer.close();
					dlg.close();
				}});
			}

			else
			{
				that.stream_inspector.addString("IP adress",IP, {name_width:"40%", step:1, min:1, max:70, precision:0, callback:function(v)
				{
					IP = v;
				}});
				
				that.stream_inspector.addCheckbox("Scale -1 in Z",scale_in_z, {name_width:"40%",  callback:function(v)
				{
                    streamer.configuration.scale_in_z = v;
                    scale_in_z = v;
				}});
				that.stream_inspector.addCheckbox("Scale -1 in X",scale_in_x, {name_width:"40%",  callback:function(v)
				{
                    streamer.configuration.scale_in_x = v;
                    scale_in_x = v;
				}});
				that.stream_inspector.addCheckbox("Rotate 180 in X",rotateX180, {name_width:"40%",  callback:function(v)
				{
                    streamer.configuration.rotateX180 = v;
                    rotateX180 = v;
				}});
				that.stream_inspector.addCheckbox("Rotate 180 in Y",rotateY180, {name_width:"40%",  callback:function(v)
				{
                    streamer.configuration.rotateY180 = v;
                    rotateY180 = v;
				}});
				that.stream_inspector.addCheckbox("Rotate 180 in Z",rotateZ180, {name_width:"40%",  callback:function(v)
				{
                    streamer.configuration.rotateZ180 = v;
                    rotateZ180 = v;
				}});
				that.stream_inspector.addCheckbox("Invert quaternions",invertQuat, {name_width:"40%", callback:function(v)
				{
                    streamer.configuration.invertQuat = v;
                    invertQuat = v;
                }});
				that.stream_inspector.addCheckbox("Apply character rot",invertQuat, {name_width:"40%", callback:function(v)
				{
                    streamer.configuration.apply_character_rot = v;
                    apply_character_rot = v;
                }});
                
                // that.stream_inspector.addNumber("Scale 1/ ",scale, {name_width:"40%", step:100, min:1, max:1000, precision:0, callback:function(v)
                // {
                // 	scale = v;
                // }});
                
				// that.stream_inspector.addNumber("Frame rate",frame_rate, {name_width:"40%", step:5, min:30, max:30, precision:0, callback:function(v)
				// {
				// 	streaming_fps = v;
				// }});


				that.stream_inspector.addButton(null, "Connect", {callback:function(){
					
					var callback = function( url )
					{
						CORE.Player.showPopUpMessage("Websocket opened");
//						CORE.GUI.showOpenStreamDialog({ip:url, connected:true});
                    }
                    scene_transfer = new SceneTransfer();
                    scene_transfer.connect( IP, callback );
                    streamer = scene_transfer.character_streamer;
					console.log(IP);  
                    //streamer = new CharacterStreamer();
                    scene_transfer.onClose = function()
                    {
                        CORE.Player.showPopUpMessage("Websocket closed");
                        CORE.GUI.stream_dialog.close();
                    }
                    streamer.configuration = {};
					//streamer.connect( IP, callback );
					$("#streaming-logo").fadeIn();
					//dlg.close();
				}});
			}
			
			dlg.adjustSize();
		}

		this.stream_dialog.add(this.stream_inspector);
		this.stream_inspector.refresh();

        this.stream_dialog.show('fade');
        this.stream_dialog.setPosition(document.body.clientWidth/4 - 80,10);

    }


    showSaveSceneDialog()
    {
        if(!this.save_dialog){
            var save_dialog = this.save_dialog = new LiteGUI.Dialog( { id:"save_dialog", title:'Save Scene', close: true, minimize: false, width: 300, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
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
                save_inspector.addTitle("Add a name to the Scene");
                save_inspector.addString("Name", null, {callback:function(v)
                {
                    name = v;
                }}); 
                save_inspector.addButton(null, "Save", {callback:function()
                {
                    if(name)
                    {
                        var scenario = {};
                        scenario["scene"] = CORE.Scene.exportScenario(name);
                        scenario["agents"] = CORE.AgentManager.exportAgents();
                        scenario["paths"] = path_manager.exportPaths();
						CORE.Scene.downloadJSON(scenario, name);
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

    showDownloadBehaviourDialog()
    {
        if(!this.download_b_dialog){
            var download_b_dialog = this.download_b_dialog = new LiteGUI.Dialog( { id:"download_b_dialog", title:'Download Behaviour', close: true, minimize: false, width: 300, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.download_b_dialog.setPosition(document.body.clientWidth/2 - 150,200);

        }
        var dlg = this.download_b_dialog;

        if(!this.download_b_inpsector){
            var download_b_inpsector = this.download_b_inpsector = new LiteGUI.Inspector(),
                download_b_dialog = this.download_b_dialog;

            download_b_inpsector.on_refresh = function()
            {
                download_b_inpsector.clear();
                var name = "";
                download_b_inpsector.addTitle("Add a name to the Scene");
                download_b_inpsector.addString("Name", null, {callback:function(v)
                {
                    name = v;
                }}); 
                download_b_inpsector.addButton(null, "Save", {callback:function()
                {
                    if(name)
                    {
                        console.log("Name", name);
						var data = CORE.GraphManager.exportBehaviour(current_graph.graph);
						CORE.Scene.downloadJSON(data, name);
                        dlg.close();
                    }
                }})
                dlg.adjustSize();
            }

            this.download_b_dialog.add(download_b_inpsector);
            download_b_inpsector.refresh();
        }

        this.download_b_dialog.show('fade');
        this.download_b_dialog.setPosition(document.body.clientWidth/2 - 150,200);
    }

    showSaveBehaviourDialog()
    {
        ;
        var delete_html = '<img src="https://webglstudio.org/latest/imgs/mini-icon-trash.png" alt="W3Schools.com">'
        if(!this.save_b_dialog){
            var save_b_dialog = this.save_b_dialog = new LiteGUI.Dialog( { id:"save_b_dialog", title:'Upload Behaviour to repository', close: true, minimize: false, width: 300, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.save_b_dialog.setPosition(document.body.clientWidth/2 - 150,200);

        }
        var dlg = this.save_b_dialog;
        var tags = [];
        var description = "";
        var name = "";

        if(!this.save_b_inspector){
            var save_b_inspector = this.save_b_inspector = new LiteGUI.Inspector(),
                save_b_dialog = this.save_b_dialog;

            save_b_inspector.on_refresh = function()
            {
                save_b_inspector.clear();
                
                // save_b_inspector.addTitle("Add a name to the Behaviour");
                save_b_inspector.widgets_per_row = 1;
                save_b_inspector.addString("Name", name, {callback:function(v)
                {
                    name = v;
                }}); 
                save_b_inspector.addTextarea("Description", description, {width:"100%", callback:function(v)
                {
                    description = v;
                }}); 
                save_b_inspector.widgets_per_row = 2;

                for(var i in tags)
                {
                    save_b_inspector.addInfo("Tag", tags[i], {width:"85%"});
                    save_b_inspector.addButton(null, delete_html, {width:40,callback:function(){
                        var index = tags.indexOf(tags[i]);
                        if (index > -1) {
                            tags.splice(index, 1);
                        }
                        save_b_inspector.refresh();
                    }});

                }

                save_b_inspector.widgets_per_row = 2;

				var _k,_v,_z;
				// _z = JSON.parse(JSON.stringify(z));
				save_b_inspector.addString(null, "",  { width:"85%", placeHolder:"tag",  callback: v => _k = v });
				save_b_inspector.addButton(null, "+", {  width:40, callback: function(e)
				{
                    console.log(tags);
                    tags.push(_k.toLowerCase()); 
                    console.log(tags);
                    save_b_inspector.refresh(); 
                    // if(!_k || !_v)return;
                    //     try{  _v = JSON.parse('{ "v":'+_v+'}').v; }catch(e){ }
                    //     tags.push(_k.toLowerCase()); 
                    //     console.log(tags);
                    //     save_b_inspector.refresh(); 
				}});
                save_b_inspector.addButton(null, "Save", {width:"100%", callback:function()
                {
                    
                    if(name)
                    {
                        // console.log("Name", name);
                        var metadata = {};
                        metadata["tags"] = tags;
                        metadata["description"] = description;

                        var data = CORE.GraphManager.exportBehaviour(current_graph.graph);
                        var blob = new Blob([JSON.stringify(data)],{type:'application/json'} );
                        CORE.FS.uploadFile( "behaviors", new File([blob], name), metadata );
                        dlg.close();
                    }
                }})
                dlg.adjustSize();
            }
            var that = this;
            this.save_b_dialog.add(save_b_inspector);
            save_b_inspector.refresh();
        }
        this.save_b_dialog.show('fade');

        this.save_b_dialog.setPosition(document.body.clientWidth/2 - 150,200);
    }

	showSettingsDialog()
    {
        if(!this.settings_dialog){
            var settings_dialog = this.settings_dialog = new LiteGUI.Dialog( { id:"settings_dialog", title:'Settings', close: true, minimize: false, width: 200, height: 300, scroll: false, resizable: false, draggable: true, parent:"body"});
//            this.settings_dialog.setPosition(document.body.clientWidth/2 - 150,200);

        }
        var dlg = this.settings_dialog;

        if(!this.settings_inspector){
            var settings_inspector = this.settings_inspector = new LiteGUI.Inspector(),
                settings_dialog = this.settings_dialog;

            settings_inspector.on_refresh = function()
            {
                settings_inspector.clear();
                var name = "";
                settings_inspector.addCheckbox("Render_performance", RENDER_FPS, {name_width:"77%",callback:function(v)
                {
                    RENDER_FPS = v;
					if(v)
						$(stats.dom).show();
					else
						$(stats.dom).hide();
                }}); 

                settings_inspector.addCheckbox("Render_paths", RENDER_PATHS, {name_width:"77%", callback:function(v)
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

				settings_inspector.addCheckbox("Render_scenario", RENDER_SCENARIO, {name_width:"77%", callback:function(v)
                {
                    RENDER_PATHS = v;
					if(v)
						scenario.visible = true;
					else
						scenario.visible = false;
                }}); 
               
                dlg.adjustSize();
            }

            this.settings_dialog.add(settings_inspector);
            settings_inspector.refresh();
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

// overwrite method
Inspector.prototype.addSlider = function(name, value, options)
{
 options = this.processOptions(options);

 if(options.min === undefined)
  options.min = 0;

 if(options.max === undefined)
  options.max = 1;

 if(options.step === undefined)
  options.step = 0.01;

 //if(options.precision === undefined)
  options.precision = 3;

 var that = this;
 if(value === undefined || value === null)
  value = 0;
 this.values[name] = value;

 var element = this.createWidget(name,"<span class='inputfield full'>\
    <input tabIndex='"+this.tab_index+"' type='text' class='slider-text fixed nano' value='"+value+"' /><span class='slider-container'></span></span>", options);

 var slider_container = element.querySelector(".slider-container");

 var slider = new LiteGUI.Slider(value,options);
 slider_container.appendChild(slider.root);

 slider_container.addEventListener('dblclick', function(e) {
  
 });

 //Text change -> update slider
 var skip_change = false; //used to avoid recursive loops
 var text_input = element.querySelector(".slider-text");
 text_input.addEventListener('change', function(e) {
  if(skip_change)
   return;
  var v = parseFloat( this.value ).toFixed(options.precision);
  value = v;
  slider.setValue( v );
  Inspector.onWidgetChange.call( that,element,name,v, options );
 });

 //Slider change -> update Text
 slider.onChange = function(value) {
  text_input.value = value;
  Inspector.onWidgetChange.call( that, element, name, value, options);
 };

 this.append(element,options);

 element.setValue = function(v,skip_event) { 
  if(v === undefined)
   return;

  value = v;
  slider.setValue(v,skip_event);
 };
 element.getValue = function() { 
  return value;
 };

 this.processElement(element, options);
 return element;
}

function Slider(value, options)
{
 options = options || {};
 var canvas = document.createElement("canvas");
 canvas.className = "slider " + (options.extraclass ? options.extraclass : "");

 canvas.width = CORE.GraphManager.inspector_area.root.offsetWidth/2;
 canvas.height =  25; 
 canvas.style.position = "relative";
 canvas.style.width = "100%";
 canvas.style.height = "1.5em";
 // canvas.height = (canvas.offsetWidth / canvas.offsetHeight) / 300;
 this.root = canvas;
 var that = this;
 this.value = value;

 this.setValue = function(value, skip_event)
 {
  /*if(canvas.parentNode)
   canvas.width = canvas.parentNode.offsetWidth - 15;*/

  if(options.integer)
   value = parseInt(value);

  //var width = canvas.getClientRects()[0].width;
  var ctx = canvas.getContext("2d");
  var min = options.min || 0.0;
  var max = options.max || 1.0;
  if(value < min) value = min;
  else if(value > max) value = max;
  var range = max - min;
  var norm = (value - min) / range;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#579191";
  ctx.fillRect(0,0, canvas.width * norm, canvas.height);
  /*ctx.fillStyle = "#DA2";
  ctx.fillRect(canvas.width * norm - 1,0,2, canvas.height);*/

  ctx.fillStyle = "#EEE";
  ctx.font = "16px Arial";
//  ctx.fillText(value.toFixed(options.precision), 12, 18);

  if(value != this.value)
  {
   this.value = value;
   if(!skip_event)
   {
    LiteGUI.trigger(this.root, "change", value );
    if(this.onChange)
     this.onChange( value );
   }
  }
 }

 function setFromX(x)
 {
  var width = canvas.getClientRects()[0].width;
  var norm = x / width;
  var min = options.min || 0.0;
  var max = options.max || 1.0;
  var range = max - min;
  that.setValue( range * norm + min );
 }

 var doc_binded = null;

 canvas.addEventListener("mousedown", function(e) {
  var mouseX, mouseY;
  if(e.offsetX) { mouseX = e.offsetX; mouseY = e.offsetY; }
  else if(e.layerX) { mouseX = e.layerX; mouseY = e.layerY; } 
  setFromX(mouseX);
  doc_binded = canvas.ownerDocument;
  doc_binded.addEventListener("mousemove", onMouseMove );
  doc_binded.addEventListener("mouseup", onMouseUp );

  doc_binded.body.style.cursor = "none !important";
 });

 function onMouseMove(e)
 {
  var rect = canvas.getClientRects()[0];
  var x = e.x === undefined ? e.pageX : e.x;
  var mouseX = x - rect.left;
  setFromX(mouseX);
  e.preventDefault();
  return false;
 }

 function onMouseUp(e)
 {
  var doc = doc_binded || document;
  doc_binded = null;
  doc.removeEventListener("mousemove", onMouseMove );
  doc.removeEventListener("mouseup", onMouseUp );
  e.preventDefault();
  
  doc.body.style.cursor = "default";

  return false;
 }

 this.setValue(value);
}

LiteGUI.Slider = Slider;

CORE.registerModule( GUI );