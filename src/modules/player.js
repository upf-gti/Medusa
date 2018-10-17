class Player{
    
    constructor(){
        if(CORE.player && CORE.player.constructor.name == this.constructor.name )
            return CORE.player;
        CORE.player = this;
    }

    preInit(){
        this.panel = new LiteGUI.Area({id:"player-area"});
        CORE.GUI.root.add( this.panel );

        var buttons = this.buttons = document.createElement("ul");
        buttons.id = "player-buttons";
        CORE.GUI.menu.panel.content.appendChild(buttons);
        window.state = STOP;

        var stats = this.stats = document.createElement("div");
        stats.className = "stats";
        CORE.Player.panel.content.appendChild(stats);
        // CORE.GUI.menu.panel.content.appendChild(current_cont)
        
        this.addButton( "<div id='play-btn' class='' >&#x25b6</div>", (e)=>{
            switch(window.state){
                case PLAYING: 
                    window.state = STOP;
                    e.currentTarget.children[0].innerHTML = "&#x25b6";
                    e.currentTarget.children[0].classList.remove("play");
                    break;
                case STOP: 
                    window.state = PLAYING;
                    e.currentTarget.children[0].innerHTML = "&#9724";
                    e.currentTarget.children[0].classList.add("play");
                    break;
            }
        });
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

    addButton( html, callback){
        var button = document.createElement("li");
        button.innerHTML = html;
        button.addEventListener("click", callback);
        this.buttons.appendChild(button);
    }

    postInit(){
        this.player = GFX.renderer;
        CORE.Player.resize();
    }

    resize() {
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

        text += "Agents: " + CORE.AgentManager.agents.length;
        text += " | Zones: " + 2;//TODO

        this.stats.innerText = text;
    }

}

CORE.registerModule( Player );