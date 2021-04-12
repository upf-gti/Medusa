class Player{
    
    constructor(){
        if(CORE.player && CORE.player.constructor.name == this.constructor.name )
            return CORE.player;
        CORE.player = this;
    }

    preInit(){
        this.panel = new LiteGUI.Area({id:"player-area"});
        
        CORE.GUI.player_area.add( this.panel );

        var buttons = this.buttons = document.createElement("ul");
        buttons.id = "player-buttons";
        CORE.GUI.menu.panel.content.appendChild(buttons);
        window.state = STOP;

        this.mode_buttons = [];

        var stats = this.stats = document.createElement("div");
        stats.className = "stats";
        CORE.Player.panel.content.appendChild(stats);
        // CORE.GUI.menu.panel.content.appendChild(current_cont)

        var micro_tools = this.micro_tools = document.createElement("div");
        micro_tools.id = "micro-tools";
        CORE.Player.panel.content.appendChild(micro_tools);

        var nav_mode_btn = this.nav_mode_btn = document.createElement("div");
        nav_mode_btn.className = "tool-btn";
        nav_mode_btn.classList.add("active");
        nav_mode_btn.id = "navigate-mode-btn";
        nav_mode_btn.innerHTML = '<img src="https://webglstudio.org/latest/imgs/mini-icon-camera.png" alt="W3Schools.com">';
        nav_mode_btn.title = "Navigation mode";
        nav_mode_btn.addEventListener("click", function(){
            if(!this.classList.contains("active"))
            {
                this.classList.add("active");
				
            }
            scene_mode = NAV_MODE;
            CORE.Player.disableModeButtons(this.id);
			document.getElementById("main_canvas").style.cursor = "default";

        });
        this.mode_buttons.push(nav_mode_btn);
        micro_tools.appendChild(nav_mode_btn);

		var agent_mode_btn = this.agent_mode_btn = document.createElement("div");
        agent_mode_btn.className = "tool-btn";
        agent_mode_btn.id = "agent-mode-btn";
        agent_mode_btn.innerHTML = '<i class="material-icons">accessibility_new</i>';
        agent_mode_btn.title = "Create agent";
        agent_mode_btn.addEventListener("click", function(){
            if(!this.classList.contains("active"))
            {
                this.classList.add("active");
				
            }
            scene_mode = AGENT_CREATION_MODE;
            CORE.Player.disableModeButtons(this.id);
            CORE.Player.showPopUpMessage("Click the floor to add. Press Esc to come back to navigation controls", "rgba(220, 170, 0, 0.7)", "40%");
			document.getElementById("main_canvas").style.cursor = "cell";

        });

        this.mode_buttons.push(agent_mode_btn);
        micro_tools.appendChild(agent_mode_btn);

/*******************************************************/
		var path_mode_btn = this.path_mode_btn = document.createElement("div");
        path_mode_btn.className = "tool-btn";
        path_mode_btn.id = "agent-mode-btn";
        path_mode_btn.innerHTML = '<i class="material-icons">timeline</i>';
        path_mode_btn.title = "Create path";
        path_mode_btn.addEventListener("click", function()
        {
            if(!this.classList.contains("active"))
                this.classList.add("active");

            CORE.Player.showPopUpMessage("Click the floor to add control points", "rgba(220, 170, 0, 0.7)", "50%");
			scene_mode = PATH_CREATION_MODE;
			var new_path = new Path();
			path_manager.addPath(new_path);
			current_path = new_path;
			CORE.GUI.showCreatePathDialog();        
			CORE.Player.disableModeButtons(this.id);
			document.getElementById("main_canvas").style.cursor = "cell";

        });

        this.mode_buttons.push(path_mode_btn);
        micro_tools.appendChild(path_mode_btn);

        // var area_mode_btn = this.area_mode_btn = document.createElement("div");
        // area_mode_btn.className = "tool-btn";
        // area_mode_btn.id = "ip-mode-btn";
        // area_mode_btn.innerHTML = '<i class="material-icons">layers</i>';
        // area_mode_btn.title = "Create Smart Area";
        // area_mode_btn.addEventListener("click", function()
        // {
        //     if(!this.classList.contains("active"))
        //         this.classList.add("active");
            
        //     CORE.Player.showPopUpMessage("Click the floor to add vertex of the area");
        //     CORE.GUI.showCreateAreaDialog();
        //     scene_mode = AREA_CREATION_MODE;
        //     CORE.Player.disableModeButtons(this.id);
		// 	document.getElementById("main_canvas").style.cursor = "cell";

        // });
        // this.mode_buttons.push(area_mode_btn);
        // micro_tools.appendChild(area_mode_btn);

/********************************************************/
        var ip_mode_btn = this.ip_mode_btn = document.createElement("div");
        ip_mode_btn.className = "tool-btn";
        ip_mode_btn.id = "ip-mode-btn";
        ip_mode_btn.innerHTML = '<i class="material-icons">add_location</i>';
        ip_mode_btn.title = "Create Interest Point";
        ip_mode_btn.addEventListener("click", function(){
            if(!this.classList.contains("active"))
            {
                this.classList.add("active");
				
            }
            CORE.Player.showPopUpMessage("Click the floor to add. Press Esc to come back to navigation controls", "rgba(220, 170, 0, 0.7)", "40%");
            scene_mode = IP_CREATION_MODE;
            CORE.Player.disableModeButtons(this.id);
			document.getElementById("main_canvas").style.cursor = "cell";

        });
        this.mode_buttons.push(ip_mode_btn);
        micro_tools.appendChild(ip_mode_btn);

        var agent_label_btn = this.agent_label_btn = document.createElement("div");
        agent_label_btn.className = "tool-btn";
        agent_label_btn.id = "agent-label--btn";
        // agent_label_btn.innerHTML = '&#9964';
        agent_label_btn.innerHTML = '<i class="material-icons">perm_identity</i>';
        agent_label_btn.title = "Visualize Agent Labels";
        agent_label_btn.addEventListener("click", function(){
            if(!this.classList.contains("active"))
            {
                this.classList.add("active");
            }
            else{
                this.classList.remove("active");
            }
            CORE.Labels.agent_label_visibility = ! CORE.Labels.agent_label_visibility;

        });
        this.mode_buttons.push(agent_label_btn);
        micro_tools.appendChild(agent_label_btn);

        var ip_label_btn = this.ip_label_btn = document.createElement("div");
        ip_label_btn.className = "tool-btn";
        ip_label_btn.id = "ip-label-btn";
        // ip_label_btn.innerHTML = '&#9964';
        ip_label_btn.innerHTML = '<i class="material-icons">not_listed_location</i>';
        ip_label_btn.title = "Visualize Interest Points labels";
        ip_label_btn.addEventListener("click", function(){
            if(!this.classList.contains("active"))
            {
                this.classList.add("active");
            }
            else{
                this.classList.remove("active");
            }
            CORE.Labels.ip_label_visibility = ! CORE.Labels.ip_label_visibility;

        });
        this.mode_buttons.push(ip_label_btn);
        micro_tools.appendChild(ip_label_btn);

        this.popup_message = document.createElement("div");
		this.popup_message.id = "snackbar";
		this.popup_message.innerHTML = "Click on the floor to select the center of the group";
		var popup_container = document.getElementById("player-area");
		popup_container.appendChild(this.popup_message);


        var inner = '<i id="play-btn" class="material-icons">play_arrow</i>';

        this.addButton( "<div id='play-btn' class='' >&#x25b6</div>","upper", inner, (e)=>{
            switch(window.state){
                case PLAYING: 
                    window.state = STOP;
                    e.currentTarget.innerHTML = '<i id="play-btn" class="material-icons">play_arrow</i>';
                    e.currentTarget.children[0].classList.remove("play");
                    hbt_editor.graph.status = 1;
                    hbt_editor.graph.execution_timer_id = 0;
                    break;
                case STOP: 
                    window.state = PLAYING;
                    e.currentTarget.innerHTML = '<i id="play-btn" class="material-icons">stop</i>';
                    e.currentTarget.children[0].classList.add("play");
					hbt_editor.graph.start();
                    break;
            }
        });

		//STREAMING BUTTON
		var url = '<i id="streaming-logo" class="material-icons">settings_input_antenna</i>';
		this.addButton( "<div id='streaming-img' class='' ></div>", "stream", url,  (e)=>{
            if(streamer)
			{
				scene_transfer.close();
				$("#streaming-logo").fadeOut();
			}
        });

		$("#streaming-logo").fadeOut();


		var agent_info_panel = this.agent_info_panel = document.createElement("div");
		agent_info_panel.id = "agent_info_panel";

//		var canvas = document.getElementById("main_canvas");
    }
	
	showPopUpMessage( message, color, pos ){
		var x = document.getElementById("snackbar");
		x.className = "show";
        x.innerHTML = message || "Click the floor";
        x.style.backgroundColor = color;
        x.style.left = pos;
		setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
	}
    init(){

        CORE.GUI.root.addEventListener("split_moved", this.resize.bind(this));
        window.addEventListener("resize", this.resize.bind(this));

        //CORE.GUI.menu.panel.content.innerHTML += "<div>HolaCaracola</div>";



        // this.player = new LS.Player( CORE.config.player || { 
        //     alpha: true,
        //     premultipliedAlpha: false,
        //     container: this.panel.content,         
        //     "width":"100%", "height":"100%",
        //     "resources": "resources/",
        //     "shaders": "data/shaders.xml" 
        // } );



        // if( CORE.config.default_scene )
        //     this.player.loadScene( CORE.config.default_scene );

        // this.player.play();
    }

    addButton( html, id, inner, callback){
        var button = document.createElement("li");
		button.id = id;
        button.innerHTML = inner;
        button.addEventListener("click", callback);
		CORE.GUI.menu_area.content.appendChild(button);
//        this.buttons.appendChild(button);
    }

    disableModeButtons( id )
    {
        for(var i in this.mode_buttons)
        {
            if(this.mode_buttons[i].classList.contains("active") && this.mode_buttons[i].id!=id)
                this.mode_buttons[i].classList.remove("active");
        }
    }

    postInit(){
        this.player = GFX.renderer;
        CORE.Player.resize();
    }

    resize() {
//        console.log("player resize");
        if(!this.player || !this.player.canvas) return;

        // Lookup the size the browser is displaying the canvas.
        var displayWidth  = this.player.canvas.parentElement.offsetWidth;
        var displayHeight = this.player.canvas.parentElement.offsetHeight;
       
        // Check if the canvas is not the same size.
        if (this.player.canvas.width  != displayWidth ||
            this.player.canvas.height != displayHeight) {
       
          // Make the canvas the same size
          this.player.canvas.width  = displayWidth;
          this.player.canvas.height = displayHeight;
        }
    }

    renderStats(){
        if(!this.stats)
            throw "stats div not created / ready yet";

        var text = "";
        text += "Agents in the scene: " + Object.keys(CORE.AgentManager.agents).length;
		text += "   |    Paths: " + Object.keys(path_manager._paths).length

        this.stats.innerText = text;
    }

}

CORE.registerModule( Player );