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
            agent.dialog.setPosition(10,70);
            CORE.GUI.menu.add("Agent/" + ((agent.properties && agent.properties.name)? agent.properties.name : agent.uid), {callback: function() { 
                dialog.show('fade');             
                agent.dialog.setPosition(10,70);
            } });
            CORE.GUI.menu.remove("Agent/+ new Agent");
            CORE.GUI.menu.add("Agent/+ new Agent", () => new Agent() );
        }
        if(!agent.inspector){
            var inspector = agent.inspector = new LiteGUI.Inspector(),
                properties = agent.properties,
                dialog = agent.dialog,
                uid = agent.uid;
            inspector.on_refresh = function(){

                inspector.clear();
                    for(var p in properties){
                        let widget = null;
                        switch(properties[p].constructor.name){
                            case "Number" : widget = inspector.addNumber( p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v } } );    break;
                            case "String" : { 
                                widget = inspector.addString( p, properties[p], { key: p, callback: function(v){ 

                                //Updates name reference in menu
                                if(this.options.key == "name"){
                                    dialog.root.querySelector(".panel-header").innerText = "Agent: "+v;
                                    CORE.GUI.menu.findMenu( "Agent/"+properties[this.options.key]).name = v;
                                }
                                properties[this.options.key] = v;

                                }});    break;
                            }
                            case "Boolean":  widget = inspector.addCheckbox( p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v } } );    break;
                            case "Float32Array": 
                                switch(properties[p].length){
                                    case 2:  widget = inspector.addVector2(p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v; } }); break;
                                    case 3:  widget = inspector.addVector3(p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v; } }); break;
                                    case 4:  widget = inspector.addVector4(p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v; } }); break;
                                }break;
                            default:    
                            debugger;   
                             console.warn( "parameter type from parameter "+p+" in agent "+ uid + " was not recognised");
                        }
                        if(!widget) continue;
                        widget.classList.add("draggable-item");
                        widget.addEventListener("dragstart", function(a){ a.dataTransfer.setData("text", a.srcElement.children[0].title); });
                        widget.setAttribute("draggable", true);

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

            CORE.Player.renderStats();
        }

    }

    
}

CORE.registerModule( AgentManager );


class Agent{

    constructor( position ){
        var random =vec3.random(vec3.create(), 100);
        position = position || vec3.add(vec3.create(), vec3.create(), vec3.fromValues(random[0], 0, random[2]));
        var uid = this.uid = AgentManager.agents.length;
       
        var that = this;
        var properties = this.properties = {
            age: 35,
            name: "Billy-" + guidGenerator(),
            ubrella: "closed",
            // position: position
        }

        var skeleton = new Skeleton("skeleton1" + Math.random(), "src/assets/Walking.dae", properties.position, false);
        var animator1 = new Animator();
        animator1.animations = animations;
        animators.push( animator1 );

        var character = new Character("Billy" + Math.random(), skeleton, animator1);
        character.state = this.properties;
        // console.log(character);
        characters.push(character);
        this.character = character;
        this.characters = characters;
    
        //Store agents 
        AgentManager.agents.push(this);
    }
}

