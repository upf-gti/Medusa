class Scene{
    constructor(){
        this.properties = {}
		this.last_target_id = null;
    }

    preInit(){
        
//        CORE.GUI.menu.add("Scene/· Scene Properties",{ 
//            callback:( ()=>{ 
////				console.log("GV");
//                this.toggleSceneProperties()
//            }).bind(this) 
//        });       
    }

    init(){
        this.zones = {};
        window.blackboard = this.addZone("zone1" ,new Blackboard());
        this.properties.interest_points = {}; 
        this.behaviors = {};

		for(var k in gen_behaviors)
			this.behaviors[k] = JSON.parse(gen_behaviors[k]);

//        this.behaviors = gen_behaviors;

		this.ip_setups = ip_setups;
		this.initial_behaviour = init_behaviour;
		this.bprops = this.zones["zone1"].bbvariables;
        CORE.GUI.menu.add("Tools/· Create/· Interest Point", function(){ CORE.Scene.addInterestPoint();} );

		this.createAnimationsInspector();
		this.createActionsInspector();
		this.createSceneInspector();
		this.createAgentInspector();
		
    }
    createSceneInspector()
	{
		var inspector = this.inspector = new LiteGUI.Inspector();
		var zones = this.zones;

		/**
		 * SUPER TODO
		 */
		inspector.widgets_per_row = 2;
		inspector.on_refresh = function()
		{
			var delete_html = '<img src="https://webglstudio.org/latest/imgs/mini-icon-trash.png" alt="W3Schools.com">'

			inspector.clear();
			inspector.addSection("Scene properties");
			for(let z in zones)
			{
				// inspector.addTitle(z);
//				inspector.addSeparator();
				inspector.widgets_per_row = 2;
				for(let p in zones[z].bbvariables)
				{
					var key = zones[z].bbvariables[p];
					var widget = null;
					var pretitle = "<span title='Drag " + key + "' class='keyframe_icon'></span>";
					switch(zones[z][key].constructor.name)
					{
						case "Number": {
							widget = inspector.addSlider(key, zones[z][key], { pretitle:pretitle, min:0, max:100, width:"calc(100% - 45px)", key: key, callback: function(v){ zones[z][this.options.key] = v } });
							inspector.addButton(null, delete_html, { width:40, callback: e => {
								console.log(p);
								CORE.Scene.deletePropertyFromBlackboard(key, z );
							}});
						} break;
						case "String": {
							widget = inspector.addString(key, zones[z][key], { pretitle:pretitle, width:"calc(100% - 45px)",key: key, callback: function(v){ zones[z][this.options.key] = v } }); 
							inspector.addButton(null, delete_html, { width:40, callback: e => {
								console.log(p);
								CORE.Scene.deletePropertyFromBlackboard(key, z );
							}});
						} break;
					}

					if(!widget) continue;
//					widget.classList.add("draggable-item");
					var icon = widget.querySelector(".keyframe_icon");
					if(icon){
						icon.addEventListener("dragstart", function(a)
						{  
							a.dataTransfer.setData("type", "HBTProperty" );
							a.dataTransfer.setData("name", a.srcElement.parentElement.title );
						});
						icon.setAttribute("draggable", true);
					}
				}
				inspector.addSeparator();
				inspector.widgets_per_row = 3;

				var _k,_v,_z;
				_z = JSON.parse(JSON.stringify(z));
				inspector.addString(null, "",  { width:"50%", placeHolder:"param name",  callback: v => _k = v });
				inspector.addString(null, "",  { width:"calc(50% - 45px)", placeHolder:"value",       callback: v => _v = v });
				inspector.addButton(null, "+", { zone: z, width:40, callback: function(e)
				{
				if(!_k || !_v)return;
					try{  _v = JSON.parse('{ "v":'+_v+'}').v; }catch(e){ }
					zones[this.options.zone].bbvariables.push(_k.toLowerCase()); 
					zones[this.options.zone][_k.toLowerCase()] = _v;
					inspector.refresh(); 
				}});

				inspector.widgets_per_row = 1;
				
			}
			inspector.endCurrentSection();
		}

		GraphManager.inspector_area.add(inspector);
		inspector.refresh();
	
	}

	createAnimationsInspector()
	{

		this.locomotions = this.locomotions || {
			"Idle" : {name:"Idle", anims:[{anim:"idle",weight: 1}], motion:0, speed:0.5},
			"Talking" : {name:"Talking", anims:[{anim:"talking",weight: 1}], motion:0, speed:0.5},
			"Idle Around" : {name:"Idle_Around", anims:[{anim:"idle_around",weight: 1}], motion:0.0, speed:1},
			"Walking" : {name:"Walking",  anims:[{anim:"walking",weight: 1}], motion:2.6, speed:1},
			"Walking Texting" : {name:"Walking_Texting",  anims:[{anim:"walking_texting",weight: 1}], motion:2.2, speed:1},
			"Walking Holding" : {name:"Walk_With_Bag", anims:[{anim:"walk_with_bag",weight: 1}], motion:2.2, speed:1},
			"Walking Umbrella" : {name:"Umbrella", anims:[{anim:"u mbrella",weight: 1}], motion:2.5, speed:1},
			"Running" : {name:"Running", anims:[{anim:"running",weight: 1}] , motion:6.2, speed:1},
			"Running Slow" : {name:"RunningSlow", anims:[{anim:"runningslow",weight: 1}], motion:5.4, speed:1},
			"Guitar Playing" : {name:"Guitar_Playing", anims:[{anim:"guitar_playing",weight: 1}], motion:0.0, speed:1},
			"Clapping" : {name:"Clapping", anims:[{anim:"clapping",weight: 1}], motion:0.0, speed:1},
			// "Gesture" : {name:"Gesture", anims:[{anim:"gesture",weight: 1}], motion:0, speed:0.5},
		};
	
		var inspector = this.anim_inspector = new LiteGUI.Inspector({className:"animator", height:"auto"}),
			properties = this.locomotions,
			uid = this.uid;

		inspector.on_refresh = function(){
			inspector.clear();
			inspector.addSection("HBT Cycles");
			for( let p in properties )
			{
				let widget = null;
				var pretitle = "<span title='Drag " + p + "' class='keyframe_icon'></span>";
				switch(properties[p].name.constructor.name)
				{
					case "String" : widget = inspector.addInfo( p, null, { pretitle: pretitle, name_width:"100%", className:"dragable_info", key: p, callback: function(v){ properties[ this.options.key ] = v;  } });    break;
				}
				if(!widget) continue;
				
				var icon = widget.querySelector(".keyframe_icon");
				var wname = widget.querySelector(".wname");
				if(icon)
				{
					icon.addEventListener("dragstart", function(a)
					{  
						var obj = properties[p];
						obj.filename = properties[p].name;
						obj = JSON.stringify(obj);
						a.dataTransfer.setData("obj", obj);
						a.dataTransfer.setData("type", "cycle"); 
					});
					icon.setAttribute("draggable", true);
				}
				if(wname)
				{
					wname.addEventListener("dragstart", function(a)
					{  
						var obj = properties[p];
						obj.filename = properties[p].name;
						obj = JSON.stringify(obj);
						a.dataTransfer.setData("obj", obj);
						a.dataTransfer.setData("type", "cycle"); 
					});
					wname.setAttribute("draggable", true);
				}
			}
			inspector.endCurrentSection();
		};
		GraphManager.inspector_area.add(inspector);
		inspector.refresh();
	}

	createActionsInspector()
	{

		this.actions = this.actions || {
			"Gesture" : {name:"Gesture", anims:[{anim:"gesture",weight: 1}], speed:0.5},
			"Look Around" : {name:"Look_Around", anims:[{anim:"look_around",weight: 1}], speed:0.5},
//			"Jump" : {name:"Jump",  anims:[{anim:"jump",weight: 1}], speed:1},
//			"Pick" : {name:"Pick",  anims:[{anim:"pick",weight: 1}], speed:1},	
		};
	
		var inspector = this.actions_inspector = new LiteGUI.Inspector({className:"animator", height:"auto"}),
			properties = this.actions,
			uid = this.uid;

		inspector.on_refresh = function()
		{
			inspector.clear();
			inspector.addSection("HBT Actions");
			for( let p in properties )
			{
				let widget = null;
				var pretitle = "<span title='Drag " + p + "' class='keyframe_icon'></span>";
				switch(properties[p].name.constructor.name)
				{
					case "String" : widget = inspector.addInfo( p, null, { pretitle: pretitle, name_width:"100%", className:"dragable_info", key: p, callback: function(v){ properties[ this.options.key ] = v;  } });    break;
				}
				if(!widget) continue;
				var wname = widget.querySelector(".wname");
				var icon = widget.querySelector(".keyframe_icon");
				if(icon){
					icon.addEventListener("dragstart", function(a)
					{  
						// console.log(a);
						var obj = properties[p];
						obj.filename = properties[p].name;
						obj = JSON.stringify(obj);
						a.dataTransfer.setData("obj", obj);
						a.dataTransfer.setData("type", "action"); 
					});
					icon.setAttribute("draggable", true);
				}
				if(wname)
				{
					wname.addEventListener("dragstart", function(a)
					{  
						var obj = properties[p];
						obj.filename = properties[p].name;
						obj = JSON.stringify(obj);
						a.dataTransfer.setData("obj", obj);
						a.dataTransfer.setData("type", "cycle"); 
					});
					wname.setAttribute("draggable", true);
				}
			}
			inspector.endCurrentSection();
		};
		GraphManager.inspector_area.add(inspector);
		inspector.refresh();
	}

	createAgentInspector()
	{
		var inspector = this.agent_inspector = new LiteGUI.Inspector();
                
		inspector.on_refresh = function()
		{
			var delete_html = '<img src="https://webglstudio.org/latest/imgs/mini-icon-trash.png" alt="W3Schools.com">'
			inspector.clear();
			inspector.addSection("Agent properties");
			if(!agent_selected)
			{
				inspector.addInfo("No agent selected", null, {name_width:"80%"});
			}
			else
			{
				var graphs = hbt_context.getGraphNames();
				var graphs = Object.keys(hbt_graphs);
				inspector.addCombo("Graph", agent_selected.hbtgraph, {values:graphs, callback:function(v){
					agent_selected.hbtgraph = v;
					CORE.GraphManager.putGraphOnEditor(v);
					CORE.GraphManager.top_inspector.refresh();
				}});
				
				inspector.addSeparator();
				var properties = agent_selected.properties;
				properties.position = agent_selected.scene_node.position;
				var uid = agent_selected.uid;
				inspector.widgets_per_row = 2;
				for(let p in properties)
				{
					let widget = null;
					if(properties[p] == null) continue;
					var pretitle = "<span title='Drag " + p + "' class='keyframe_icon'></span>";
					switch(properties[p].constructor.name)
					{
						case "Number" : {
							widget = inspector.addNumber( p, properties[p], { pretitle: pretitle, key: p, step:1, width:"calc(100% - 45px)", callback: function(v){ properties[this.options.key] = v } } ); 
							inspector.addButton(null, delete_html, { width:40, name_width:"0%",callback: e => {
								console.log(p);
								AgentManager.deleteProperty(p, properties[p].constructor.name );

							}});
							} break;
						case "String" : 
						{ 
							if(properties[p] == "true" || properties[p] == "false" )
							{
								var value = true;
								if(properties[p] == "false")
									value = false;
								widget = inspector.addCheckbox( p, value, { pretitle: pretitle, key: p, width:"calc(100% - 45px)",callback: function(v){ properties[this.options.key] = v } } );    
								inspector.addButton(null, delete_html, {  width:40, name_width:"0%",callback: e => {
									console.log(p);
									AgentManager.deleteProperty(p, properties[p].constructor.name );
								}});
							}
							else{
								widget = inspector.addString( p, properties[p], { pretitle: pretitle, key: p, width:"calc(100% - 45px)",callback: function(v){ 

									//Updates name reference in menu
									if(this.options.key == "name"){
										dialog.root.querySelector(".panel-header").innerText = "Agent: "+v;
										CORE.GUI.menu.findMenu( "Agent/"+properties[this.options.key]).name = v;
									}
									properties[this.options.key] = v;
	
								}});   
								inspector.addButton(null, delete_html, {  width:40, name_width:"0%",callback: e => {
									if(p == "name")
										return;
									console.log(p);
									AgentManager.deleteProperty(p, properties[p].constructor.name );
								}});
							}

							
						}break;
						case "Boolean": 
						{	
							widget = inspector.addCheckbox( p, properties[p], { pretitle: pretitle, key: p, width:"calc(100% - 45px)",callback: function(v){ properties[this.options.key] = v } } );    
							inspector.addButton(null, delete_html, {  width:40, name_width:"0%",callback: e => {
								console.log(p);
								AgentManager.deleteProperty(p, properties[p].constructor.name );
							}});
						} break;
						
						case "Array":
						case "Float32Array": 
							if(p == "position" || p == "initial_pos")
								widget = inspector.addVector3(p, properties[p], { disabled:true, pretitle: pretitle, key: p, width:"100%", callback: function(v){ 
									properties[this.options.key] = v;
									agent_selected.scene_node.position = v;
								} }); 
						
							break;
						default:    
						// debugger;   
							// console.warn( "parameter type from parameter "+p+" in agent "+ uid + " was not recognised");
					}


					if(!widget) continue;
//					widget.classList.add("draggable-item");

					var icon = widget.querySelector(".keyframe_icon");
					if(icon){
						icon.addEventListener("dragstart", function(a)
						{  
							a.dataTransfer.setData("type", "HBTProperty" );
							a.dataTransfer.setData("name", a.srcElement.parentElement.title );
						});
						icon.setAttribute("draggable", true);
					}

				}

				inspector.addSeparator();
				inspector.widgets_per_row = 3;

				var _k,_v;
				inspector.addString(null, "",  { width:"50%", placeHolder:"param name",  callback: v => _k = v });
				inspector.addString(null, "",  { width:"calc(50% - 45px)", placeHolder:"value",       callback: v => _v = v });
				inspector.addButton(null, "+", { width:40, callback: e => {
					if(!_k || !_v) 
						return;
					try{ 
						_v = JSON.parse('{ "v":'+_v+'}').v;
					}catch(e){
						//if fails it was a string, so leave it as the string it was.
					}
					properties[_k] = _v; 
					addPropertyToAgents(typeof(_v), _k.toLowerCase());
					inspector.refresh(); 
				}});

				inspector.widgets_per_row = 1;
				inspector.addSeparator();
				inspector.addSection("Agent settings");
				// debugger;
				var index = graphs.indexOf(agent_selected.hbtgraph);
				if(index == -1)
					index = 0;
				// debugger;
				
				inspector.addSeparator();
				inspector.addButton(null, "Edit material", {callback:function()
				{
					agent_selected.openEditMaterialDialog();
				}})

				inspector.addCheckbox("Stylize", stylize, {callback:function(v)
				{
					stylize = v;
				}})

				// inspector.addVector3("T-Pose config", agent_selected.t_pose_config, {callback:function(v)
				// {
				// 	agent_selected.t_pose_config = v;
				// 	agent_selected.stylizer.setTPoseQuat(v[0], v[1], v[2]);
				// }})
			}
			
		}

		GraphManager.inspector_area.add(inspector);
		inspector.refresh();
	}
	
	sceneFromJSON(data)
	{
		if(data && data.scene)
			CORE.Scene.loadScene(data.scene);
	}

    loadScene( o )
    {   
        this.properties = o; 
        this.visualizeInterestPoints();
    }
	
    loadAgent( o )
    {
        new Agent(o);
    }

    addZone( zoneID, properties ){
        if(!properties)
            return console.warn("addZone: no properties were given.")
        this.zones[zoneID] = properties;

        return properties;
    }

    toggleSceneProperties(){
        if(!this.dialog){
            var dialog = this.dialog = new LiteGUI.Dialog( { id:"Settings", title:'Scene Properties', close: true, minimize: true, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.dialog.setPosition(10,380);
        }
        var dlg = this.dialog;

        if(!this.inspector){
            var inspector = this.inspector = new LiteGUI.Inspector(),
                zones = this.zones,
                dialog = this.dialog;

            /**
             * SUPER TODO
             */
            inspector.on_refresh = function()
            {
                inspector.clear();
                
                for(let z in zones)
                {
                    // inspector.addTitle(z);
                    inspector.addSeparator();
                    for(let p in zones[z].bbvariables)
                    {
                        var key = zones[z].bbvariables[p];
                        var widget = null;
                        switch(zones[z][key].constructor.name)
                        {
                            case "Number": widget = inspector.addNumber(key, zones[z][key], { key: key, callback: function(v){ zones[z][this.options.key] = v } });break;
                            case "String": widget = inspector.addString(key, zones[z][key], { key: key, callback: function(v){ zones[z][this.options.key] = v } }); break;
                        }

                        if(!widget) continue;
                        widget.classList.add("draggable-item");
                        widget.addEventListener("dragstart", function(a)
                        {
                            a.dataTransfer.setData("type", "HBTProperty" );
							a.dataTransfer.setData("name", a.srcElement.children[0].title );
                        });
                        widget.setAttribute("draggable", true);
                    }
                    inspector.addSeparator();
                    inspector.widgets_per_row = 3;

                    var _k,_v,_z;
                    _z = JSON.parse(JSON.stringify(z));
                    inspector.addString(null, "",  { width:"45%", placeHolder:"param name",  callback: v => _k = v });
                    inspector.addString(null, "",  { width:"45%", placeHolder:"value",       callback: v => _v = v });
                    inspector.addButton(null, "+", { zone: z, width:"10%", callback: function(e)
                    {
                    if(!_k || !_v)return;
                        try{  _v = JSON.parse('{ "v":'+_v+'}').v; }catch(e){ }
                        zones[this.options.zone].bbvariables.push(_k.toLowerCase()); 
                        zones[this.options.zone][_k.toLowerCase()] = _v;
                        inspector.refresh(); 
                    }});
   
                    inspector.widgets_per_row = 1;
                    
                }
                dlg.adjustSize();
            }

            this.dialog.add(inspector);
            inspector.refresh();
        }

        this.dialog.show('fade');
        this.dialog.setPosition(10,380);

    }

    openNewInteresPointDialog( node )
    {
        var interest_points = CORE.Scene.properties.interest_points;
        var ip_types_list = Object.keys(interest_points);
        var new_ip_type;
        var a_properties = {};
        var bb_properties = {};
        var dialog = new LiteGUI.Dialog( { id:"ip-creation", title:'New Interest Point', close: true, minimize: true, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
        var ip_inspector = this.ip_creaton_inspector = new LiteGUI.Inspector();

        console.log(node);
        ip_inspector.on_refresh = function()
        {
            ip_inspector.clear();
            var name = node.name || "";
            ip_inspector.addString("Name", name, {width:"100%", callback:function(v){
                node.name = v;
            }});

            var type = new_ip_type || "";
            ip_inspector.addString("New Type", type, {width:"100%", callback:function(v){
                new_ip_type = v;
            }});
            if(ip_types_list.length)
				ip_inspector.addCombo("Type", ip_types_list[0], { values: ip_types_list, width:"100%", callback: function(v){
					new_ip_type = v;
				}});

            ip_inspector.addVector3("Position", node.position, { values: ip_types_list, width:"100%", callback: function(v){
                node.position = v;
            }});


			if(Object.keys(AgentManager.agents).length > 0)
			{
				ip_inspector.addTitle("Agent Properties");

				ip_inspector.widgets_per_row = 2;
				for(var i in a_properties)
				{
					let key = i;
					let value = a_properties[i];
					ip_inspector.addInfo(key, value, {width:"100%"});
				}
				ip_inspector.widgets_per_row = 3;
				ip_inspector.addSeparator();

				var _k,_v;
				ip_inspector.addCombo(null, Object.keys(AgentManager.properties_log)[0], {values: Object.keys(AgentManager.properties_log), width:"45%", callback:function(v){
				 _k = v;
				}});
				ip_inspector.addString(null, "",  { width:"45%", placeHolder:"value",       callback: v => _v = v });
				ip_inspector.addButton(null, "+", { width:"10%", callback: e => {
					if(!_k || !_v) 
						return;
					try{ 
						_v = JSON.parse('{ "v":'+_v+'}').v;
					}catch(e){
						//if fails it was a string, so leave it as the string it was.
					}
					a_properties[_k] = _v;
					ip_inspector.refresh();
				}});
			}


            // ip_inspector.addSeparator();
            ip_inspector.addTitle("Blackboard Properties");
            ip_inspector.widgets_per_row = 2;
            for(var i in bb_properties)
            {
                let key = i;
                let value = bb_properties[i];
                ip_inspector.addInfo(key, value, {width:"100%"});
            }
            ip_inspector.widgets_per_row = 3;
            ip_inspector.addSeparator();


            var _k2,_v2;
//            ip_inspector.addString(null, "",  { width:"45%", placeHolder:"property",  callback: v => _k2 = v });
			ip_inspector.addCombo(null, CORE.Scene.bprops[0], {values: CORE.Scene.bprops, width:"45%", callback:function(v){
				 _k2 = v;
			}});
            ip_inspector.addString(null, "",  { width:"45%", placeHolder:"value",       callback: v => _v2 = v });
            ip_inspector.addButton(null, "+", { width:"10%", callback: e => {
                console.log(CORE.Scene.bprops);
                if(!_k2 || !_v2) 
                    return;
                try{ 
                    _v2 = JSON.parse('{ "v":'+_v2+'}').v;
                }catch(e){
                    //if fails it was a string, so leave it as the string it was.
                }
                bb_properties[_k2] = _v2;
                ip_inspector.refresh();

            }});

            ip_inspector.addSeparator();

            ip_inspector.addButton(null, "Create", {width:"100%", callback:function(){

                console.log(bb_properties);
                console.log(a_properties);
                var interest_point = {};
                interest_point.position = node.position;
                interest_point.name = node.name;
                interest_point.id = node.id;
                interest_point.a_properties = a_properties;
                interest_point.bb_properties = bb_properties;
				if(!new_ip_type)
				{
					if(ip_types_list.length == 1)
						new_ip_type = ip_types_list[0];
					else 
                    	new_ip_type = "default";
				}
                if(!CORE.Scene.properties.interest_points[new_ip_type])
                    CORE.Scene.properties.interest_points[new_ip_type] = [];
                CORE.Scene.properties.interest_points[new_ip_type].push(interest_point);
                GFX.scene.root.addChild(node);
				var btn = document.getElementById("navigate-mode-btn");
				if(!btn.classList.contains("active"))
				{
					btn.classList.add("active");
				}
				document.getElementById("main_canvas").style.cursor = "default";
				scene_mode = NAV_MODE;
				CORE.Player.disableModeButtons(btn.id);
                dialog.close();
            }})
            dialog.adjustSize();
        }

		dialog.on_close = function()
		{
			var btn = document.getElementById("navigate-mode-btn");
			if(!btn.classList.contains("active"))
			{
				btn.classList.add("active");
			}
			document.getElementById("main_canvas").style.cursor = "default";
			scene_mode = NAV_MODE;
			CORE.Player.disableModeButtons(btn.id);
		}

        dialog.add(ip_inspector);
        ip_inspector.refresh();
        dialog.show('fade');
        dialog.setPosition(270,270);
	}
	
    showInterestPointInfo(ip_info, x, y)
    {
        var ip = ip_info.ip;
        console.log(ip);
        var type = ip_info.ip_type;
        var dialog = new LiteGUI.Dialog( { id:"show-ip-info", title:'Interest Point ID: ' + ip.id, close: true, minimize: false, width: 250, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
        var show_ip_inspector = new LiteGUI.Inspector();

        show_ip_inspector.on_refresh = function()
        {
            show_ip_inspector.clear();
            var name = ip.name || "";
            show_ip_inspector.addInfo("Name", name, {name_width:"40%",width:"100%"});

            // var type_ = type || "";
            show_ip_inspector.addInfo("Type", type, {name_width:"40%",width:"100%"});

            show_ip_inspector.addTitle("Agent Properties");

            show_ip_inspector.widgets_per_row = 2;
            for(var i in ip.a_properties)
            {
                let key = i;
                let value = ip.a_properties[i];
                show_ip_inspector.addInfo(key, value, {name_width:"40%",width:"100%"});
            }

            // show_ip_inspector.addSeparator();
            show_ip_inspector.addTitle("Blackboard Properties");
            show_ip_inspector.widgets_per_row = 2;
            for(var i in ip.bb_properties)
            {
                let key = i;
                let value = ip.bb_properties[i];
                show_ip_inspector.addInfo(key, value, {name_width:"40%",width:"100%"});
            }

            show_ip_inspector.addSeparator();

            show_ip_inspector.addButton(null, "Delete", {width:"100%", callback:function(){
                var interest_points = CORE.Scene.properties.interest_points;
                console.log(interest_points[type]);
                for(var i in interest_points[type])
                {
                    if(interest_points[type][i].id == ip.id)
                    interest_points[type].splice(i,1);
                }
                var node = GFX.scene._nodes_by_id[ip.id];
                if(node)
                    node.destroy();

                dialog.close();
            }})
            dialog.adjustSize();
        }

        dialog.add(show_ip_inspector);
        show_ip_inspector.refresh();
        dialog.show('fade');
        dialog.setPosition(x + 10,window.innerHeight-y - 50);
    }

    applyTargetProperties( target,  agent )
    {
        // Hacerlo por ID!!!
//		if(this.last_target_id == target.id) 
//				return;
		this.last_target_id = target.id;
        for(var i in this.properties.interest_points)
        {
            var ip_type = this.properties.interest_points[i];
            for(var j in ip_type)
            {
                var ip = ip_type[j].id;
                var ip_a_props = ip_type[j].a_properties;
                var ip_bb_props = ip_type[j].bb_properties;
                if(ip == target.id)
                {
                    for (var key in ip_a_props) 
                        if (ip_a_props.hasOwnProperty(key)) 
						{	
							if(ip_a_props[key] != agent.properties[key])
							{						
	                            agent.properties[key] = ip_a_props[key]; 
								CORE.Scene.agent_inspector.refresh();
							}

                        }
                    
                    for (var key in ip_bb_props) 
                        if (ip_bb_props.hasOwnProperty(key)) 
                            agent.blackboard[key] = ip_bb_props[key]; 
                                           
                }
            }
        }
    }

    visualizeInterestPoints()
    {
        for(var i in this.properties.interest_points)
        {
            var type = this.properties.interest_points[i];
            var color = [Math.random()+0.2, Math.random()+0.2, Math.random()+0.2]
            for(var j in type)
            {
                var ip = type[j]
                var node = new RD.SceneNode();
                node.color = color;
                node.shader = "phong";
                node.mesh = "sphere";
                node.name = ip.name;
                node.position = ip.position;
                node.scale(20,20,20);
                node.render_priority = 1;
                GFX.scene.root.addChild(node);
            }
        }
    }

    addInterestPoint( x, z )
    {
        var color = [Math.random()+0.2, Math.random()+0.2, Math.random()+0.2]
        var node = new RD.SceneNode();
        node.id = 200+ Math.floor(Math.random()*100);
        node.color = color;
        node.shader = "phong";
        node.mesh = "sphere";
        if(!x && !z)
            node.position = [0,0,0];
        else if(x && z)
            node.position = [x,0,z];
        node.scale(20,20,20);
        node.render_priority = 1;
        this.openNewInteresPointDialog(node);
        // GFX.scene.root.addChild(node);

    }

    populateScenario(num_agents, min_age, max_age)
    {
        for(var i = 0; i < num_agents; i++)
        {
            var data = {};
            var properties = {};
            data.uid = LS.generateUId('agent');  

            data.btree = null;
            data.blackboard = blackboard;
            data.path = [{id:1,pos:[1300,0,0],visited:false},{id:2,pos: [0,0,1000],visited:false} ,{id:3,pos: [-1300,0,0],visited:false}];
            data.position = [500 + Math.floor(Math.random()*7000), 0, -7000 + Math.floor(Math.random()*5000)];

            properties.name=  "Jim-" + guidGenerator();
			properties.happiness = Math.random() * 200 - 100;
			properties.energy = 0;
			properties.relax = 0;
            properties.happiness = Math.random() * (max_age - min_age) + min_age;
            properties.energy = Math.random() * (max_age - min_age) + min_age;
            properties.relax = Math.random() * (max_age - min_age) + min_age;
            properties.age = Math.random() * (max_age - min_age) + min_age;
            properties.hurry = Math.random() * (max_age - min_age) + min_age;
            properties.money = Math.random() * (max_age - min_age) + min_age;
            properties.hungry = Math.random() * 100;
            properties.umbrella = Boolean(Math.round(Math.random()));
            properties.gun = Boolean(Math.round(Math.random()));
            properties.look_at_pos = [0,0,10000];

            data.properties = properties;

            var agent = new Agent(data);
        }
    }
	
	populateStaticGroup( position, num_agents, shape, orientation, size, options )
	{
		console.log(position);
		for(var i = 0; i < num_agents; i++)
        {
			var data = {};
			data.material_uniforms = {};
            var properties = {};
            data.uid = LS.generateUId('agent');  

            data.btree = null;
            data.blackboard = blackboard;
            // data.path = [{id:1,pos:[1300,0,0],visited:false},{id:2,pos: [0,0,1000],visited:false} ,{id:3,pos: [-1300,0,0],visited:false}];
            data.position = [ position[0] -size/2 + Math.floor(Math.random()*size), 0, position[2] -size/2 + Math.floor(Math.random()*size)];

            properties.name=  "Jim-" + guidGenerator();
			properties.valence = Math.random()*10 + options.valence_;
			properties.arousal = Math.random()*10 + options.arousal_;
            properties.age = Math.random() * (options.max_age_ - options.min_age_) + options.min_age_;
            properties.strength = Math.random() * 100;
            properties.hurry = Math.random() * 100;
            properties.money = Math.random() * 100;
			properties.hungry = Math.random() * 100;
			data.material_uniforms.metalness = 1;
			data.material_uniforms.roughness = 1;
            properties.umbrella = Boolean(Math.round(Math.random()));
            properties.gun = Boolean(Math.round(Math.random()));
            properties.look_at_pos = [0,0,10000];
            data.properties = properties;

			var agent = new Agent(data);
			agent.hbtgraph = options.behaviour_;

			// Orient agent
			switch(orientation)
			{
				case "Center":
					var direction = vec3.create();
					vec3.subtract(direction, position, agent.scene_node.getGlobalPosition());
					var rotation = quat.create();
					quat.lookRotation(rotation, direction, vec3.fromValues(0,1,0));
					agent.scene_node.rotation = rotation;        
					agent.scene_node.updateMatrices();
					break;
				case "-Z":
					agent.scene_node.rotate(180*DEG2RAD, [0,1,0]);
					break;
				case "+X":
					agent.scene_node.rotate(90*DEG2RAD, [0,1,0]);
					break;
				case "-X":
					agent.scene_node.rotate(-90*DEG2RAD, [0,1,0]);
					break;
				case "Random":
					agent.scene_node.rotate(Math.floor(Math.random() * Math.floor(360))*DEG2RAD, [0,1,0]);
					break;
				default:
					break;
			}
		}

		//extra custom properties 
		if(options.extra)
			for(var i in options.extra)
				addPropertyToAgents(options.extra[i].type, options.extra[i].name);
	}

	deletePropertyFromBlackboard(property_name, zone)
	{
		delete CORE.Scene.zones[zone][property_name];
		for (var i in CORE.Scene.bprops)
		{
			var prop = CORE.Scene.bprops[i]; 
			if( prop == property_name)
			{
				var index = CORE.Scene.bprops.indexOf(prop);
				if (index > -1) 
					CORE.Scene.bprops.splice(index, 1);
								
			}
		}
		CORE.Scene.inspector.refresh();
	}

	exportScenario( filename )
	{
		var scene_obj = {};
		scene_obj = CORE.Scene.properties;
		console.log(scene_obj);
		return scene_obj;
	}

	downloadJSON(data, name)
	{
		var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
		var downloadAnchorNode = document.createElement('a');
		var filename = name || "data";
		downloadAnchorNode.setAttribute("href",     dataStr);
		downloadAnchorNode.setAttribute("download", filename + ".json");
		document.body.appendChild(downloadAnchorNode); // required for firefox
		downloadAnchorNode.click();
		downloadAnchorNode.remove();	
	}

	// importProjectFromLocalStorage()
	// {
		
	// }
	restartSimulation()
	{
		for (var i in AgentManager.agents)
		{
			var agent = AgentManager.agents[i];
			if(agent.last_controlpoint_index)
			{
				agent.last_controlpoint_index = -1;
				agent.checkNextTarget();
			}
			agent.bt_info = { running_data: {} };
			agent.scene_node.position = agent.properties.initial_pos;
		}
	}

	cleanScene()
	{
		//Clean IPs
		for(var i in GFX.scene._nodes)
		{
			var node = GFX.scene._nodes[i] 
			if(node.mesh == 'sphere')
				GFX.scene.root.removeChild(node);
		}
		this.properties.interest_points = {};
		// Clean Agents
		AgentManager.deleteAgents();
		// Clean paths
		path_manager.deleteAllPaths();
	}

    // getCanvasImage()
    // {
    //     var canvas = hbt_editor.graph_canvas.canvas;
    //     var image = canvas.toDataURL("image/png");

    //     var aLink = document.createElement('a');

    //     aLink.download = 'image.png';
    //     aLink.href = image;
    //     document.body.appendChild(aLink);
        
    //     console.log(aLink);
    // }
    
}

CORE.registerModule( Scene );