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
    }

    toggleSceneProperties(){
        if(!this.dialog){
            var dialog = this.dialog = new LiteGUI.Dialog( { id:"Settings", title:'Scene Properties', close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
        }

        if(!this.inspector){
            var inspector = this.inspector = new LiteGUI.Inspector(),
                properties = this.properties,
                dialog = this.dialog;
            inspector.on_refresh = function(){

                inspector.clear();
                    for(var p in properties){
                        switch(properties[p].constructor.name){
                            case "Number" :   inspector.addNumber( p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v } } );    break;
                            case "String" :   inspector.addString( p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v } } );    break;
                            case "Boolean": inspector.addCheckbox( p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v } } );    break;
                            default:        console.warn( "parameter type from parameter "+p+" in agent "+ uid + " was not recognised");
                        }
                    }
    
                    inspector.addSeparator();
                    inspector.widgets_per_row = 3;
    
                    var _k,_v;
                    inspector.addString(null, "",  { width:"45%", placeHolder:"param name...",  callback: v => _k = v });
                    inspector.addString(null, "",  { width:"45%", placeHolder:"value...",       callback: v => _v = v });
                    inspector.addButton(null, "+", { width:"10%", callback: e => {
                        if(!_k || !_v) 
                            return;
                        try{ 
                            _v = JSON.parse('{ "v":'+_v+'}').v;
                        }catch(e){
                            //if fails it was a string, so leave it as the string it was.
                        }
                        debugger;
                        properties[_k] = _v; 
    
                        inspector.refresh(); 
                    }});
    
                    inspector.widgets_per_row = 1;
                    this.dialog.adjustSize();
            }

            this.dialog.add(inspector);
            inspector.refresh();
        }

        this.dialog.show('fade');

    }
}

CORE.registerModule( Scene );