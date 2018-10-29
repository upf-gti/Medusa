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
        
        window.blackboard2 = this.addZone("zone2" ,new Blackboard());
        window.blackboard2.setArea(0,-2500,2500,2500);
        window.blackboard2.rain = 100;

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