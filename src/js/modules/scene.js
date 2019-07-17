class Scene{
    constructor(){
        this.properties = {}
		this.last_target_id = null;
    }

    preInit(){
        
        CORE.GUI.menu.add("Scene/· Scene Properties",{ 
            callback:( ()=>{ 
                this.toggleSceneProperties()
            }).bind(this) 
        });       
    }

    init(){
        this.zones = {};
        window.blackboard = this.addZone("zone1" ,new Blackboard());
        this.properties.interest_points = {}; 
        this.behaviors = gen_behaviors;
		this.initial_behaviour = init_behaviour;
		this.bprops = this.zones["zone1"].bbvariables;
        CORE.GUI.menu.add("Actions/· Create/· New Interest Point", function(){ CORE.Scene.addInterestPoint();} );
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
            
            ip_inspector.addCombo("Type", ip_types_list[0], { values: ip_types_list, width:"100%", callback: function(v){
                new_ip_type = v;
            }});

            ip_inspector.addVector3("Position", node.position, { values: ip_types_list, width:"100%", callback: function(v){
                node.position = v;
            }});


            // ip_inspector.addSeparator();
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
                interest_point.pos = node.position;
                interest_point.name = node.name;
                interest_point.id = node.id;
                interest_point.a_properties = a_properties;
                interest_point.bb_properties = bb_properties;
                if(!new_ip_type)
                    new_ip_type = "default";
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
		if(this.last_target_id == target.id) 
				return;
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
                            agent.properties[key] = ip_a_props[key]; 
                        
                    
                    for (var key in ip_bb_props) 
                        if (ip_bb_props.hasOwnProperty(key)) 
                            agent.blackboard[key] = ip_bb_props[key]; 
                                           
                }
            }
        }
        agent.inspector.refresh();
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
                node.position = ip.pos;
                node.scale(40,40,40);
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
            data.position = [-1000 +Math.floor(Math.random()*2000), 0, -1000 + Math.floor(Math.random()*1000)];

            properties.name=  "Billy-" + guidGenerator();
            properties.age = Math.random() * (max_age - min_age) + min_age;
            properties.hurry = Math.random() * (max_age - min_age) + min_age;
            properties.money = Math.random() * (max_age - min_age) + min_age;
            properties.hungry = Boolean(Math.round(Math.random()));
            properties.umbrella = Boolean(Math.round(Math.random()));
            properties.look_at_pos = [0,0,10000];

            data.properties = properties;

            var agent = new Agent(data);
        }
    }

    restartScenario()
    {
        for(var c in AgentManager.agents)
        {
            var agent = AgentManager.agents[c];
            agent.restorePath();
            agent.skeleton.skeleton_container.position = [-200 + Math.floor(Math.random()*400),0,-200 + Math.floor(Math.random()*400)];
            agent.skeleton.skeleton_container.updateMatrices();
            agent.bt_info.running_node_index = null;
        }
    }

    // getCanvasImage()
    // {
    //     var canvas = node_editor.graph_canvas.canvas;
    //     var image = canvas.toDataURL("image/png");

    //     var aLink = document.createElement('a');

    //     aLink.download = 'image.png';
    //     aLink.href = image;
    //     document.body.appendChild(aLink);
        
    //     console.log(aLink);
    // }
    
}

CORE.registerModule( Scene );