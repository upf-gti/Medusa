var GUI = {
    tools_inspector: null, 
    tools_container: null,

    nav_inspector: null, 
    nav_container: null,

    types_inspector: null, 
    types_container: null,

    params_inspector:null, 
    params_container:null,

    node_inspector: null, 
    node_container: null,
    current_node:null,

    current_animation_name: null,
    current_baseanimation_name:null,
    current_mixinganimation_name:null,
    debug_weight_of_merge: 0.0,

    initializeGUI: function(){


        //Aqui va la interfaz general
        this.createNav();
        this.createSceneTools();
        this.createEditorInterface();
    

    },

    createNav: function(){
        this.nav_inspector = new LiteGUI.Inspector();
        this.nav_inspector.on_refresh = function(){
            if(GUI.nav_inspector)
                GUI.nav_inspector.clear();
            GUI.nav_inspector.widgets_per_row = 5;
            GUI.nav_inspector.addInfo("BehaviourTee Animator", "", {disabled:true, name_width:"100%",width:"62%"})
            GUI.nav_inspector.addCheckbox("Play",false,{width:"8%",callback: function(value) { 
                state = state == PLAYING ? STOP : PLAYING; 
            } });
            // GUI.nav_inspector.addContainer("WebGL",{id:"switch-container"});
            GUI.nav_inspector.addButton(null,"Scene", { width:"10%",callback:function(){
                $("#scene-container").show();
                $("#editor-container").hide();
            }} );

            GUI.nav_inspector.addButton(null,"Editor", {width:"10%",callback:function(){
                $("#editor-container").show();
                $("#scene-container").hide();
            }} );

            GUI.nav_inspector.addButton("Update Tree","&#x21BA", {name_width:"75%",width:"8%",  callback:function(){

                node_editor.updateTree(node_editor.root_node);
            }});


        }
        GUI.nav_inspector.refresh();
        $("#nav-container").append(this.nav_inspector.root);
    },

    createSceneTools: function(){

        this.tools_inspector = new LiteGUI.Inspector();        
        this.tools_inspector.on_refresh = function(){
            if(GUI.tools_inspector)
                GUI.tools_inspector.clear();

            var animations = getListOfAnimations();

            GUI.tools_inspector.addSection("Tools", {collapsed:false});

            // GUI.tools_inspector.addCheckbox("Follow",false,{callback: function(value) { 
            //     console.log(value);
            //     enable_update_camera = value; 
            // } });
            // GUI.tools_inspector.addCheckbox("Use BT",use_BT,{callback: function(value) { 
            //     console.log(value);
            //     use_BT = value; 
            // } });

            GUI.tools_inspector.endCurrentSection();

            GUI.tools_inspector.addSection("Blackboard params", {collapsed:false});
            GUI.tools_inspector.addInfo("","Parameters of the environment", {name_width:"15%",width:"100%"});
            GUI.tools_inspector.addSlider("Rain", blackboard.rain ,{ width: "100%", name_width:"30%", min:0,max:2,step:0.1, callback: function(value){
                if(!use_BT)
                    return;
                blackboard.rain = value;
                if(BT){
                    BT.rootnode.tick(character);
                }

            }});
            GUI.tools_inspector.addSlider("Global Stress", blackboard.stress ,{ width: "100%", name_width:"30%", min:0,max:2,step:0.1, callback: function(value){
                if(!use_BT)
                    return;
                blackboard.stress = value;
                // if(BT){
                //     BT.rootnode.tick(character);
                // }

            }});
            GUI.tools_inspector.endCurrentSection();

            GUI.tools_inspector.addButton(null, "Create Agent" ,{ width: "100%", callback: function(){
                console.log("Create Agent mode activated");
                creation_mode = true;

            }});

            /*****************************************DEBUG******************************************************* */

            // GUI.tools_inspector.addSection("Testing Section", {collapsed:true});
            // GUI.tools_inspector.addCombo("Base animation", GUI.current_baseanimation_name, { values: animations, callback: function(v) { 
            //     if(use_BT)
            //         return;
            //     animator.base_animation = getAnimationByName(v);
            //     GUI.current_baseanimation_name = v;
            //     GUI.tools_inspector.refresh();
            //     } });

            // GUI.tools_inspector.addCombo("Mixing animation", GUI.current_mixinganimation_name, { values: animations, callback: function(v) { 
            //     if(use_BT)
            //         return;
            //     var anim =  animator.getMergeAnim(v);
            //     GUI.current_mixinganimation_name = v;
            //     GUI.tools_inspector.refresh();
            // }});

            // GUI.tools_inspector.addSlider("Weight of merging", GUI.debug_weight_of_merge ,{ width: "100%", name_width:"20%", min:0,max:1,step:0.1, callback: function(value){
            //     if(use_BT)
            //         return;
            //     GUI.debug_weight_of_merge = value;
            //     console.log(animator); 
            //     // alert("STOP");
            //     var anim = animator.getMergeAnim(GUI.current_mixinganimation_name);
            //     anim.target_weight = value;
            // }});
            // GUI.tools_inspector.endCurrentSection();

            /*****************************************END DEBUG******************************************************* */

        }
        this.tools_inspector.refresh();

        $("#gui-tools").append(this.tools_inspector.root);
    },

    createEditorInterface: function(){

        this.types_inspector = new LiteGUI.Inspector();        
        this.types_inspector.on_refresh = function(){
            if(GUI.types_inspector)
                GUI.types_inspector.clear();

            GUI.types_inspector.addSection("Simple types", {collapsed:true});
            //***************************************************************** Parte Condicional ***********************************************/
            GUI.types_inspector.addButton("Conditional","+", {name_width:"80%",width:"100%", micro:true, callback:function(){

                var dialog = new LiteGUI.Dialog({title:"New Conditional Node", parent: "body",close: true, width: 300, height: 120, scroll: false, draggable: true});
                var widgets = new LiteGUI.Inspector();

                var property_to_comp = null;
                var threshold = 0;

                dialog.add(widgets);
                widgets.addCombo("Param to evaluate", null, { values: blackboard.bbvariables, name_width:"60%",callback: function(v) { 
                    property_to_comp = v;
                    GUI.tools_inspector.refresh();
                    } });
                widgets.addNumber("Threshold", threshold ,{name_width:"40%", callback:function(v){
                    threshold = v;
                }});
                widgets.addButton(null,"Create", {callback:function(){ 
                    console.log("Create ConditionalNode"); 
                    var node_cond = LiteGraph.createNode("btree/conditional");
                    node_cond.pos = [400,200];
                    node_cond.properties["limit_value"] = threshold;
                    node_cond.properties["property_to_compare"] = property_to_comp;
                    node_editor.graph.add(node_cond);
                    console.log(threshold)
                    var node = BT.addConditionalNode(node_cond.id, "Conditional", property_to_comp, threshold );
                    console.log(node);
                    dialog.close();
                }});

                //show and ensure the content fits
                dialog.show();
                dialog.adjustSize();
            }});
            //************************************************************ END Parte Condicional ***********************************************/
            //***************************************************************** Parte InTarget ***********************************************/

            GUI.types_inspector.addButton("InTarget","+", {name_width:"80%",width:"100%", micro:true, callback:function(){
                var dialog = new LiteGUI.Dialog({title:"New InTarget Node", parent: "body",close: true, width: 300, height: 120, scroll: false, draggable: true});
                var widgets = new LiteGUI.Inspector();
                var threshold = 0;
                
                dialog.add(widgets);
                widgets.addNumber("Threshold",threshold,{name_width:"40%", callback:function(v){
                    threshold = v;
                }});
                widgets.addButton(null,"Create", function(){
                    console.log("Create ConditionalNode"); 
                    var node = LiteGraph.createNode("btree/intarget");
                    node.pos = [400,200];
                    node.properties["limit_value"] = threshold;
                    node_editor.graph.add(node);
                    var n = new InTargetNode(node.id, BT,blackboard, threshold )
                    dialog.close();
                });

                //show and ensure the content fits
                dialog.show();
                dialog.adjustSize();
            }});

            //***************************************************************** END Parte InTarget ***********************************************/
            //***************************************************************** Parte Leaf ***********************************************/

            GUI.types_inspector.addButton("Leaf","+", {name_width:"80%",width:"100%", micro:true, callback:function()
            {
                var merge_animations = [];
                var params = {speed:1, motion:3};

                var dialog = new LiteGUI.Dialog({title:"New Animate Node", parent: "body",close: true, width: 500, height: 150, scroll: false, draggable: true});
                var widgets = new LiteGUI.Inspector();
                var threshold = null;
                
                dialog.add(widgets);
                widgets.widgets_per_row = 2;

                var animations  = getListOfAnimations();

                widgets.addButton(null,"Create", function()
                { 
                    // console.log("Create Leaf"); 
                    // console.log(merge_animations);
                    // console.log(params);
                    var node = LiteGraph.createNode("btree/leaf");
                    node.pos = [400,200];
                    node.properties["merge_animations"] = merge_animations;
                    node.properties["params"] = params;
                    node_editor.graph.add(node);
                    var n = BT.addAnimationNode(node.id, merge_animations, params.speed,params.motion);
                    dialog.close();
                });
                

                widgets.addButton(null, "Add animation", {callback:function()
                {
                    var merge_anim = {}
                    merge_anim.weight = 0;
                    widgets.widgets_per_row = 3;
                    widgets.addCombo("Animation", null, { values: animations, name_width:"60%",callback: function(v) 
                    { 
                        merge_anim.anim = v;
                        // GUI.tools_inspector.refresh();
                       
                    } });
                    widgets.addSlider("Weight",merge_anim.weight, {min:0, max:1, step:0.1, callback:function(v)
                    {
                        merge_anim.weight = v;
                        // console.log(merge_anim);
                    }});
                    widgets.addButton(null, "Ok", {micro:true, callback:function()
                    {
                        merge_animations.push(merge_anim);
                        // console.log(merge_anim);
                    }})
                    
                    dialog.adjustSize();
                }});

                widgets.addSlider("Speed", params.speed, {min:0, max:3, step:0.1, callback:function(v){
                    params.speed = v;

                }});
                widgets.addSlider("Motion",params.motion, {min:0, max:10, step:0.1, callback:function(v){
                    params.motion = v;

                }});
                widgets.addSeparator()

                //show and ensure the content fits
                dialog.show();
                dialog.adjustSize();
            }});

            //***************************************************************** END Parte Leaf ***********************************************/

            GUI.types_inspector.endCurrentSection();

            GUI.types_inspector.addSection("Composite types", {collapsed:true});

            GUI.types_inspector.addButton("Sequencer","+", {name_width:"80%",width:"100%", micro:true});
            GUI.types_inspector.addButton("Selector","+", {name_width:"80%",width:"100%", micro:true});


            GUI.types_inspector.endCurrentSection();

            /*****************************************END DEBUG******************************************************* */

        }
        this.types_inspector.refresh();

        $("#gui-types").append(this.types_inspector.root);

        this.params_inspector = new LiteGUI.Inspector();
        this.params_inspector.on_refresh = function()
        {
            if(GUI.params_inspector)
                GUI.params_inspector.clear();
        
            // console.log(GUI.current_node);
            GUI.params_inspector.addSection("Environmental parameters", {collapsed:false});

            for(var i in blackboard.bbvariables)
            {
                var param = blackboard.bbvariables[i];
                var container = GUI.params_inspector.addInfo(param, null, {name_width:"90%", draggable:true, pretitle: AnimationModule.getKeyframeCode( "Hola", "parameter")});
                container.addEventListener("dragstart", function(a)
                {
                    // console.log("dragstart",a.srcElement.children[0].title);
                    a.dataTransfer.setData("text", a.srcElement.children[0].title);
                });
                container.setAttribute("draggable", true);
            }
            GUI.params_inspector.endCurrentSection();

            GUI.params_inspector.addSection("Agent parameters", {collapsed:false});
            for(var key in character.state)
            {
                if (character.state.hasOwnProperty(key)) {
                    // console.log(key + " -> " + p[key]);
                    var cont = GUI.params_inspector.addInfo(key, null, {name_width:"90%",draggable:true, pretitle: AnimationModule.getKeyframeCode( "Hola", "parameter")});
                    cont.addEventListener("dragstart", function(a)
                    {
                        // console.log("dragstart",a.srcElement.children[0].title);
                        a.dataTransfer.setData("text", a.srcElement.children[0].title);
                    });
                    cont.setAttribute("draggable", true);
                }

            }
            GUI.params_inspector.endCurrentSection();
            GUI.params_inspector.addSeparator();

            GUI.params_inspector.addSection("Basic Actions", {collapsed:false});

            var cont = GUI.params_inspector.addInfo("Idle", null, {name_width:"90%",draggable:true, pretitle: AnimationModule.getKeyframeCode( "Hola", "parameter")});
            cont.addEventListener("dragstart", function(a)
            {
                // console.log("dragstart",a.srcElement.children[0].title);
                a.dataTransfer.setData("text", a.srcElement.children[0].title);
                a.dataTransfer.setData("type", "action");

            });
            cont.setAttribute("draggable", true);

            var cont2 = GUI.params_inspector.addInfo("Walking", null, {name_width:"90%",draggable:true, pretitle: AnimationModule.getKeyframeCode( "Hola", "parameter")});
            cont2.addEventListener("dragstart", function(a)
            {
                // console.log("dragstart",a.srcElement.children[0].title);
                a.dataTransfer.setData("text", a.srcElement.children[0].title);
                a.dataTransfer.setData("type", "action");
            });
            cont2.setAttribute("draggable", true);

            var cont3 = GUI.params_inspector.addInfo("Running", null, {name_width:"90%",draggable:true, pretitle: AnimationModule.getKeyframeCode( "Hola", "parameter")});
            cont3.addEventListener("dragstart", function(a)
            {
                // console.log("dragstart",a.srcElement.children[0].title);
                a.dataTransfer.setData("text", a.srcElement.children[0].title);
                a.dataTransfer.setData("type", "action");
            });
            cont3.setAttribute("draggable", true);



            AnimationModule.attachKeyframesBehaviour(GUI.params_inspector);
        }.bind(this);

        this.params_inspector.refresh();


        $("#scene-params").append(this.params_inspector.root);

        
        this.node_inspector = new LiteGUI.Inspector();        
        this.node_inspector.on_refresh = function()
        {
            // console.log("Refresh");
            if(GUI.node_inspector)
                GUI.node_inspector.clear();
            
            // console.log(GUI.current_node);
            GUI.node_inspector.addTitle("Current Node", {collapsed:false});
            if(!GUI.current_node_id)
                GUI.current_node_id = 1;

            var node = BT.getNodeById(GUI.current_node_id);
            console.log(node);
            GUI.guiFromType(node.type, GUI.node_inspector, node);

            GUI.node_inspector.addSeparator();

        }  

        this.node_inspector.refresh();

        $("#scene-params").append(this.node_inspector.root);

    },

    guiFromType: function(type, inspector, node)
    {
        if(type == "conditional")
        {
            //GUI for conditional nodes
            inspector.addInfo("Type" , type);
            inspector.addString("Title", node.title, {callback:function(v)
            {
                node.title = v;
            }} );
            inspector.addCombo("Param to evaluate", node.property_to_compare, { values: blackboard.bbvariables, callback: function(v) 
            { 
                node.property_to_compare = v;
                // GUI.tools_inspector.refresh();
            } });
            inspector.addNumber("Threshold",node.limit_value, {callback:function(v)
            {
                node.limit_value = v;
            }});

        }
        else if(type == "root")
        {
            inspector.addInfo("Type" , "Root node");
        }
        else if(type == "intarget" )
        {
            inspector.addInfo("Type" , type);
            inspector.addString("Title", node.title );
            inspector.addNumber("Threshold");
        }
        else if(type == "animation" )
        {
            inspector.addInfo("Type" , type);
            inspector.addString("Title", node.title, {callback:function(v)
            {
                node.title = v;
            }} );
            inspector.addInfo("Animations with the weights",null, {name_width:"100%"});
            inspector.widgets_per_row = 2;

            var animation_names = getListOfAnimations();
            for(var i = 0; i < node.anims.length; i++)
            {
                var anim = node.anims[i];
                inspector.addCombo("Anim", anim.anim, { values: animation_names, width:"60%",callback: function(v) 
                    { 
                        anim.anim = v;
                        // GUI.tools_inspector.refresh();
                } });
                inspector.addNumber("Weight",anim.weight, {width:"40%",name_width:"50%",callback:function(v)
                    {
                        anim.weight = v;
                }});
            }
            
            inspector.addNumber("Motion", node.params.motion, {callback:function(v)
            {
                node.params.motion = v;
            }});
            inspector.addNumber("Speed", node.params.speed, {callback:function(v)
            {
                node.params.speed = v;
            }});
            inspector.widgets_per_row = 1;


        }
    }

   
}