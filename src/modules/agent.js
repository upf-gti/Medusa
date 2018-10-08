var AgentManager = {
    name : "AgentManager",
    agents: new Proxy([], {
        set: (target, property, value, receiver) => {
            target[property] = value;

            if(property == "length")
                return true;
            
            AgentManager.createGUIParams( value );

            return true; 
        }     
    }),
    
    init(){
        CORE.GUI.menu.add("Agent/+ new Agent", () => new Agent() );
    },

    createGUIParams( agent ){
        
        if(!agent.dialog){
            var dialog = agent.dialog = new LiteGUI.Dialog( { id:"Settings", title:'Agent: '+ ((agent.properties && agent.properties.name)? agent.properties.name : agent.uid), close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
            CORE.GUI.menu.add("Agent/" + ((agent.properties && agent.properties.name)? agent.properties.name : agent.uid), {callback: function() { dialog.show('fade'); } });
            CORE.GUI.menu.remove("Agent/+ new Agent");
            CORE.GUI.menu.add("Agent/+ new Agent", () => new Agent() );
        }
        if(!agent.inspector){
            var inspector = agent.inspector = new LiteGUI.Inspector(),
                properties = agent.properties,
                dialog = agent.dialog;
            inspector.on_refresh = function(){

                inspector.clear();
                    for(var p in properties){
                        switch(properties[p].constructor.name){
                            case "Number" : inspector.addNumber( p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v } } );    break;
                            case "String" : { 
                                inspector.addString( p, properties[p], { key: p, callback: function(v){ 

                                    if(this.options.key == "name"){
                                        dialog.root.querySelector(".panel-header").innerText = "Agent: "+v;
                                        CORE.GUI.menu.findMenu( "Agent/"+properties[this.options.key]).name = v;
                                    }

                                    properties[this.options.key] = v 
                                } } );    break;
                            }
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
                        properties[_k] = _v; 
    
                        inspector.refresh(); 
                    }});
    
                    inspector.widgets_per_row = 1;
                    agent.dialog.adjustSize();
            }

            agent.dialog.add(inspector);
            inspector.refresh();
        }

    }

    
}

CORE.registerModule( AgentManager );


class Agent{

    constructor(){
        var uid = this.uid = AgentManager.agents.length;
        
        var properties = this.properties = {
            age: 35,
            name: "paquitaso",
            ubrella: "closed"
        }
    
        //Store agents 
        AgentManager.agents.push(this);
    }
}

