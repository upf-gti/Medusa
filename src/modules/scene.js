class Scene{
    constructor(){
        this.properties = {}
    }

    preInit(){
        
        CORE.GUI.menu.add("Scene",{ 
            callback:( ()=>{ 
                this.toggleSceneProperties()
            }).bind(this) 
        });
        // CORE.GUI.menu.add("Tools/  - Switch create Agent onClick",{ 
        //     callback:( ()=>{ 
        //         creation_mode = !creation_mode;
        //     }).bind(this) 
        // });

       
    }

    init(){
        this.zones = {};

        window.blackboard = this.addZone("zone1" ,new Blackboard());
        // window.blackboard.setArea(-2500,-2500,0,2500);

        this.properties.interest_points = 
        {
            // shops:[
            //     { pos:[0,0,-1000], a_properties:{umbrella:true}, bb_properties:{}, name: "Shop1", id:10}, 
            //     { pos:[1000.5,0.7,1000.4], a_properties:{umbrella:true}, bb_properties:{}, name: "Shop2", id:11}
            // ], 

            // banks:[
            //     { pos:[200,0,2000], a_properties:{money:50}, bb_properties:{}, name: "Bank1", id:12}
            // ],

            // restaurants:[
            //     { pos:[-500,0,1100], a_properties:{hungry:false}, bb_properties:{}, name: "McDonalds", id:13}, 
            // ], 

        }; 

        this.behaviors = gen_behaviors;
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
            var dialog = this.dialog = new LiteGUI.Dialog( { id:"Settings", title:'Scene Properties', close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
            this.dialog.setPosition(10,270);

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
                    inspector.addTitle(z);
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
                            var obj = {name:a.srcElement.children[0].title, property_to_compare:a.srcElement.children[0].title, limit_value:50};
                            obj = JSON.stringify(obj);
                            a.dataTransfer.setData("obj", obj); 
                        });
                        widget.setAttribute("draggable", true);
                    }
                    inspector.addSeparator();
                    inspector.widgets_per_row = 3;

                    var _k,_v,_z;
                    _z = JSON.parse(JSON.stringify(z));
                    inspector.addString(null, "",  { width:"45%", placeHolder:"param name...",  callback: v => _k = v });
                    inspector.addString(null, "",  { width:"45%", placeHolder:"value...",       callback: v => _v = v });
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
        this.dialog.setPosition(10,325);

    }
    applyTargetProperties( target,  agent )
    {
        // Hacerlo por ID!!!
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
        node.color = color;
        node.shader = "phong";
        node.mesh = "sphere";
        node.position = [x,0,z];
        node.scale(20,20,20);
        node.render_priority = 1;
        this.openNewInteresPointDialog(node);
        // GFX.scene.root.addChild(node);

    }

    openNewInteresPointDialog( node )
    {
        var interest_points = CORE.Scene.properties.interest_points;
        var ip_types_list = Object.keys(interest_points);
        var new_ip_type;
        var a_properties = {};
        var bb_properties = {};

        var dialog = new LiteGUI.Dialog( { id:"ip-creation", title:'New Interest Point', close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
        var inspector = this.inspector = new LiteGUI.Inspector();

        inspector.on_refresh = function()
        {
            console.log(node);
            inspector.clear();
            inspector.addInfo("New Interest Point creation", "",{width:"100%"});
            var name = node.name || "";
            inspector.addString("Name", name, {width:"100%", callback:function(v){
                node.name = v;
            }});

            var type = new_ip_type || "";
            inspector.addString("New Type", type, {width:"100%", callback:function(v){
                new_ip_type = v;
            }});
            
            inspector.addCombo("Type", ip_types_list[0], { values: ip_types_list, width:"100%", callback: function(v){
                new_ip_type = v;
            }});

            // inspector.addSeparator();
            inspector.addTitle("Agent Properties");

            inspector.widgets_per_row = 2;
            for(var i in a_properties)
            {
                let key = i;
                let value = a_properties[i];
                inspector.addInfo(key, value, {width:"100%"});
            }
            inspector.widgets_per_row = 3;
            inspector.addSeparator();

            var _k,_v;
            inspector.addString(null, "",  { width:"45%", placeHolder:"propery...",  callback: v => _k = v });
            inspector.addString(null, "",  { width:"45%", placeHolder:"value...",       callback: v => _v = v });
            inspector.addButton(null, "+", { width:"10%", callback: e => {
                if(!_k || !_v) 
                    return;
                try{ 
                    _v = JSON.parse('{ "v":'+_v+'}').v;
                }catch(e){
                    //if fails it was a string, so leave it as the string it was.
                }
                a_properties[_k] = _v;
                inspector.refresh();
            }});

            // inspector.addSeparator();
            inspector.addTitle("Blackboard Properties");
            inspector.widgets_per_row = 2;
            for(var i in bb_properties)
            {
                let key = i;
                let value = a_properties[i];
                inspector.addInfo(key, value, {width:"100%"});
            }
            inspector.widgets_per_row = 3;
            inspector.addSeparator();


            var _k2,_v2;
            inspector.addString(null, "",  { width:"45%", placeHolder:"propery...",  callback: v => _k2 = v });
            inspector.addString(null, "",  { width:"45%", placeHolder:"value...",       callback: v => _v2 = v });
            inspector.addButton(null, "+", { width:"10%", callback: e => {
                if(!_k2 || !_v2) 
                    return;
                try{ 
                    _v2 = JSON.parse('{ "v":'+_v2+'}').v;
                }catch(e){
                    //if fails it was a string, so leave it as the string it was.
                }
                bb_properties[_k2] = _v2;
            }});

            inspector.addSeparator();

            inspector.addButton(null, "Create", {width:"100%", callback:function(){

                console.log(bb_properties);
                console.log(a_properties);
                var interest_point = {};
                interest_point.pos = node.position;
                interest_point.name = node.name;
                interest_point.id = 50 + Math.round(Math.random()*100);
                interest_point.a_properties = a_properties;
                interest_point.bb_properties = bb_properties;
                if(!CORE.Scene.properties.interest_points[new_ip_type])
                    CORE.Scene.properties.interest_points[new_ip_type] = [];
                CORE.Scene.properties.interest_points[new_ip_type].push(interest_point);
                GFX.scene.root.addChild(node);
                dialog.close();
            }})
            dialog.adjustSize();
        }

        dialog.add(inspector);
        inspector.refresh();
        dialog.show('fade');
        dialog.setPosition(270,270);
    }
}

CORE.registerModule( Scene );