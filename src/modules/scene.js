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
        window.blackboard.setArea(-2500,-2500,0,2500);
        this.properties.interest_points = [[0,0,-500]]; 
        this.behaviors = 
        {
            behavior1: '{"last_node_id":3,"last_link_id":2,"nodes":[{"id":2,"type":"btree/Root","pos":[301,240],"size":[140,19],"flags":{"horizontal":true},"mode":0,"outputs":[{"name":"","type":"path","links":[1]}],"properties":{},"color":"#1E1E1E","boxcolor":"#999","shape":2},{"id":3,"type":"btree/SimpleAnimate","pos":[249,402],"size":[200,65],"data":{"name":"Running","anims":[{"anim":"Running","weight":1}],"motion":5,"speed":1},"flags":{"horizontal":true},"mode":0,"inputs":[{"name":"","type":"path","link":1}],"properties":{"value":1},"color":"#1B662D","bgcolor":"#384837","boxcolor":"#999","shape":2}],"links":[[1,2,0,3,0,"path"]],"groups":[],"config":{}}',
            behavior2: '{"last_node_id":10,"last_link_id":9,"nodes":[{"id":3,"type":"btree/InTarget","pos":[109,327],"size":[200,45],"data":{"name":"InTarget","threshold":200},"flags":{"resizable":false},"mode":0,"inputs":[{"name":"","type":"path","link":1,"pos":[100,-20],"dir":1},{"name":"target","type":"vec3","link":null,"pos":[0,10],"dir":3}],"outputs":[{"name":"","type":"path","links":[2,3],"pos":[100,45],"dir":2}],"properties":{},"color":"#005557","bgcolor":"#2d4243","boxcolor":"#999","shape":2},{"id":4,"type":"btree/FindNextTarget","pos":[-34,507],"size":[200,65],"data":{},"flags":{"resizable":false},"mode":0,"inputs":[{"name":"","type":"path","link":2,"pos":[100,-20],"dir":1}],"properties":{},"color":"#1B662D","bgcolor":"#384837","boxcolor":"#999","shape":2},{"id":10,"type":"btree/SimpleAnimate","pos":[800.538151171875,334.6337000000003],"size":[200,65],"data":{"name":"Walking","anims":[{"anim":"Walking","weight":1}],"motion":3,"speed":1},"flags":{"horizontal":true},"mode":0,"inputs":[{"name":"","type":"path","link":8}],"properties":{"value":1},"color":"#1B662D","bgcolor":"#384837","boxcolor":"#999","shape":2},{"id":2,"type":"btree/Root","pos":[362,206],"size":[140,19],"flags":{"horizontal":true},"mode":0,"outputs":[{"name":"","type":"path","links":[1,4,8]}],"properties":{},"color":"#1E1E1E","boxcolor":"#999","shape":2},{"id":6,"type":"btree/Conditional","pos":[385,339],"size":[200,65],"data":{"name":"rain","property_to_compare":"rain","limit_value":50},"flags":{},"mode":0,"inputs":[{"name":"","type":"path","link":4,"pos":[100,-20],"dir":1},{"name":"value","type":"number","link":null,"pos":[0,10],"dir":3}],"outputs":[{"name":"","type":"path","links":[5,7],"pos":[100,65],"dir":2}],"properties":{"value":1},"color":"#005557","bgcolor":"#2d4243","boxcolor":"#999","shape":2},{"id":5,"type":"btree/SimpleAnimate","pos":[193,502],"size":[200,65],"data":{"name":"Idle","anims":[{"anim":"Idle","weight":1}],"motion":0,"speed":0.5},"flags":{"horizontal":true},"mode":0,"inputs":[{"name":"","type":"path","link":3}],"properties":{"value":1},"color":"#1B662D","bgcolor":"#384837","boxcolor":"#999","shape":2},{"id":7,"type":"btree/Conditional","pos":[422,515],"size":[200,65],"data":{"name":"umbrella","property_to_compare":"umbrella","limit_value":null},"flags":{},"mode":0,"inputs":[{"name":"","type":"path","link":5,"pos":[100,-20],"dir":1},{"name":"value","type":"number","link":null,"pos":[0,10],"dir":3}],"outputs":[{"name":"","type":"path","links":[6],"pos":[100,65],"dir":2}],"properties":{"value":1},"color":"#005557","bgcolor":"#2d4243","boxcolor":"#999","shape":2},{"id":8,"type":"btree/SimpleAnimate","pos":[417,657],"size":[200,65],"data":{"name":"Umbrella","anims":[{"anim":"Umbrella","weight":1}],"motion":3,"speed":1},"flags":{"horizontal":true},"mode":0,"inputs":[{"name":"","type":"path","link":6}],"properties":{"value":1},"color":"#1B662D","bgcolor":"#384837","boxcolor":"#999","shape":2},{"id":9,"type":"btree/SimpleAnimate","pos":[679,530],"size":[200,65],"data":{"name":"Running","anims":[{"anim":"Running","weight":1}],"motion":5,"speed":1},"flags":{"horizontal":true},"mode":0,"inputs":[{"name":"","type":"path","link":7}],"properties":{"value":1},"color":"#1B662D","bgcolor":"#384837","boxcolor":"#999","shape":2}],"links":[[1,2,0,3,0,"path"],[2,3,0,4,0,"path"],[3,3,0,5,0,"path"],[4,2,0,6,0,"path"],[5,6,0,7,0,"path"],[6,7,0,8,0,"path"],[7,6,0,9,0,"path"],[8,2,0,10,0,"path"]],"groups":[],"config":{}}'
        }
        // window.blackboard2 = this.addZone("zone2" ,new Blackboard());
        // window.blackboard2.setArea(0,-2500,2500,2500);
        // window.blackboard2.stress = 100;
        // window.blackboard2.rain = 100;

        // CORE.GUI.menu.add("Save",{ 
        //     callback:( ()=>{ 
        //         // BTreeToJSON(BT);
        //         var saved_tree = JSON.stringify(BT.rootnode);
        //         console.log(saved_tree);
        //     }).bind(this) 
        // });
        // CORE.GUI.menu.add("Load",{ 
        //     callback:( ()=>{ 
        //         //cargarlo de servidor
        //         //funcion reconstruir arbol GRAFICO (estructura se parsea y se mete en BT.rootnode)
                
        //     }).bind(this) 
        // });
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
        this.dialog.setPosition(10,270);

    }
}

CORE.registerModule( Scene );